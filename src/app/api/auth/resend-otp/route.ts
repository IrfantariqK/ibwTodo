import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { sendVerificationOtpEmail } from "@/lib/nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { error: "Database connection failed." },
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
        { success: true, message: "Account is already verified. Please sign in." }
      );
    }

    // Generate new random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    userDoc.verificationOtp = otpCode;
    userDoc.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await userDoc.save();

    // Send email with new 6-digit OTP
    await sendVerificationOtpEmail({ email: cleanEmail, name: userDoc.name, otp: otpCode });

    return NextResponse.json({
      success: true,
      message: "A new 6-digit verification code has been sent to your email.",
    });
  } catch (error: any) {
    console.error("Resend OTP error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to resend code. Please try again." },
      { status: 500 }
    );
  }
}
