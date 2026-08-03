import mongoose, { Schema, Document } from "mongoose";

export interface IActivity extends Document {
  user: string;
  avatar: string;
  action: string;
  target: string;
  timeAgo: string;
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema(
  {
    user: { type: String, required: true },
    avatar: { type: String, required: true },
    action: { type: String, required: true },
    target: { type: String, required: true },
    timeAgo: { type: String, default: "Just now" },
  },
  { timestamps: true }
);

export default mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);
