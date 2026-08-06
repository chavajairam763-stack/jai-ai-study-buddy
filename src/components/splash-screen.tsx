import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Native-style splash screen.
 * Shows once per app launch (session), primarily in installed/standalone mode
 * so the cold start feels like an Android app opening.
 */
export function SplashScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const alreadyShown = sessionStorage.getItem("jai_splash") === "1";
    if (!standalone || alreadyShown) return;
    sessionStorage.setItem("jai_splash", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 1100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: "easeOut" } }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background"
        >
          <motion.img
            src="/icon-192.png"
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="h-24 w-24 rounded-3xl glow-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mt-6 text-center"
          >
            <div className="text-gradient text-2xl font-bold tracking-tight">JAI.AI</div>
            <div className="mt-1 text-xs text-muted-foreground">One AI. Endless Possibilities.</div>
          </motion.div>
          <div className="absolute bottom-16 h-0.5 w-32 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
              className="h-full w-1/2 rounded-full bg-gradient-primary"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
