import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";
import { chatEmitter } from "@/lib/chatEvents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is a typing indicator payload
    if (body.type === "typing") {
      try {
        chatEmitter.emit("chat:event", {
          type: "typing",
          payload: {
            user: body.userName || body.userEmail || "Someone",
            userEmail: body.userEmail || "",
            channelId: body.channelId || "general",
            recipientId: body.recipientId || "",
            isTyping: !!body.isTyping,
          },
        });
      } catch (e) {}

      return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
    }

    const { messageIds, channelId, recipientId, userEmail, userName } = body;

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 503, headers: NO_CACHE_HEADERS });
    }

    const filter: any = {};
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      filter._id = { $in: messageIds };
    } else if (recipientId && userEmail) {
      // Mark direct messages sent to userEmail as seen
      filter.recipientId = userEmail;
      filter.seen = { $ne: true };
    } else if (channelId) {
      filter.channelId = channelId;
      filter.seen = { $ne: true };
    }

    // Exclude messages sent by the user themselves
    if (userEmail) {
      filter["sender.email"] = { $ne: userEmail };
    }

    const updateResult = await Message.updateMany(filter, {
      $set: {
        seen: true,
        seenAt: new Date(),
        seenBy: userName || userEmail || "User",
        status: "seen",
      },
    });

    try {
      chatEmitter.emit("chat:event", {
        type: "message:seen",
        payload: {
          channelId: channelId || "",
          recipientId: recipientId || "",
          userEmail: userEmail || "",
          userName: userName || "",
        },
      });
    } catch (e) {}

    return NextResponse.json(
      { success: true, modifiedCount: updateResult.modifiedCount },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("POST /api/chat/read error:", error?.message || error);
    return NextResponse.json({ error: "Failed to mark messages as seen" }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
