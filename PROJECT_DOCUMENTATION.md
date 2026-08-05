# TaskConnect / ibwTodo - Comprehensive Project Documentation

Welcome to the complete architectural and technical documentation for **TaskConnect (ibwTodo)**. This document provides a detailed, file-by-file and folder-by-folder explanation of the entire codebase, including data models, real-time messaging, caching strategies, loading states, and multi-role access control.

---

## 1. Executive Summary & Tech Stack

**TaskConnect** is a modern, high-performance project management and real-time collaboration application built for leaders, development team members, and client partners.

### Core Technologies
- **Framework**: Next.js 16 (App Router) & React 19
- **Language**: TypeScript 5
- **Database & ORM**: MongoDB Atlas & Mongoose 9
- **Styling & Motion**: Vanilla CSS, Tailwind CSS 4, Framer Motion 12, Lucide React icons
- **Real-Time Communication**: Server-Sent Events (SSE), Node.js `EventEmitter` event bus
- **Authentication**: JWT & Bcrypt password hashing
- **Email Services**: Nodemailer (OTP verification & project invitations)
- **Audio Feedback**: HTML5 Audio & Web Audio API synthesis

---

## 2. Directory Structure Overview

```
ibwTodo/
├── public/
│   └── sounds/
│       ├── mge_send.mp3          # Message send sound effect
│       ├── notify_sound.mp3      # Notification chime
│       └── cutamar_care.mp3
├── src/
│   ├── app/                      # Next.js App Router Pages & API Routes
│   │   ├── api/                  # Backend REST & SSE Streaming Routes
│   │   │   ├── ai/               # Local AI detection & text generation
│   │   │   ├── auth/             # Login, signup, logout, OTP verification
│   │   │   ├── calendar/         # Event management API
│   │   │   ├── chat/             # Chat messages, channels, read receipts & SSE stream
│   │   │   ├── dashboard/        # Live metric aggregation API
│   │   │   ├── invitations/      # Email invitation routes
│   │   │   ├── projects/         # Project CRUD & access scoping API
│   │   │   └── tasks/            # Task CRUD & status transition API
│   │   ├── accept-invite/        # Project invitation acceptance page
│   │   ├── calendar/             # Interactive Project Calendar View page
│   │   ├── calls/                # Team Video Calls page
│   │   ├── dashboard/            # Executive Dashboard page
│   │   ├── files/                # Project Storage Vault page
│   │   ├── login/                # Authentication Sign-In page
│   │   ├── messages/             # Real-Time Collaboration & Chat page
│   │   ├── settings/             # User & Workspace Settings page
│   │   ├── signup/               # Account Registration page
│   │   ├── tasks/                # Interactive Kanban Board page
│   │   ├── team/                 # Workspace Organization Directory page
│   │   ├── globals.css           # Modern theme design system CSS
│   │   └── layout.tsx            # Global Root Layout & Context Provider wrapper
│   ├── components/               # Reusable UI & Layout Components
│   │   ├── auth/                 # Login & Signup form views
│   │   ├── calendar/             # Calendar grid, event cards, add-event modal
│   │   ├── chat/                 # Channel list, chat views, message list & input
│   │   ├── dashboard/            # Metrics grid, project cards, pulse feed
│   │   ├── kanban/               # Kanban columns, task cards, task detail modal
│   │   ├── layout/               # Navigation sidebar, header bar, workspace shell
│   │   ├── modals/               # Project modal, task creation modal
│   │   ├── ui/                   # Badge, Button, ModalWrapper, Skeleton loaders
│   │   └── views/                # FilesView, TeamView
│   ├── context/                  # Global State Management
│   │   └── ProjectContext.tsx    # Workspace project selection & user role context
│   ├── hooks/                    # Custom React Hooks
│   │   └── useChatSocket.ts      # SSE real-time chat streaming & typing hook
│   ├── lib/                      # Utilities & Database Connections
│   │   ├── chatEvents.ts         # In-memory EventEmitter event bus
│   │   ├── mongodb.ts            # Mongoose connection pooling helper
│   │   ├── nodemailer.ts         # Email transport & HTML template generator
│   │   ├── sound.ts              # Audio player & Web Audio synthesizer
│   │   └── utils.ts              # Tailwind class merging utility (`cn`)
│   ├── models/                   # Mongoose Database Schemas
│   │   ├── Activity.ts           # Audit log & pulse feed model
│   │   ├── Channel.ts            # Chat workspace channel model
│   │   ├── Event.ts              # Calendar event model
│   │   ├── Invitation.ts         # Email invitation token model
│   │   ├── Message.ts            # Chat message & read status model
│   │   ├── Project.ts            # Project details & member assignment model
│   │   ├── Task.ts               # Kanban task model
│   │   └── User.ts               # User account model
│   ├── proxy.ts                  # Middleware proxy helper
│   └── types/                    # TypeScript Type Definitions
│       └── index.ts              # Central interfaces (Project, Task, ChatMessage, User)
```

