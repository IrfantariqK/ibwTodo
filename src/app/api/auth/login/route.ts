import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

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

    // Find user by email in MongoDB Atlas ONLY
    const userDoc = await User.findOne({ email: cleanEmail });

    if (!userDoc) {
      return NextResponse.json(
        { error: "No account found with this email. Please sign up or accept your project invite first." },
        { status: 401 }
      );
    }

    // Check if account email is verified
    if (userDoc.status === "Pending Verification" || userDoc.isVerified === false) {
      return NextResponse.json(
        {
          error: "Your email is not verified yet. Please enter the 6-digit verification code sent to your email.",
          requireOtp: true,
          email: cleanEmail,
        },
        { status: 403 }
      );
    }

    // Check account status if set
    if (userDoc.status === "Pending Acceptance") {
      return NextResponse.json(
        { error: "Your project invitation is pending. Please click the invitation link sent to your email to activate your account." },
        { status: 403 }
      );
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, userDoc.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // Sign a JWT token with the real user's details from MongoDB
    const token = jwt.sign(
      { userId: userDoc._id.toString(), email: userDoc.email, name: userDoc.name, role: userDoc.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const isClient = userDoc.type === "client" || userDoc.role?.toLowerCase().includes("client");
    const userRole = isClient ? (userDoc.role || "Client") : "Leader";
    const userType = isClient ? "client" : "leader";

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
