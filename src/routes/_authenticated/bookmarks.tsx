import { createFileRoute } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bookmarks")({ component: Page });

function Page() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Bookmark className="h-7 w-7 text-primary" /> Bookmarks</h1>
        <p className="mt-1 text-muted-foreground">Your saved chats, notes and papers.</p>
      </div>
      <div className="glass rounded-2xl p-10 text-center text-muted-foreground">Nothing bookmarked yet.</div>
    </div>
  );
}
