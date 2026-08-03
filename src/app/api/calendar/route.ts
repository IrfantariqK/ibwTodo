import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Event from "@/models/Event";
import Activity from "@/models/Activity";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const db = await connectToDatabase();
    if (db) {
      const query: any = {};
      if (projectId && projectId !== "all") {
        query.projectId = projectId;
      }
      const events = await Event.find(query).sort({ createdAt: -1 }).lean();
      const formatted = events.map((e: any) => ({
        ...e,
        id: e._id ? e._id.toString() : e.id,
      }));
      return NextResponse.json(formatted);
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error("GET /api/calendar error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
    }

    const doc = await Event.create({
      projectId: body.projectId || "",
      title: body.title || "Untitled Event",
      time: body.time || body.startTime || "10:00 AM",
      type: body.type || body.category || "meeting",
      project: body.project || "General",
      link: body.link || "",
      description: body.description || "",
      date: body.date || new Date().toISOString().split("T")[0],
      startTime: body.startTime || "10:00 AM",
      endTime: body.endTime || "11:00 AM",
      category: body.category || "meeting",
      attendees: body.attendees || ["Irfan Tariq"],
    });

    try {
      await Activity.create({
        user: "Irfan Tariq",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
        action: "scheduled event",
        target: body.title,
        timeAgo: "Just now",
      });
    } catch (e) {}

    const result = {
      ...doc.toObject(),
      id: doc._id.toString(),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/calendar error:", error?.message || error);
    return NextResponse.json({ error: "Failed to create event in MongoDB" }, { status: 500 });
  }
}
