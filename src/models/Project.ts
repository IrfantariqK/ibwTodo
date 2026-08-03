import mongoose, { Schema, Document } from "mongoose";

export interface IProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  type: "team" | "client";
}

export interface IProject extends Document {
  name: string;
  description: string;
  status: "In Progress" | "Planning" | "Completed" | "On Hold";
  progress: number;
  tags: string[];
  clients: IProjectMember[];
  teamMembers: IProjectMember[];
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, default: "Member" },
    avatar: { type: String, default: "" },
    type: { type: String, enum: ["team", "client"], default: "team" },
  },
  { _id: false }
);

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: "In Progress" },
    progress: { type: Number, default: 0 },
    tags: [{ type: String }],
    clients: { type: [MemberSchema], default: [] },
    teamMembers: { type: [MemberSchema], default: [] },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.Project) {
  delete (mongoose.models as any).Project;
}

export default mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
