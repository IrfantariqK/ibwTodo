import mongoose, { Schema, Document } from "mongoose";

export interface IChannel extends Document {
  id: string;
  projectId?: string;
  name: string;
  topic: string;
  icon: string;
  isDirectMessage: boolean;
  members: string[];
  unread: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    projectId: { type: String, default: "" },
    name: { type: String, required: true },
    topic: { type: String, default: "" },
    icon: { type: String, default: "Hash" },
    isDirectMessage: { type: Boolean, default: false },
    members: [{ type: String }],
    unread: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.Channel) {
  delete (mongoose.models as any).Channel;
}

export default mongoose.models.Channel || mongoose.model<IChannel>("Channel", ChannelSchema);
