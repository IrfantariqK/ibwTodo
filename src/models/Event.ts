import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  projectId?: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  link?: string;
  startTime: string;
  endTime: string;
  category: "sprint" | "review" | "standup" | "deadline" | "meeting";
  attendees: string[];
  createdAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    projectId: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    time: { type: String, default: "10:00 AM" },
    link: { type: String, default: "" },
    startTime: { type: String, default: "10:00 AM" },
    endTime: { type: String, default: "11:00 AM" },
    category: {
      type: String,
      default: "meeting",
    },
    attendees: [{ type: String }],
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.Event) {
  delete (mongoose.models as any).Event;
}

export default mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
