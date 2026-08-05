import { chatEmitter } from "@/lib/chatEvents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").toLowerCase().trim();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Broadcast online status if email provided
      if (email) {
        try {
          chatEmitter.emit("chat:event", {
            type: "presence:update",
            payload: { email, isOnline: true },
          });
        } catch (e) {}
      }

      const onChatEvent = (eventData: any) => {
        try {
          const chunk = `data: ${JSON.stringify(eventData)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch (err) {
          // Stream controller closed
        }
      };

      chatEmitter.on("chat:event", onChatEvent);

      // Keep connection alive with periodic heartbeats every 15s
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (err) {
          clearInterval(heartbeatTimer);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        chatEmitter.off("chat:event", onChatEvent);
        clearInterval(heartbeatTimer);

        if (email) {
          try {
            chatEmitter.emit("chat:event", {
              type: "presence:update",
              payload: { email, isOnline: false },
            });
          } catch (e) {}
        }

        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
