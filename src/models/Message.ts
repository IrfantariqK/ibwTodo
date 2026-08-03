import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  projectId?: string;
  channelId?: string;
  recipientId?: string;
  sender: {
    name: string;
    avatar: string;
    role: string;
    email?: string;
  };
  content: string;
  timestamp: string;
  reactions?: { emoji: string; count: number }[];
  isCodeSnippet?: boolean;
  isVoiceNote?: boolean;
  audioUrl?: string;
  audioDuration?: string;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    projectId: { type: String, default: "" },
    channelId: { type: String, default: "" },
    recipientId: { type: String, default: "" },
    sender: {
      name: { type: String, required: true },
      avatar: { type: String, default: "" },
      role: { type: String, default: "Member" },
      email: { type: String, default: "" },
    },
    content: { type: String, default: "" },
    timestamp: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    reactions: [
      {
        emoji: String,
        count: Number,
      },
    ],
    isCodeSnippet: { type: Boolean, default: false },
    isVoiceNote: { type: Boolean, default: false },
    audioUrl: { type: String, default: "" },
    audioDuration: { type: String, default: "0:00" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== "production" && mongoose.models.Message) {
  delete (mongoose.models as any).Message;
}

export default mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