---

## 3. Key Feature Implementations & Architecture

### A. Dynamic Server Rendering & Stale Data Prevention
- **Problem**: Next.js 16 App Router cached GET responses on the server, causing page refreshes to display outdated data until server restart.
- **Solution**:
  - Configured all GET API route handlers (`/api/projects`, `/api/tasks`, `/api/dashboard`, `/api/chat`, `/api/calendar`) with:
    ```ts
    export const dynamic = "force-dynamic";
    export const revalidate = 0;
    ```
  - Appended explicit HTTP response headers:
    `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
  - Added `{ cache: "no-store", headers: { "Cache-Control": "no-cache" } }` to client-side fetch calls.
  - Wired `ProjectContext` auto-sync to `window focus` and `document visibilitychange` events.

### B. App-wide UI Skeleton & Loading State Architecture
- **Component**: Created `src/components/ui/Skeleton.tsx` for animated pulse shimmer placeholders.
- **Wired Views**:
  - **Dashboard**: Metric cards, recent projects, upcoming meetings, urgent tasks, pulse feed.
  - **Kanban Board**: Skeleton task cards inside To Do, In Progress, and Completed columns.
  - **Calendar**: Skeleton grid cells & upcoming timeline items.
  - **Team Directory**: Skeleton member profile cards.
  - **Project Files**: Skeleton file row placeholders.
  - **Chat Channels & Messages**: Skeleton channel list items and animated message bubbles.

### C. Real-Time Chat & Collaboration System (`/messages`)
- **Optimistic Message Delivery**: Sent messages append instantly in a `pending` state (`Clock` spinner). Upon server confirmation, status updates to `delivered` (`CheckCheck` ticks) and `mge_send.mp3` plays.
- **Failure Recovery**: On network/API errors, message status updates to `failed` with a clickable "Retry" button.
- **Smart Auto-Scroll**: Automatically scrolls to the bottom on new messages if near the bottom; displays a floating `"New Messages ↓"` button if scrolled up.
- **Framer Motion Animations**: 60 FPS entry transitions (`fade + slide-up + scale`) on message bubbles.

### D. Live Typing Indicators & Read Receipts (Seen Status)
- **Real-Time Typing**: Emits debounced typing events showing the specific user's display name (`John is typing...`). Automatically clears after 2.5s of inactivity or message submission.
- **Live Read Receipts**: Automatically marks messages as `seen` when the recipient opens the conversation thread. Senders see status update in real time:
  - `✓ Sent` (single tick)
  - `✓✓ Delivered` (double slate tick)
  - `✓✓ Seen` (double emerald green tick + `Seen` label)
- **SSE Stream**: Server-Sent Events endpoint `/api/chat/stream` backed by `chatEmitter` pushes events instantly to connected clients.

---

## 4. File-by-File Breakdown

### `src/app/` (Pages & API Routes)
- **`app/layout.tsx`**: Root HTML layout embedding Inter font, custom scrollbar styles, and wrapping children inside `<ProjectProvider>`.
- **`app/globals.css`**: Design system tokens, glassmorphism card styles (`modern-card`), custom scrollbars, and animations.
- **`app/page.tsx`**: Redirects default root route to `/dashboard`.
- **`app/dashboard/page.tsx`**: Renders `WorkspaceShell` with `DashboardView`.
- **`app/tasks/page.tsx`**: Renders `WorkspaceShell` with `KanbanView` and `CreateTaskModal`. Manages task state and MongoDB API mutations.
- **`app/calendar/page.tsx`**: Renders `WorkspaceShell` with `CalendarView`.
- **`app/team/page.tsx`**: Renders `WorkspaceShell` with `TeamView`.
- **`app/files/page.tsx`**: Renders `WorkspaceShell` with `FilesView`.
- **`app/messages/page.tsx`**: Renders `WorkspaceShell` with `ChatView`.
- **`app/calls/page.tsx`**: Video calls interface view.
- **`app/settings/page.tsx`**: User profile & workspace configuration page.
- **`app/login/page.tsx`** & **`app/signup/page.tsx`**: Authentication pages.

#### API Routes (`src/app/api/`)
- **`api/projects/route.ts`**: GET (list scoped projects), POST (create project & log activity), PUT (update project), DELETE (remove project).
- **`api/tasks/route.ts`**: GET (fetch tasks for project), POST (create task), PUT (update status/details), DELETE (delete task).
- **`api/dashboard/route.ts`**: Aggregates metric stats (task efficiency, velocity, focus time), recent projects, urgent tasks, upcoming meetings, and pulse feed.
- **`api/chat/route.ts`**: GET (fetch conversation messages), POST (create chat message / voice note).
- **`api/chat/channels/route.ts`**: GET (fetch channels & DMs for user role), POST (create channel).
- **`api/chat/read/route.ts`**: POST (mark messages as seen, handle typing indicator broadcasts).
- **`api/chat/stream/route.ts`**: GET (Server-Sent Events streaming response for real-time chat sync).
- **`api/calendar/route.ts`**: GET (list calendar events), POST (add event), PUT (edit event), DELETE (remove event).

---

### `src/components/`

#### UI Components (`src/components/ui/`)
- **`Skeleton.tsx`**: Reusable pulse shimmer component (`<Skeleton className="..." />`).
- **`Badge.tsx`**: Status & priority badge component (`in-progress`, `planning`, `completed`, `urgent`).
- **`Button.tsx`**: Styled button component supporting primary, secondary, danger, and ghost variants.
- **`ModalWrapper.tsx`**: Accessible backdrop modal container with escape listener.

#### Chat Components (`src/components/chat/`)
- **`MessageList.tsx`**: Message bubble list with Framer Motion entry animations, voice note waveform player, code snippet copy block, status indicators (`Sent`, `Delivered`, `Seen`, `Failed`), and smart auto-scroll.
- **`MessageInput.tsx`**: Textarea input with voice note recorder, code snippet toggle, send button, and typing event emitter.
- **`ChannelList.tsx`**: Sidebar listing public channels (`#general`, `#development`, `#design`) and direct messages with role badges.
- **`LeaderChatView.tsx`**: Leader control center chat view with socket listener & optimistic send logic.
- **`ClientChatView.tsx`**: Client verified portal chat view.
- **`TeamMemberChatView.tsx`**: Team collaboration workspace chat view.

