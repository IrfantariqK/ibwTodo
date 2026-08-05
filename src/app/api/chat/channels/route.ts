import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Channel from "@/models/Channel";
import Project from "@/models/Project";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const role = (searchParams.get("role") || "").toLowerCase().trim();
    const email = (searchParams.get("email") || "").toLowerCase().trim();

    const db = await connectToDatabase();
    if (!db) return NextResponse.json([], { headers: NO_CACHE_HEADERS });

    const isClientOrTeam = role === "client" || role === "team";

    // 1. Determine allowed project IDs
    let allowedProjectIds: string[] = [];

    if (isClientOrTeam && email) {
      const userProjects = await Project.find({
        $or: [
          { "clients.email": { $regex: new RegExp(`^${email}$`, "i") } },
          { "teamMembers.email": { $regex: new RegExp(`^${email}$`, "i") } },
        ],
      }).lean();

      allowedProjectIds = userProjects.map((p: any) => p._id.toString());

      if (projectId && projectId !== "all" && allowedProjectIds.includes(projectId)) {
        allowedProjectIds = [projectId];
      }
    } else if (projectId && projectId !== "all") {
      allowedProjectIds = [projectId];
    }

    // 2. Build MongoDB query
    let query: any = {};
    if (allowedProjectIds.length > 0) {
      query.projectId = { $in: allowedProjectIds };
    } else if (isClientOrTeam) {
      // Client or Team Member with no assigned project gets 0 channels
      return NextResponse.json([], { headers: NO_CACHE_HEADERS });
    }

    let channels = await Channel.find(query).sort({ createdAt: 1 }).lean();

    // 3. Auto-seed project channels if target project has no channels yet
    if (channels.length === 0 && allowedProjectIds.length === 1 && allowedProjectIds[0]) {
      const targetPId = allowedProjectIds[0];
      try {
        const defaultChannels = [
          {
            id: `gen-${targetPId}`,
            projectId: targetPId,
            name: "general",
            topic: "Project general discussion",
            icon: "Hash",
            isDirectMessage: false,
            unread: 0,
          },
          {
            id: `upd-${targetPId}`,
            projectId: targetPId,
            name: "project-updates",
            topic: "Milestones and status updates",
            icon: "Zap",
            isDirectMessage: false,
            unread: 0,
          },
        ];

        await Channel.insertMany(defaultChannels);
        channels = await Channel.find(query).sort({ createdAt: 1 }).lean();
      } catch (seedErr) {
        console.warn("Channel auto-seed warning:", seedErr);
      }
    }

    const formatted = channels.map((c: any) => ({
      ...c,
      id: c._id ? c._id.toString() : c.id,
    }));

    return NextResponse.json(formatted, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("GET /api/chat/channels error:", error);
    return NextResponse.json([], { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      const doc = await Channel.create({
        id: body.id || `chan-${Date.now()}`,
        projectId: body.projectId || "",
        name: body.name.trim().toLowerCase().replace(/\s+/g, "-"),
        topic: body.topic || "Custom Channel",
        icon: body.icon || (body.isDirectMessage ? "User" : "Hash"),
        isDirectMessage: !!body.isDirectMessage,
        unread: 0,
      });

      const result = {
        ...doc.toObject(),
        id: doc._id.toString(),
      };

      return NextResponse.json(result, { status: 201 });
    }
    return NextResponse.json(body);
  } catch (error: any) {
    console.error("POST /api/chat/channels error:", error?.message || error);
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}
