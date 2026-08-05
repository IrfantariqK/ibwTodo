import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET(req: Request) {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { leaders: [], teamMembers: [], clients: [], allUsers: [] },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const users = await User.find({}).sort({ name: 1 }).lean();

    const formattedUsers = users.map((u: any) => {
      const roleStr = u.role || "";
      const typeStr = u.type || "";
      const emailStr = (u.email || "").toLowerCase().trim();

      let detectedType: "leader" | "client" | "team" = "team";
      if (typeStr === "leader" || roleStr.toLowerCase().includes("leader") || emailStr.includes("leader")) {
        detectedType = "leader";
      } else if (typeStr === "client" || roleStr.toLowerCase().includes("client") || emailStr.includes("client")) {
        detectedType = "client";
      }

      return {
        id: u._id ? u._id.toString() : u.id,
        name: u.name || "Workspace User",
        email: u.email,
        role: u.role || (detectedType === "leader" ? "Project Leader" : detectedType === "client" ? "Client Contact" : "Team Member"),
        type: detectedType,
        avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || "User")}`,
        isOnline: Boolean(u.isOnline),
        presenceStatus: u.presenceStatus || (u.isOnline ? "online" : "offline"),
        lastSeen: u.lastActive || u.updatedAt || u.createdAt || new Date(),
      };
    });

    // Default seed contacts if MongoDB User collection is currently empty
    let leaders = formattedUsers.filter((u) => u.type === "leader");
    let clients = formattedUsers.filter((u) => u.type === "client");
    let teamMembers = formattedUsers.filter((u) => u.type === "team");

    if (leaders.length === 0) {
      leaders = [
        {
          id: "leader-seed-1",
          name: "Irfan Tariq",
          email: "leader@taskconnect.io",
          role: "Project Leader / Workspace Admin",
          type: "leader",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
          isOnline: false,
          presenceStatus: "offline",
          lastSeen: new Date(),
        },
      ];
    }

    if (clients.length === 0) {
      clients = [
        {
          id: "client-seed-1",
          name: "Client Partner",
          email: "client@acme.com",
          role: "Client Contact",
          type: "client",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Client",
          isOnline: false,
          presenceStatus: "offline",
          lastSeen: new Date(),
        },
      ];
    }

    return NextResponse.json(
      {
        leaders,
        clients,
        teamMembers,
        allUsers: [...leaders, ...clients, ...teamMembers],
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error("GET /api/users error:", error?.message || error);
    return NextResponse.json(
      { leaders: [], clients: [], teamMembers: [], allUsers: [] },
      { headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, isOnline } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      await User.updateOne(
        { email: { $regex: new RegExp(`^${email.trim()}$`, "i") } },
        {
          $set: {
            updatedAt: new Date(),
          },
        }
      );
    }

    return NextResponse.json({ success: true, email, isOnline: !!isOnline });
  } catch (error: any) {
    console.error("POST /api/users error:", error?.message || error);
    return NextResponse.json({ error: "Failed to update user presence" }, { status: 500 });
  }
}
