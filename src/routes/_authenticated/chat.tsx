import { createFileRoute } from "@tanstack/react-router";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/chat")({
  component: () => <ToolChat tool={TOOLS.chat} />,
  head: () => ({ meta: [{ title: "AI Chat Pro — JAI.AI" }] }),
});
