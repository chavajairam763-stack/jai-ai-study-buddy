import { createFileRoute } from "@tanstack/react-router";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/market")({
  component: () => <ToolChat tool={TOOLS.market} />,
  head: () => ({ meta: [{ title: "Market Insight — JAI.AI" }] }),
});
