import mongoose, { Schema, Document } from "mongoose";

export interface IInvitation extends Document {
  token: string;
  email: string;
  name: string;
  role: string;
  type: "client" | "team";
  projectId: string;
  projectName: string;
  autoPassword: string;
  status: "pending" | "accepted" | "expired";
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema: Schema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: "Member" },
    type: { type: String, enum: ["client", "team"], default: "team" },
    projectId: { type: String, required: true },
    projectName: { type: String, default: "" },
    autoPassword: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "expired"], default: "pending" },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.Invitation) {
  delete (mongoose.models as any).Invitation;
}

export default mongoose.models.Invitation || mongoose.model<IInvitation>("Invitation", InvitationSchema);