#### Dashboard Components (`src/components/dashboard/`)
- **`DashboardView.tsx`**: Executive metrics grid, project progress cards, upcoming meetings widget, urgent tasks list, and pulse activity feed.

#### Kanban Components (`src/components/kanban/`)
- **`KanbanView.tsx`**: Board grid with To Do, In Progress, and Completed columns, priority filters, search, and list/kanban view toggles.
- **`KanbanColumn.tsx`**: Individual Kanban column rendering task cards.
- **`TaskCard.tsx`**: Task summary card with priority tags, assignee avatars, subtask counts, and attachments indicator.
- **`TaskDetailModal.tsx`**: Modal for editing task details, updating subtasks, and adding attachments.

#### View Components (`src/components/views/`)
- **`TeamView.tsx`**: Directory grid displaying Leader, Team Members, and Client contacts.
- **`FilesView.tsx`**: Central storage vault aggregating project files and task attachments.

---

### `src/lib/` (Utilities & Helpers)
- **`chatEvents.ts`**: Global singleton `EventEmitter` for pushing real-time chat SSE stream events across connections.
- **`sound.ts`**: Plays `/sounds/mge_send.mp3` with Web Audio API synthesizer fallback.
- **`mongodb.ts`**: Mongoose connection pooling helper for MongoDB Atlas.
- **`nodemailer.ts`**: Transporter for sending OTP verification emails and project invitations.
- **`utils.ts`**: Utility function `cn()` combining `clsx` and `tailwind-merge`.

---

### `src/models/` (MongoDB Schemas)
- **`Project.ts`**: Project name, description, status, progress, assigned team members, client contacts, attached files.
- **`Task.ts`**: Task title, description, status, priority, due date, assignee, subtasks, attachments.
- **`Message.ts`**: Sender, recipient/channel, content, timestamp, voice note URL, seen status, seenAt.
- **`Channel.ts`**: Channel name, topic, icon, project assignment.
- **`Event.ts`**: Title, time, date, meeting link, category, attendees.
- **`User.ts`**: Name, email, password hash, role (`leader`, `team`, `client`), avatar.
- **`Activity.ts`**: User, avatar, action, target, timestamp for live pulse feed.
- **`Invitation.ts`**: Email invitation token, project assignment, role, expiration.

---

## 5. API Reference Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/projects` | GET | List projects scoped to user role |
| `/api/projects` | POST | Create new project & log activity |
| `/api/tasks` | GET | List tasks for selected project |
| `/api/tasks` | POST | Create new task |
| `/api/tasks` | PUT | Shift task status or update details |
| `/api/chat` | GET | Fetch message history for channel/DM |
| `/api/chat` | POST | Send new chat message or voice note |
| `/api/chat/read` | POST | Mark messages as seen / emit typing events |
| `/api/chat/stream` | GET | Real-time SSE stream for chat events |
| `/api/dashboard` | GET | Aggregated live metrics & pulse activity feed |
| `/api/calendar` | GET | List upcoming project meetings & events |

---

## 6. Conclusion

This documentation covers all implemented files, architecture patterns, database models, and real-time features in **TaskConnect (ibwTodo)**. The application is fully optimized, dynamic, and error-free.
