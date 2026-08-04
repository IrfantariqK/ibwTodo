import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "ibwtech_taskconnect_secret";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { error: "Database connection failed. Please check MongoDB Atlas." },
        { status: 503 }
      );
    }

    const userDoc = await User.findOne({ email: cleanEmail });

    if (!userDoc) {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }

    if (userDoc.isVerified && userDoc.status === "Active") {
      return NextResponse.json(
        { success: true, message: "Account is already verified." }
      );
    }

    // Verify 6-digit OTP code
    if (userDoc.verificationOtp !== cleanOtp) {
      return NextResponse.json(
        { error: "Invalid 6-digit verification code. Please check your email and try again." },
        { status: 400 }
      );
    }

    // Verify OTP expiration
    if (userDoc.otpExpiresAt && new Date(userDoc.otpExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Verification code has expired. Please click 'Resend Code' to receive a new code." },
        { status: 400 }
      );
    }

    // Update user status in MongoDB Atlas to Verified & Active
    userDoc.isVerified = true;
    userDoc.status = "Active";
    userDoc.verificationOtp = "";
    await userDoc.save();

    // Sign JWT token
    const token = jwt.sign(
      {
        userId: userDoc._id.toString(),
        email: userDoc.email,
        name: userDoc.name,
        role: userDoc.role || "Leader",
        type: userDoc.type || "leader",
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const userData = {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role || "Leader",
      type: userDoc.type || "leader",
      avatar: userDoc.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userDoc.email)}`,
    };

    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully!",
      user: userData,
    });

    // Set auth_token cookie
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
    console.error("OTP verification error:", error?.message || error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
