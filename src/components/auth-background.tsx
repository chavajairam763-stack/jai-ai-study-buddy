import { useMemo } from "react";

/** Ambient dark gradient background with floating particles. Pure CSS/SVG — no assets. */
export function AuthBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 3,
        delay: Math.random() * 8,
        duration: 10 + Math.random() * 12,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Gradient wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(120,90,220,0.12),transparent_60%),linear-gradient(180deg,#07070a_0%,#0b0b12_100%)]" />
      {/* Grid shimmer */}
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:48px_48px]" />
      {/* Particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-white/60 blur-[1px] animate-[float_var(--d)_ease-in-out_infinite]"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            ["--d" as string]: `${p.duration}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0) translateX(0); opacity: .35 }
          50%     { transform: translateY(-30px) translateX(10px); opacity: .9 }
        }
      `}</style>
    </div>
  );
}
