import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { chatEmitter } from "@/lib/chatEvents";

const JWT_SECRET = process.env.JWT_SECRET || "ibwtech_taskconnect_secret";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    let emailToLogout = "";

    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        emailToLogout = decoded?.email || "";
      } catch (e) {}
    }

    if (!emailToLogout) {
      try {
        const body = await req.json();
        emailToLogout = body.email || "";
      } catch (e) {}
    }

    if (emailToLogout) {
      const cleanEmail = emailToLogout.toLowerCase().trim();
      const db = await connectToDatabase();
      if (db) {
        await User.findOneAndUpdate(
          { email: cleanEmail },
          { isOnline: false, presenceStatus: "offline", lastActive: new Date() }
        );

        try {
          chatEmitter.emit("chat:event", {
            type: "presence:update",
            payload: { email: cleanEmail, presenceStatus: "offline", isOnline: false },
          });
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn("Logout presence update warning:", err);
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  response.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
