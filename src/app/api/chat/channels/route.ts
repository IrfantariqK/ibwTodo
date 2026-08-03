import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Channel from "@/models/Channel";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const db = await connectToDatabase();
    if (db) {
      const query: any = {};
      if (projectId && projectId !== "all") {
        query.$or = [
          { projectId: projectId },
          { projectId: "" },
          { projectId: { $exists: false } },
        ];
      }

      const channels = await Channel.find(query).sort({ createdAt: 1 }).lean();
      const formatted = channels.map((c: any) => ({
        ...c,
        id: c._id ? c._id.toString() : c.id,
      }));
      return NextResponse.json(formatted);
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error("GET /api/chat/channels error:", error);
    return NextResponse.json([]);
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
