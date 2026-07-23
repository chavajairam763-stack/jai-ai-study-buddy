import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { TOOLS, type ToolId } from "@/lib/tools";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages, tool } = (await request.json()) as {
            messages?: ModelMessage[];
            tool?: ToolId;
          };
          if (!Array.isArray(messages) || messages.length === 0) {
            return new Response("Messages required", { status: 400 });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const toolDef = (tool && TOOLS[tool]) || TOOLS.chat;
          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3.6-flash"),
            system: toolDef.systemPrompt,
            messages,
          });
          return result.toTextStreamResponse({
            headers: { "Cache-Control": "no-store" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Chat failed";
          const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
          return new Response(msg, { status });
        }
      },
    },
  },
});
