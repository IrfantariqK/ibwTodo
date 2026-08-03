import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Task from "@/models/Task";
import Event from "@/models/Event";
import Project from "@/models/Project";
import Activity from "@/models/Activity";

export async function GET() {
  try {
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json({
        totalTasks: 0,
        completedTasks: 0,
        taskEfficiency: "0%",
        teamVelocity: "0 pts/wk",
        focusTime: "0h",
        focusPercent: 0,
        projects: [],
        upcomingMeetings: [],
        urgentTasks: [],
        pulseFeed: [],
      });
    }

    // Fetch ONLY real live documents from MongoDB Atlas
    const mongoTasks = await Task.find().lean();
    const mongoEvents = await Event.find().lean();
    const mongoProjects = await Project.find().lean();
    const mongoActivities = await Activity.find().sort({ createdAt: -1 }).limit(10).lean();

    const totalTasksCount = mongoTasks.length;
    const completedTasksCount = mongoTasks.filter((t: any) => t.status === "done").length;

    // Real calculations from MongoDB Atlas
    const efficiencyCalc =
      totalTasksCount > 0
        ? ((completedTasksCount / totalTasksCount) * 100).toFixed(1)
        : "0.0";

    const focusHours = (completedTasksCount * 1.25).toFixed(1);
    const focusPercent =
      totalTasksCount > 0
        ? Math.min(100, Math.round((completedTasksCount / totalTasksCount) * 100))
        : 0;

    // Filter urgent tasks directly from MongoDB Atlas
    const urgentTasks = mongoTasks.filter(
      (t: any) => t.priority === "high" || t.priority === "urgent"
    );

    return NextResponse.json({
      totalTasks: totalTasksCount,
      completedTasks: completedTasksCount,
      taskEfficiency: `${efficiencyCalc}%`,
      teamVelocity: `${completedTasksCount * 12} pts/wk`,
      focusTime: `${focusHours}h`,
      focusPercent: focusPercent,
      projects: mongoProjects,
      upcomingMeetings: mongoEvents,
      urgentTasks: urgentTasks,
      pulseFeed: mongoActivities,
    });
  } catch (error) {
    console.error("MongoDB Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch MongoDB dashboard data" },
      { status: 500 }
    );
  }
}
