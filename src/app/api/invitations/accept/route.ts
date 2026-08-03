import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import User from "@/models/User";
import Activity from "@/models/Activity";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Invitation token is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
    }

    const invite = await Invitation.findOne({ token });
    if (!invite) {
      return NextResponse.json({ error: "Invitation token invalid or expired" }, { status: 404 });
    }

    if (invite.status === "accepted") {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
        invite,
        message: "Invitation has already been accepted.",
      });
    }

    // Mark invitation as accepted
    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await invite.save();

    // Activate User in MongoDB Atlas
    await User.findOneAndUpdate(
      { email: invite.email },
      { status: "Active" }
    );

    // Create live activity notification for Workspace Admin/Team
    const userTypeLabel = invite.type === "client" ? "Client Contact" : "Team Member";
    try {
      await Activity.create({
        user: invite.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(invite.email)}`,
        action: `accepted project invitation`,
        target: `${userTypeLabel} (${invite.projectName})`,
        timeAgo: "Just now",
      });
    } catch (actErr) {
      console.warn("Activity creation warning on invite accept:", actErr);
    }

    return NextResponse.json({
      success: true,
      invite,
      message: `${userTypeLabel} invitation accepted successfully.`,
    });
  } catch (error: any) {
    console.error("GET /api/invitations/accept error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process invitation" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json({ error: "Invitation token is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
    }

    const invite = await Invitation.findOne({ token });
    if (!invite) {
      return NextResponse.json({ error: "Invitation token invalid or expired" }, { status: 404 });
    }

    if (invite.status === "accepted") {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
        invite,
      });
    }

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await invite.save();

    await User.findOneAndUpdate(
      { email: invite.email },
      { status: "Active" }
    );

    const userTypeLabel = invite.type === "client" ? "Client Contact" : "Team Member";
    try {
      await Activity.create({
        user: invite.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(invite.email)}`,
        action: `accepted project invitation`,
        target: `${userTypeLabel} (${invite.projectName})`,
        timeAgo: "Just now",
      });
    } catch (actErr) {
      console.warn("Activity creation warning on invite accept:", actErr);
    }

    return NextResponse.json({
      success: true,
      invite,
    });
  } catch (error: any) {
    console.error("POST /api/invitations/accept error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process invitation" }, { status: 500 });
  }
}
