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

    if (recipientId) {
      // Direct Conversation between two users (Ignore projectId filter for DMs)
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
    });

    // Log activity
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
