import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
});

const ChatInput = z.object({
  messages: z.array(MessageSchema).min(1).max(60),
});

const SYSTEM = `You are JAI, a premium AI study partner for students. You help with:
- Solving doubts (math, science, coding) with clear step-by-step explanations
- Summarizing PDFs, notes, textbooks
- Creating quizzes, flashcards, and study plans
- Answering in English or Telugu when the user writes in Telugu
Format responses with markdown, use code blocks for code, and be concise but complete.`;

export const chatWithJai = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const result = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      messages: [{ role: "system", content: SYSTEM }, ...data.messages],
    });
    return { text: result.text };
  });
