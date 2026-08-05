import { EventEmitter } from "events";

// Global singleton event emitter for real-time chat broadcasts across SSE connections
declare global {
  var globalChatEmitter: EventEmitter | undefined;
}

export const chatEmitter =
  globalThis.globalChatEmitter || (globalThis.globalChatEmitter = new EventEmitter());

// Increase listener limit for active connections
chatEmitter.setMaxListeners(200);
