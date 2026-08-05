import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getDefaultAvatar } from "@/lib/avatars";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

/**
 * PUT / POST /api/user/avatar
 * Edit & update profile avatar for user in MongoDB Atlas
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, avatar } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    if (!avatar || !avatar.trim()) {
      return NextResponse.json({ error: "Avatar URL is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanAvatar = avatar.trim();

    // Update user avatar in MongoDB Atlas User collection
    const updatedUser = await User.findOneAndUpdate(
      { email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } },
      { $set: { avatar: cleanAvatar, updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile avatar updated successfully",
        avatar: cleanAvatar,
        user: {
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatar: cleanAvatar,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("PUT /api/user/avatar error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to update profile avatar" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(req: Request) {
  return PUT(req);
}

/**
 * DELETE /api/user/avatar
 * Reset/Delete custom avatar and restore default seed avatar in MongoDB Atlas
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "User email parameter is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const defaultAvatarUrl = getDefaultAvatar(cleanEmail);

    const updatedUser = await User.findOneAndUpdate(
      { email: { $regex: new RegExp(`^${cleanEmail}$`, "i") } },
      { $set: { avatar: defaultAvatarUrl, updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile avatar deleted and reset to default",
        avatar: defaultAvatarUrl,
        user: {
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatar: defaultAvatarUrl,
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("DELETE /api/user/avatar error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to delete profile avatar" },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
