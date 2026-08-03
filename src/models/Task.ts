import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done" | "backlog" | "review" | "completed";
  priority: "urgent" | "high" | "medium" | "low";
  category: string;
  tags: string[];
  assignee: {
    name: string;
    avatar: string;
    role: string;
  };
  dueDate: string;
  subtasks: { id: string; title: string; completed: boolean }[];
  commentsCount: number;
  attachments: {
    id: string;
    name: string;
    type: string;
    size: number;
    data: string;
    comment: string;
    uploadedAt: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, default: "" },
    size: { type: Number, default: 0 },
    data: { type: String, default: "" },
    comment: { type: String, default: "" },
    uploadedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const TaskSchema: Schema = new Schema(
  {
    projectId: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      default: "todo",
    },
    priority: {
      type: String,
      default: "medium",
    },
    category: { type: String, default: "General" },
    tags: [{ type: String }],
    assignee: {
      name: { type: String, default: "Unassigned" },
      avatar: { type: String, default: "" },
      role: { type: String, default: "Team Member" },
    },
    dueDate: { type: String, default: "" },
    subtasks: [
      {
        id: String,
        title: String,
        completed: Boolean,
      },
    ],
    commentsCount: { type: Number, default: 0 },
    attachments: { type: [AttachmentSchema], default: [] },
  },
  { timestamps: true }
);

// Clear model cache in dev mode so schema changes are picked up immediately
if (process.env.NODE_ENV !== "production" && mongoose.models.Task) {
  delete (mongoose.models as any).Task;
}

export default mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
