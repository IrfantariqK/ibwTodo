import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  type: "leader" | "client" | "team";
  status: "Pending Verification" | "Pending Acceptance" | "Active";
  isVerified: boolean;
  verificationOtp?: string;
  otpExpiresAt?: Date;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "Leader" },
    type: { type: String, enum: ["leader", "client", "team"], default: "leader" },
    status: { type: String, enum: ["Pending Verification", "Pending Acceptance", "Active"], default: "Pending Verification" },
    isVerified: { type: Boolean, default: false },
    verificationOtp: { type: String, default: "" },
    otpExpiresAt: { type: Date },
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.User) {
  delete (mongoose.models as any).User;
}

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
