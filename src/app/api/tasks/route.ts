import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import Activity from "@/models/Activity";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
};

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (db) {
      const tasks = await Task.find().sort({ createdAt: -1 }).lean();
      // Ensure each task document has an `id` string field for frontend components
      const formatted = tasks.map((t: any) => ({
        ...t,
        id: t._id ? t._id.toString() : t.id,
      }));
      return NextResponse.json(formatted, { headers: NO_CACHE_HEADERS });
    }
    return NextResponse.json([], { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json([], { headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: "Task title is required." },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { error: "Database connection unavailable." },
        { status: 503 }
      );
    }

    const taskDoc = await Task.create({
      title: body.title.trim(),
      description: body.description || "",
      status: body.status || "todo",
      priority: body.priority || "medium",
      category: body.category || "General",
      dueDate: body.dueDate || "No due date",
      tags: Array.isArray(body.tags) ? body.tags : [],
      assignee: body.assignee || {
        name: "Irfan Tariq",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
        role: "Member",
      },
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
    });

    // Log activity in MongoDB Atlas
    try {
      await Activity.create({
        user: taskDoc.assignee?.name || "Irfan Tariq",
        avatar: taskDoc.assignee?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
        action: "created task",
        target: taskDoc.title,
        timeAgo: "Just now",
      });
    } catch (actErr) {
      console.warn("Activity creation warning:", actErr);
    }

    const result = {
      ...taskDoc.toObject(),
      id: taskDoc._id.toString(),
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tasks error detail:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to create task in MongoDB" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, _id, ...updateData } = body;
    const targetId = _id || id;

    const db = await connectToDatabase();
    if (db && targetId) {
      const updated = await Task.findByIdAndUpdate(targetId, updateData, { new: true }).lean();

      if (updated && updateData.status === "done") {
        try {
          await Activity.create({
            user: (updated as any).assignee?.name || "Irfan Tariq",
            avatar: (updated as any).assignee?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Irfan",
            action: "completed task",
            target: (updated as any).title,
            timeAgo: "Just now",
          });
        } catch (e) {
          console.warn("Activity logging warning:", e);
        }
      }

      const result = updated ? { ...(updated as any), id: (updated as any)._id.toString() } : body;
      return NextResponse.json(result);
    }

    return NextResponse.json(body);
  } catch (error: any) {
    console.error("PUT /api/tasks error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to update task in MongoDB" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const db = await connectToDatabase();
    if (db && id) {
      await Task.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/tasks error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to delete task in MongoDB" },
      { status: 500 }
    );
  }
}
