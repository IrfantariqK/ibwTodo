import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { sendVerificationOtpEmail } from "@/lib/nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
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

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      if (existing.isVerified) {
        return NextResponse.json(
          { error: "An account with this email already exists and is verified. Please sign in." },
          { status: 409 }
        );
      } else {
        // Generate new 6-digit OTP for unverified existing user
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedPassword = await bcrypt.hash(password, 12);
        
        existing.name = name.trim();
        existing.password = hashedPassword;
        existing.verificationOtp = otpCode;
        existing.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        existing.status = "Pending Verification";
        await existing.save();

        await sendVerificationOtpEmail({ email: cleanEmail, name: name.trim(), otp: otpCode });

        return NextResponse.json({
          success: true,
          requireOtp: true,
          email: cleanEmail,
          message: "A 6-digit verification code has been sent to your email.",
        });
      }
    }

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save new user to MongoDB Atlas as Leader with Pending Verification status
    await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "Leader",
      type: "leader",
      status: "Pending Verification",
      isVerified: false,
      verificationOtp: otpCode,
      otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
    });

    // Send email with 6-digit OTP
    await sendVerificationOtpEmail({ email: cleanEmail, name: name.trim(), otp: otpCode });

    return NextResponse.json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      message: "Registration successful! A 6-digit verification code has been sent to your email.",
    });
  } catch (error: any) {
    console.error("Signup error:", error?.message || error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
