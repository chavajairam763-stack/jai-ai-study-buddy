import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import robot from "@/assets/jai-robot.png";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="relative grid place-items-center rounded-xl bg-gradient-primary p-1.5 glow-sm" style={{ width: size + 8, height: size + 8 }}>
        <Sparkles className="text-primary-foreground" size={size - 8} />
      </div>
      <span className="text-lg font-bold tracking-tight">
        JAI<span className="text-gradient">.AI</span>
      </span>
    </Link>
  );
}

export { robot as jaiRobot };
