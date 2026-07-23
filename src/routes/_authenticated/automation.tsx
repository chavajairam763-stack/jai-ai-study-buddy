import { createFileRoute } from "@tanstack/react-router";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/automation")({
  component: () => <ToolChat tool={TOOLS.automation} />,
  head: () => ({ meta: [{ title: "AI Automation — JAI.AI" }] }),
});
