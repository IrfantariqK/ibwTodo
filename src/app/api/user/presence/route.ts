import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { chatEmitter } from "@/lib/chatEvents";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, presenceStatus } = await req.json();
    if (!email || !presenceStatus) {
      return NextResponse.json({ error: "Email and presenceStatus are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const validStatus = ["online", "offline", "busy"].includes(presenceStatus)
      ? presenceStatus
      : "online";

    const db = await connectToDatabase();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    const isOnline = validStatus !== "offline";
    const updatedUser = await User.findOneAndUpdate(
      { email: cleanEmail },
      { presenceStatus: validStatus, isOnline, lastActive: new Date() },
      { new: true }
    );

    try {
      chatEmitter.emit("chat:event", {
        type: "presence:update",
        payload: { email: cleanEmail, presenceStatus: validStatus, isOnline },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      presenceStatus: validStatus,
      isOnline,
    });
  } catch (error: any) {
    console.error("POST /api/user/presence error:", error);
    return NextResponse.json({ error: "Failed to update presence status" }, { status: 500 });
  }
}
