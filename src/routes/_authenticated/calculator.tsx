import { createFileRoute } from "@tanstack/react-router";
import { ToolChat } from "@/components/tool-chat";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/_authenticated/calculator")({
  component: () => <ToolChat tool={TOOLS.calculator} />,
  head: () => ({ meta: [{ title: "AI Smart Calculator — JAI.AI" }] }),
});
