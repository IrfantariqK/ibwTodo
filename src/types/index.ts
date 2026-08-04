export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  type: "team" | "client";
}

export interface ProjectFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  data?: string;
  uploadedAt: string;
}

export interface ProjectItem {
  id: string;
  _id?: string;
  name: string;
  description: string;
  status: "In Progress" | "Planning" | "Completed" | "On Hold";
  progress: number;
  tags?: string[];
  clients?: ProjectMember[];
  teamMembers?: ProjectMember[];
  files?: ProjectFile[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: string;       // MIME type e.g. "image/png", "application/pdf"
  size: number;       // bytes
  data: string;       // base64 encoded file data
  comment: string;    // per-file annotation/feedback comment
  uploadedAt: string;
}

export interface TaskItem {
  id: string;
  _id?: string;
  projectId?: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done" | "backlog" | "review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  category?: string;
  tags?: string[];
  assignee?: {
    name: string;
    avatar: string;
    role?: string;
    email?: string;
  };
  subtasks?: { id: string; title: string; completed: boolean }[];
  commentsCount?: number;
  attachments?: TaskAttachment[];
}

export interface EventItem {
  id: string;
  _id?: string;
  projectId?: string;
  title: string;
  time: string;
  type: "meeting" | "demo" | "sync" | "deadline";
  project?: string;
  link?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  category?: string;
  attendees?: string[];
}

export type CalendarEventItem = EventItem;

export interface ChatMessage {
  id: string;
  _id?: string;
  projectId?: string;
  channelId?: string;
  recipientId?: string;
  sender: {
    name: string;
    avatar?: string;
    role?: string;
    email?: string;
  };
  content: string;
  time?: string;
  timestamp?: string;
  isCodeSnippet?: boolean;
  isVoiceNote?: boolean;
  audioUrl?: string;
  audioDuration?: string;
  reactions?: any[];
  createdAt?: string;
}

export interface ChannelItem {
  id: string;
  _id?: string;
  projectId?: string;
  name: string;
  topic?: string;
  unread?: number;
  icon?: string;
}
