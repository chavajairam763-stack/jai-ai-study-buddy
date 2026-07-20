import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layers, RotateCw } from "lucide-react";

const deck = [
  { q: "What is Big-O of binary search?", a: "O(log n)" },
  { q: "TCP vs UDP: reliability?", a: "TCP is reliable; UDP is not." },
  { q: "Normalization: 3NF removes?", a: "Transitive dependencies." },
];

export const Route = createFileRoute("/_authenticated/flashcards")({ component: Page });

function Page() {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const c = deck[i];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Layers className="h-7 w-7 text-primary" /> Flashcards</h1>
        <p className="mt-1 text-muted-foreground">Tap the card to reveal the answer.</p>
      </div>
      <button onClick={() => setFlip(!flip)} className="glass-strong flex min-h-[280px] w-full items-center justify-center rounded-3xl p-10 text-center text-xl font-semibold glow-sm">
        {flip ? c.a : c.q}
      </button>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{i + 1} / {deck.length}</div>
        <button onClick={() => { setFlip(false); setI((i + 1) % deck.length); }} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow-sm">
          <RotateCw className="h-4 w-4" /> Next
        </button>
      </div>
    </div>
  );
}
