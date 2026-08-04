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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, _id, ...updateFields } = body;
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json({ error: "Event ID is required for update" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
    }

    const updated = await Event.findByIdAndUpdate(
      targetId,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      id: updated._id.toString(),
    });
  } catch (error: any) {
    console.error("PUT /api/calendar error:", error?.message || error);
    return NextResponse.json({ error: "Failed to update event in MongoDB" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let targetId = searchParams.get("id");

    if (!targetId) {
      const body = await req.json().catch(() => ({}));
      targetId = body.id || body._id;
    }

    if (!targetId) {
      return NextResponse.json({ error: "Event ID is required for deletion" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 });
    }

    const deleted = await Event.findByIdAndDelete(targetId);

    if (!deleted) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/calendar error:", error?.message || error);
    return NextResponse.json({ error: "Failed to delete event from MongoDB" }, { status: 500 });
  }
}
