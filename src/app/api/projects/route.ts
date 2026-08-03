import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import Channel from "@/models/Channel";
import Activity from "@/models/Activity";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();
    const role = searchParams.get("role");
    const userType = searchParams.get("type");

    const db = await connectToDatabase();
    if (db) {
      // LEADER: Can view ALL projects across workspace
      const isLeader =
        role === "Leader" ||
        userType === "leader" ||
        !email ||
        email === "admin@ibwtech.com" ||
        email === "user@ibwtech.com";

      const query: any = {};
      if (!isLeader && email) {
        // CLIENT: Can view ONLY projects where assigned as client
        // TEAM MEMBER: Can view ONLY projects where assigned as team member
        if (userType === "client") {
          query["clients.email"] = email;
        } else if (userType === "team") {
          query["teamMembers.email"] = email;
        } else {
          query.$or = [
            { "clients.email": email },
            { "teamMembers.email": email },
          ];
        }
      }

      const projects = await Project.find(query).sort({ createdAt: -1 }).lean();
      const formatted = projects.map((p: any) => ({
        ...p,
        id: p._id ? p._id.toString() : p.id,
      }));

      return NextResponse.json(formatted);
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json([]);
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

    const doc = await Project.create({
      name: body.name.trim(),
      description: body.description || "",
      status: body.status || "In Progress",
      progress: typeof body.progress === "number" ? body.progress : 0,
      tags: Array.isArray(body.tags) ? body.tags : ["Engineering"],
      clients: Array.isArray(body.clients) ? body.clients : [],
      teamMembers: Array.isArray(body.teamMembers) ? body.teamMembers : [],
    });

    const projectIdStr = doc._id.toString();

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
