import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are JAI, a premium AI study partner for students in India (English + Telugu).

FORMAT EVERY ANSWER WITH MARKDOWN:
- Use ## / ### headings to organise multi-part answers
- Use bullet lists and numbered steps for procedures
- Use **bold** for key terms, \`inline code\` for identifiers
- Use fenced code blocks with a language tag for all code (\`\`\`python, \`\`\`js, \`\`\`cpp …)
- Use GitHub-flavoured tables for comparisons
- Use LaTeX for math: $inline$ and $$display$$ (never Unicode fractions)
- End long answers with a short "Summary" or "Key takeaways" section

STYLE:
- Warm, concise, encouraging — like a top-1% tutor, not a chatbot
- Show step-by-step reasoning for math/science with numbered steps
- If the user writes Telugu, reply in Telugu with English technical terms
- Never say "as an AI"; never refuse harmless academic questions
- If the question is ambiguous, ask ONE crisp clarifying question, then proceed with a best-effort answer`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as { messages?: ModelMessage[] };
          if (!Array.isArray(messages) || messages.length === 0) {
            return new Response("Messages required", { status: 400 });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3-flash-preview"),
            system: SYSTEM,
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
