import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="relative grid place-items-center rounded-xl bg-gradient-primary p-1.5 glow-sm" style={{ width: size + 12, height: size + 12 }}>
        <Sparkles className="text-primary-foreground" size={size - 6} strokeWidth={2.4} />
      </div>
      <span className="text-lg font-bold tracking-tight">
        JAI<span className="text-gradient">.AI</span>
      </span>
    </Link>
  );
}
