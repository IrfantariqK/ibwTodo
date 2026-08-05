import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import Channel from "@/models/Channel";
import Activity from "@/models/Activity";
import User from "@/models/User";
import Invitation from "@/models/Invitation";
import { generateAutoPassword, sendInvitationEmail } from "@/lib/nodemailer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    const db = await connectToDatabase();
    if (db) {
      const query: any = {};

      if (email) {
        // Query User directly from MongoDB Atlas User collection to verify role
        const userInDb = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, "i") } });

        const roleLower = (userInDb?.role || "").toLowerCase();
        const typeLower = (userInDb?.type || "").toLowerCase();

        const isClient =
          typeLower === "client" ||
          roleLower.includes("client") ||
          email.includes("client");

        const isTeam =
          !isClient &&
          (typeLower === "team" ||
            roleLower.includes("team") ||
            roleLower.includes("developer") ||
            roleLower.includes("member") ||
            email.includes("member"));

        const isLeader = !isClient && !isTeam;

        if (isClient) {
          query["clients.email"] = { $regex: new RegExp(`^${email}$`, "i") };
        } else if (isTeam) {
          query["teamMembers.email"] = { $regex: new RegExp(`^${email}$`, "i") };
        }
      }

      const projects = await Project.find(query).sort({ createdAt: -1 }).lean();
      const formatted = projects.map((p: any) => ({
        ...p,
        id: p._id ? p._id.toString() : p.id,
      }));

      return NextResponse.json(formatted, { headers: NO_CACHE_HEADERS });
    }
    return NextResponse.json([], { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json([], { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const clientsList = Array.isArray(body.clients) ? body.clients : [];
    const teamList = Array.isArray(body.teamMembers) ? body.teamMembers : [];

    const doc = await Project.create({
      name: body.name.trim(),
      description: body.description || "",
      status: body.status || "In Progress",
      progress: typeof body.progress === "number" ? body.progress : 0,
      tags: Array.isArray(body.tags) ? body.tags : ["Engineering"],
      clients: clientsList,
      teamMembers: teamList,
      files: Array.isArray(body.files) ? body.files : [],
    });

    const projectIdStr = doc._id.toString();

    // Auto-create User accounts for added Clients in MongoDB Atlas
    for (const c of clientsList) {
      if (c.email) {
        const cleanEmail = c.email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: cleanEmail });
        if (!existingUser) {
          const autoPassword = generateAutoPassword();
          const hashedPassword = await bcrypt.hash(autoPassword, 10);
          await User.create({
            name: c.name || cleanEmail.split("@")[0],
            email: cleanEmail,
            password: hashedPassword,
            role: c.role || "Client Lead",
            type: "client",
            status: "Active",
            isVerified: true,
            avatar: c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
          });

          try {
            await sendInvitationEmail({
              email: cleanEmail,
              name: c.name || "Client",
              role: c.role || "Client",
              type: "client",
              projectName: doc.name,
              autoPassword,
              token: `inv-${Date.now()}`,
              baseUrl: "http://localhost:3000",
            });
          } catch (e) {}
        }
      }
    }

    // Auto-create User accounts for added Team Members in MongoDB Atlas
    for (const tm of teamList) {
      if (tm.email) {
        const cleanEmail = tm.email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: cleanEmail });
        if (!existingUser) {
          const autoPassword = generateAutoPassword();
          const hashedPassword = await bcrypt.hash(autoPassword, 10);
          await User.create({
            name: tm.name || cleanEmail.split("@")[0],
            email: cleanEmail,
            password: hashedPassword,
            role: tm.role || "Team Member",
            type: "team",
            status: "Active",
            isVerified: true,
            avatar: tm.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
          });
        }
      }
    }

    // Auto-create Workspace Channel in MongoDB for this new project!
    const channelSlug = body.channelName
      ? body.channelName.trim().toLowerCase().replace(/\s+/g, "-")
      : doc.name.trim().toLowerCase().replace(/\s+/g, "-");

    try {
      await Channel.create({
        id: `chan-${projectIdStr}`,
        projectId: projectIdStr,
        name: channelSlug,
        topic: `Official workspace channel for ${doc.name}`,
        icon: "Hash",
        isDirectMessage: false,
        unread: 0,
      });
    } catch (chanErr) {
      console.warn("Auto-channel creation warning:", chanErr);
    }

    // Log activity in MongoDB Pulse Feed
    try {
      await Activity.create({
        user: "Irfan Tariq",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
        action: "created project & channel",
        target: `${doc.name} (#${channelSlug})`,
        timeAgo: "Just now",
      });
    } catch (actErr) {
      console.warn("Activity creation warning:", actErr);
    }

    const result = {
      ...doc.toObject(),
      id: projectIdStr,
      channelSlug,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to create project in MongoDB" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, _id, ...updateData } = body;
    const targetId = _id || id;

    if (!targetId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
    }

    const updated = await Project.findByIdAndUpdate(targetId, updateData, { new: true }).lean();

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Provision User accounts for updated client or team list
    if (Array.isArray(body.clients)) {
      for (const c of body.clients) {
        if (c.email) {
          const cleanEmail = c.email.trim().toLowerCase();
          const existingUser = await User.findOne({ email: cleanEmail });
          if (!existingUser) {
            const autoPassword = generateAutoPassword();
            const hashedPassword = await bcrypt.hash(autoPassword, 10);
            await User.create({
              name: c.name || cleanEmail.split("@")[0],
              email: cleanEmail,
              password: hashedPassword,
              role: c.role || "Client Lead",
              type: "client",
              status: "Active",
              isVerified: true,
              avatar: c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
            });
          }
        }
      }
    }

    // Log activity
    try {
      await Activity.create({
        user: "Irfan Tariq",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
        action: "updated project",
        target: (updated as any).name,
        timeAgo: "Just now",
      });
    } catch (actErr) {
      console.warn("Activity logging warning:", actErr);
    }

    const result = {
      ...(updated as any),
      id: (updated as any)._id.toString(),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PUT /api/projects error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to update project in MongoDB" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
    }

    const deleted = await Project.findByIdAndDelete(id).lean();

    if (deleted) {
      // Also delete associated channels for this project
      try {
        await Channel.deleteMany({ projectId: id });
      } catch (chanErr) {
        console.warn("Associated channels deletion warning:", chanErr);
      }

      // Log activity
      try {
        await Activity.create({
          user: "Irfan Tariq",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
          action: "deleted project",
          target: (deleted as any).name,
          timeAgo: "Just now",
        });
      } catch (actErr) {
        console.warn("Activity logging warning:", actErr);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/projects error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete project from MongoDB" },
      { status: 500 }
    );
  }
}
