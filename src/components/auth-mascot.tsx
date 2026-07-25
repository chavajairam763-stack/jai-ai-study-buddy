import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";

/**
 * AuthMascot — a friendly SVG character that reacts to the login form.
 *
 * States:
 *  - "idle"     : gentle breathing + periodic blink
 *  - "email"    : eyes track the caret while the user types their email
 *  - "password" : both hands cover the eyes
 *  - "peek"     : password revealed — surprised, wide eyes
 *  - "success"  : jumps happily; parent renders confetti
 *  - "error"    : sad, shakes head
 */
export type MascotState = "idle" | "email" | "password" | "peek" | "success" | "error";

interface Props {
  state: MascotState;
  /** 0..1 — how far along the email input the caret is; drives eye tracking. */
  emailProgress?: number;
}

export function AuthMascot({ state, emailProgress = 0.5 }: Props) {
  const bodyControls = useAnimation();
  const headControls = useAnimation();
  const blinkRef = useRef<number | null>(null);

  // Breathing loop — always on, layered under state-driven animations.
  useEffect(() => {
    bodyControls.start({
      scaleY: [1, 1.02, 1],
      y: [0, -2, 0],
      transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
    });
  }, [bodyControls]);

  // State-driven head animation
  useEffect(() => {
    if (state === "success") {
      headControls.start({
        y: [0, -32, 0, -18, 0],
        rotate: [0, -6, 6, -3, 0],
        transition: { duration: 0.9, ease: "easeOut" },
      });
    } else if (state === "error") {
      headControls.start({
        x: [0, -8, 8, -6, 6, 0],
        rotate: [0, -4, 4, -2, 2, 0],
        transition: { duration: 0.6 },
      });
    } else {
      headControls.start({ x: 0, y: 0, rotate: 0, transition: { duration: 0.3 } });
    }
  }, [state, headControls]);

  // Eye tracking: horizontal offset based on email progress, vertical when looking at fields.
  const { pupilX, pupilY } = useMemo(() => {
    if (state === "email") {
      // Follow caret across email field (-3 .. +3 px), look slightly down.
      return { pupilX: -3 + emailProgress * 6, pupilY: 2.5 };
    }
    if (state === "peek") return { pupilX: 0, pupilY: -1 };
    if (state === "success") return { pupilX: 0, pupilY: -2 };
    if (state === "error") return { pupilX: 0, pupilY: 2 };
    return { pupilX: 0, pupilY: 0 };
  }, [state, emailProgress]);

  // Random blinks during idle/email — clear on unmount.
  useEffect(() => {
    if (state === "password") return; // eyes hidden anyway
    const schedule = () => {
      blinkRef.current = window.setTimeout(() => {
        const el = document.getElementById("mascot-eyelids");
        if (el) {
          el.animate(
            [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }, { transform: "scaleY(0)" }],
            { duration: 220, easing: "ease-in-out" },
          );
        }
        schedule();
      }, 2200 + Math.random() * 2600);
    };
    schedule();
    return () => {
      if (blinkRef.current) window.clearTimeout(blinkRef.current);
    };
  }, [state]);

  const eyesHidden = state === "password";
  const eyesWide = state === "peek";
  const mouthPath =
    state === "success"
      ? "M40 68 Q50 82 60 68"          // big smile
      : state === "error"
      ? "M40 74 Q50 66 60 74"          // frown
      : state === "peek"
      ? "M46 70 Q50 76 54 70"          // small "o"
      : "M42 70 Q50 76 58 70";         // gentle smile

  return (
    <div className="pointer-events-none relative mx-auto h-56 w-56 select-none sm:h-64 sm:w-64">
      {/* Soft ground shadow */}
      <motion.div
        className="absolute bottom-2 left-1/2 h-3 w-32 -translate-x-1/2 rounded-full bg-black/40 blur-md"
        animate={{ scaleX: state === "success" ? [1, 0.7, 1] : 1 }}
        transition={{ duration: 0.9 }}
      />

      <motion.svg
        viewBox="0 0 140 160"
        className="absolute inset-0 h-full w-full drop-shadow-[0_18px_30px_rgba(212,175,55,0.18)]"
        animate={bodyControls}
      >
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#f7e7a8" />
            <stop offset="60%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8a6d1f" />
          </radialGradient>
          <radialGradient id="cheekGrad">
            <stop offset="0%" stopColor="#ff9aa2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff9aa2" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="caseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a3a44" />
            <stop offset="100%" stopColor="#1c1c22" />
          </linearGradient>
        </defs>

        {/* Suitcase */}
        <g transform="translate(96 108)">
          <rect x="0" y="6" width="34" height="26" rx="4" fill="url(#caseGrad)" stroke="#d4af37" strokeWidth="1" />
          <rect x="12" y="0" width="10" height="8" rx="2" fill="none" stroke="#d4af37" strokeWidth="1.5" />
          <circle cx="6" cy="19" r="1.2" fill="#d4af37" />
          <circle cx="28" cy="19" r="1.2" fill="#d4af37" />
        </g>

        {/* Body + head group (head bobs/shakes via headControls) */}
        <motion.g animate={headControls}>
          {/* Body */}
          <ellipse cx="60" cy="118" rx="30" ry="24" fill="url(#bodyGrad)" />
          {/* Head */}
          <circle cx="60" cy="60" r="38" fill="url(#bodyGrad)" />
          {/* Cheeks */}
          <circle cx="36" cy="68" r="7" fill="url(#cheekGrad)" />
          <circle cx="84" cy="68" r="7" fill="url(#cheekGrad)" />

          {/* Eyes group — hidden by hands in password state */}
          <g>
            {/* Whites */}
            <motion.ellipse
              cx="48" cy="56"
              rx={eyesWide ? 8 : 6.5}
              ry={eyesWide ? 9 : 7}
              fill="#fff"
              animate={{ rx: eyesWide ? 8 : 6.5, ry: eyesWide ? 9 : 7 }}
              transition={{ duration: 0.25 }}
            />
            <motion.ellipse
              cx="72" cy="56"
              rx={eyesWide ? 8 : 6.5}
              ry={eyesWide ? 9 : 7}
              fill="#fff"
              animate={{ rx: eyesWide ? 8 : 6.5, ry: eyesWide ? 9 : 7 }}
              transition={{ duration: 0.25 }}
            />
            {/* Pupils */}
            <motion.circle
              cx="48" cy="56" r="2.8" fill="#111"
              animate={{ cx: 48 + pupilX, cy: 56 + pupilY }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            />
            <motion.circle
              cx="72" cy="56" r="2.8" fill="#111"
              animate={{ cx: 72 + pupilX, cy: 56 + pupilY }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            />
            {/* Eyelids for blink */}
            <g id="mascot-eyelids" style={{ transformOrigin: "60px 56px", transform: "scaleY(0)" }}>
              <rect x="40" y="50" width="17" height="12" rx="6" fill="url(#bodyGrad)" />
              <rect x="64" y="50" width="17" height="12" rx="6" fill="url(#bodyGrad)" />
            </g>
          </g>

          {/* Mouth */}
          <motion.path
            d={mouthPath}
            stroke="#2a1a05"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            animate={{ d: mouthPath }}
            transition={{ duration: 0.3 }}
          />

          {/* Arms — animate to cover eyes when password */}
          <Arm side="left" hiding={eyesHidden} />
          <Arm side="right" hiding={eyesHidden} />
        </motion.g>
      </motion.svg>

      {/* Confetti on success */}
      <AnimatePresence>{state === "success" && <Confetti />}</AnimatePresence>
    </div>
  );
}

function Arm({ side, hiding }: { side: "left" | "right"; hiding: boolean }) {
  const isLeft = side === "left";
  // Resting position — beside body. Hiding position — over eyes.
  const rest = isLeft
    ? { x1: 32, y1: 96, x2: 20, y2: 118, hx: 20, hy: 118 }
    : { x1: 88, y1: 96, x2: 100, y2: 118, hx: 100, hy: 118 };
  const cover = isLeft
    ? { x1: 32, y1: 96, x2: 46, y2: 58, hx: 46, hy: 58 }
    : { x1: 88, y1: 96, x2: 74, y2: 58, hx: 74, hy: 58 };
  const t = hiding ? cover : rest;
  return (
    <motion.g animate={{ opacity: 1 }}>
      <motion.line
        x1={t.x1} y1={t.y1}
        animate={{ x2: t.x2, y2: t.y2 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        stroke="url(#bodyGrad)" strokeWidth="10" strokeLinecap="round"
      />
      <motion.circle
        r="7" fill="url(#bodyGrad)"
        animate={{ cx: t.hx, cy: t.hy }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
      />
    </motion.g>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 24 });
  const colors = ["#d4af37", "#f7e7a8", "#ff9aa2", "#9ad0ff", "#b8f2c9"];
  return (
    <div className="pointer-events-none absolute inset-0">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const dist = 80 + Math.random() * 60;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist + 40,
              opacity: 0,
              rotate: 360,
            }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-sm"
            style={{ background: colors[i % colors.length] }}
          />
        );
      })}
    </div>
  );
}
