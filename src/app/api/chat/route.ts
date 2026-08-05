import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";
import Activity from "@/models/Activity";
import { chatEmitter } from "@/lib/chatEvents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const recipientId = (searchParams.get("recipientId") || "").toLowerCase().trim();
    const senderEmail = (searchParams.get("senderEmail") || searchParams.get("email") || "").toLowerCase().trim();
    const projectId = searchParams.get("projectId");

    const db = await connectToDatabase();
    if (!db) return NextResponse.json([], { headers: NO_CACHE_HEADERS });

    const query: any = {};

    // Filter out messages deleted specifically for this requesting user
    if (senderEmail) {
      query.deletedForUsers = { $ne: senderEmail };
    }

    if (recipientId) {
      const regexRecipient = new RegExp(`^${recipientId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");
      if (senderEmail) {
        const regexSender = new RegExp(`^${senderEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i");
        query.$or = [
          { recipientId: regexRecipient, "sender.email": regexSender },
          { recipientId: regexSender, "sender.email": regexRecipient },
          { recipientId: regexRecipient },
          { "sender.email": regexRecipient },
        ];
      } else {
        query.$or = [
          { recipientId: regexRecipient },
          { "sender.email": regexRecipient },
        ];
      }
    } else if (channelId) {
      query.channelId = channelId;
      if (projectId && projectId !== "all") {
        query.$or = [
          { projectId: projectId },
          { projectId: "all" },
          { projectId: "" },
          { projectId: { $exists: false } },
        ];
      }
    } else if (projectId && projectId !== "all") {
      query.projectId = projectId;
    }

    const messages = await Message.find(query).sort({ createdAt: 1 }).lean();
    const formatted = messages.map((m: any) => ({
      ...m,
      id: m._id ? m._id.toString() : m.id,
    }));

    return NextResponse.json(formatted, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json([], { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const senderObj =
      typeof body.sender === "object"
        ? body.sender
        : {
            name: body.sender || "Irfan Tariq",
            avatar: body.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
            role: "Member",
            email: body.email || "irfan@ibwtech.com",
          };

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
    }

    const doc = await Message.create({
      projectId: body.projectId || "",
      channelId: body.channelId || "general",
      recipientId: body.recipientId || "",
      sender: senderObj,
      content: body.content || (body.isVoiceNote ? "🎤 Voice Note" : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isCodeSnippet: !!body.isCodeSnippet,
      isVoiceNote: !!body.isVoiceNote,
      audioUrl: body.audioUrl || "",
      audioDuration: body.audioDuration || "0:00",
      isEdited: false,
      isDeletedForEveryone: false,
      deletedForUsers: [],
    });

    try {
      await Activity.create({
        user: senderObj.name,
        avatar: senderObj.avatar,
        action: body.isVoiceNote ? "sent a voice note in" : "posted message in",
        target: body.recipientId ? `DM with ${body.recipientId}` : `#${body.channelId || "general"}`,
        timeAgo: "Just now",
      });
    } catch (actErr) {
      console.warn("Activity creation warning:", actErr);
    }

    const result = {
      ...doc.toObject(),
      id: doc._id.toString(),
      status: "delivered",
    };

    try {
      chatEmitter.emit("chat:event", { type: "message:new", payload: result });
    } catch (e) {}

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/chat error:", error?.message || error);
    return NextResponse.json({ error: "Failed to post message to MongoDB" }, { status: 500 });
  }
}

/**
 * PATCH /api/chat
 * Edit a sent message
 */
export async function PATCH(req: Request) {
  try {
    const { messageId, content, userEmail } = await req.json();
    if (!messageId || !content || !content.trim()) {
      return NextResponse.json({ error: "Message ID and content are required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) return NextResponse.json({ error: "Database connection failed" }, { status: 503 });

    const msg = await Message.findById(messageId);
    if (!msg) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Permission check: Sender verification
    const senderEmail = (msg.sender?.email || "").toLowerCase().trim();
    const reqEmail = (userEmail || "").toLowerCase().trim();
    if (senderEmail && reqEmail && senderEmail !== reqEmail) {
      return NextResponse.json({ error: "Only the message sender can edit this message" }, { status: 403 });
    }

    msg.content = content.trim();
    msg.isEdited = true;
    await msg.save();

    const updated = {
      ...msg.toObject(),
      id: msg._id.toString(),
    };

    try {
      chatEmitter.emit("chat:event", { type: "message:edited", payload: updated });
    } catch (e) {}

    return NextResponse.json(updated, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error("PATCH /api/chat error:", error);
    return NextResponse.json({ error: "Failed to edit message" }, { status: 500 });
  }
}

/**
 * DELETE /api/chat
 * WhatsApp-style Delete for Me & Delete for Everyone
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const mode = searchParams.get("mode") || "everyone";
    const userEmail = (searchParams.get("userEmail") || "").toLowerCase().trim();

    if (!messageId) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) return NextResponse.json({ error: "Database connection failed" }, { status: 503 });

    const msg = await Message.findById(messageId);
    if (!msg) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const senderEmail = (msg.sender?.email || "").toLowerCase().trim();

    if (mode === "everyone") {
      // Permission check: only sender can delete for everyone
      if (senderEmail && userEmail && senderEmail !== userEmail) {
        return NextResponse.json({ error: "Only the message sender can delete this message for everyone" }, { status: 403 });
      }

      msg.isDeletedForEveryone = true;
      msg.content = "This message was deleted";
      msg.isEdited = false;
      await msg.save();

      const updated = {
        ...msg.toObject(),
        id: msg._id.toString(),
      };

      try {
        chatEmitter.emit("chat:event", {
          type: "message:deleted",
          payload: { messageId, mode: "everyone", message: updated },
        });
      } catch (e) {}

      return NextResponse.json(updated, { headers: NO_CACHE_HEADERS });
    } else {
      // Delete for Me
      if (userEmail) {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { deletedForUsers: userEmail },
        });
      }

      try {
        chatEmitter.emit("chat:event", {
          type: "message:deleted",
          payload: { messageId, mode: "me", userEmail },
        });
      } catch (e) {}

      return NextResponse.json({ success: true, messageId, mode: "me" }, { headers: NO_CACHE_HEADERS });
    }
  } catch (error: any) {
    console.error("DELETE /api/chat error:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
