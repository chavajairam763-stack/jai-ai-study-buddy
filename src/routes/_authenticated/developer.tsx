import { createFileRoute } from "@tanstack/react-router";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/developer")({
  component: () => <ToolChat tool={TOOLS.developer} />,
  head: () => ({ meta: [{ title: "AI Developer — JAI.AI" }] }),
});
