import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Project from "@/models/Project";
import Invitation from "@/models/Invitation";

import { chatEmitter } from "@/lib/chatEvents";

const JWT_SECRET = process.env.JWT_SECRET || "ibwtech_taskconnect_secret";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json(
        { error: "Database connection failed. Please check MongoDB Atlas." },
        { status: 503 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Find user by email in MongoDB Atlas User collection
    let userDoc = await User.findOne({ email: cleanEmail });

    // 2. If userDoc does NOT exist in User collection, check if assigned in Projects or Invitations!
    if (!userDoc) {
      const projectWithClient = await Project.findOne({
        $or: [
          { "clients.email": cleanEmail },
          { "teamMembers.email": cleanEmail },
        ],
      }).lean();

      const invitationDoc = await Invitation.findOne({ email: cleanEmail }).lean();

      if (projectWithClient || invitationDoc) {
        // Auto-provision user account on the fly for added Client / Team Member
        const hashedPassword = await bcrypt.hash(password, 10);
        const isClient =
          (invitationDoc as any)?.type === "client" ||
          (projectWithClient as any)?.clients?.some((c: any) => c.email?.toLowerCase().trim() === cleanEmail);

        const memberName =
          (invitationDoc as any)?.name ||
          (projectWithClient as any)?.clients?.find((c: any) => c.email?.toLowerCase().trim() === cleanEmail)?.name ||
          (projectWithClient as any)?.teamMembers?.find((m: any) => m.email?.toLowerCase().trim() === cleanEmail)?.name ||
          cleanEmail.split("@")[0];

        const memberRole =
          (invitationDoc as any)?.role ||
          (isClient ? "Client Lead" : "Team Member");

        const memberType = isClient ? "client" : "team";

        userDoc = await User.create({
          name: memberName,
          email: cleanEmail,
          password: hashedPassword,
          role: memberRole,
          type: memberType,
          status: "Active",
          isVerified: true,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
        });
      } else {
        return NextResponse.json(
          { error: "No account found with this email. Please sign up or accept your project invite first." },
          { status: 401 }
        );
      }
    }

    // 3. Verify password with bcrypt
    let isPasswordValid = await bcrypt.compare(password, userDoc.password);

    // If initial bcrypt check fails, check if password matches autoPassword from invitation
    if (!isPasswordValid) {
      const invitationDoc = await Invitation.findOne({ email: cleanEmail }).lean();
      if (invitationDoc && (invitationDoc as any).autoPassword === password) {
        // Re-hash and save matching password
        userDoc.password = await bcrypt.hash(password, 10);
        userDoc.status = "Active";
        userDoc.isVerified = true;
        await userDoc.save();
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please check your credentials or invitation email." },
        { status: 401 }
      );
    }

    // Activate account if password was valid and mark presence as Online
    userDoc.status = "Active";
    userDoc.isVerified = true;
    userDoc.isOnline = true;
    userDoc.presenceStatus = "online";
    userDoc.lastActive = new Date();
    await userDoc.save();

    try {
      chatEmitter.emit("chat:event", {
        type: "presence:update",
        payload: { email: cleanEmail, presenceStatus: "online", isOnline: true },
      });
    } catch (e) {}

    const isClient = userDoc.type === "client" || userDoc.role?.toLowerCase().includes("client");
    const isTeam = userDoc.type === "team" || userDoc.role?.toLowerCase().includes("team");

    let userType = "leader";
    let userRole = "Leader";

    if (isClient) {
      userType = "client";
      userRole = userDoc.role || "Client";
    } else if (isTeam) {
      userType = "team";
      userRole = userDoc.role || "Team Member";
    } else {
      userType = userDoc.type || "leader";
      userRole = userDoc.role || "Leader";
    }

    // Sign a JWT token with the real user's details from MongoDB
    const token = jwt.sign(
      { userId: userDoc._id.toString(), email: userDoc.email, name: userDoc.name, role: userRole, type: userType },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const userData = {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userRole,
      type: userType,
      avatar: userDoc.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userDoc.email)}`,
    };

    const response = NextResponse.json({ success: true, user: userData });

    // Set JWT in HTTP-only cookie
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error?.message || error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
