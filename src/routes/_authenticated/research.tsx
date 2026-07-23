import { createFileRoute } from "@tanstack/react-router";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/research")({
  component: () => <ToolChat tool={TOOLS.research} />,
  head: () => ({ meta: [{ title: "AI Research — JAI.AI" }] }),
});
