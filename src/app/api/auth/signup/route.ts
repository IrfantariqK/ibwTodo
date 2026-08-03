import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "ibwtech_taskconnect_secret";

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
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save new user to MongoDB Atlas as Leader
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: "Leader",
      type: "leader",
      status: "Active",
    });

    // Sign a JWT token
    const token = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email, name: newUser.name, role: "Leader", type: "leader" },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const userData = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: "Leader",
      type: "leader",
    };

    const response = NextResponse.json({ success: true, user: userData });

    // Set JWT in HTTP-only cookie (secure, no JS access)
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
    console.error("Signup error:", error?.message || error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
