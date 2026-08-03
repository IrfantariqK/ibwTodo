import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Invitation from "@/models/Invitation";
import Project from "@/models/Project";
import { generateAutoPassword, sendInvitationEmail } from "@/lib/nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, role, type, projectId, projectName } = body;

    if (!email || !name || !projectId) {
      return NextResponse.json({ error: "Missing required invitation fields (email, name, projectId)" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const memberRole = role || (type === "client" ? "Client Lead" : "Team Member");
    const memberType = type === "client" ? "client" : "team";

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
    }

    // Check project title
    let projName = projectName;
    if (!projName) {
      const projDoc = await Project.findById(projectId).lean();
      if (projDoc) projName = (projDoc as any).name;
    }

    // Auto-generate secure password
    const autoPassword = generateAutoPassword();
    const hashedPassword = await bcrypt.hash(autoPassword, 10);
    const token = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 1. Create or update User in MongoDB with status "Pending Acceptance"
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      // If user already exists, update password and status
      existingUser.password = hashedPassword;
      existingUser.status = "Pending Acceptance";
      existingUser.role = memberRole;
      existingUser.type = memberType;
      await existingUser.save();
    } else {
      await User.create({
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: memberRole,
        type: memberType,
        status: "Pending Acceptance",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
      });
    }

    // 2. Save Invitation document in MongoDB
    const invitationDoc = await Invitation.create({
      token,
      email: cleanEmail,
      name: cleanName,
      role: memberRole,
      type: memberType,
      projectId,
      projectName: projName || "Workspace Project",
      autoPassword,
      status: "pending",
    });

    // Dynamic host header calculation for any port (3000, 3001, etc.)
    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protoHeader = req.headers.get("x-forwarded-proto") || "http";
    const dynamicBaseUrl = `${protoHeader}://${hostHeader}`;

    // 3. Send email with auto-generated password and accept link
    await sendInvitationEmail({
      email: cleanEmail,
      name: cleanName,
      role: memberRole,
      type: memberType,
      projectName: projName || "TaskConnect Project",
      autoPassword,
      token,
      baseUrl: dynamicBaseUrl,
    });

    return NextResponse.json({
      success: true,
      token,
      autoPassword,
      message: `Invitation sent to ${cleanEmail} with auto-generated password`,
    });
  } catch (error: any) {
    console.error("POST /api/invitations/send error:", error);
    return NextResponse.json({ error: error?.message || "Failed to send invitation" }, { status: 500 });
  }
}
