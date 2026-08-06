import { AnimatePresence, motion } from "framer-motion";
import { Download, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Android/Chrome "Add to Home screen" prompt + offline status pill.
 * The install banner only appears when the browser actually fires
 * `beforeinstallprompt` (i.e. the PWA passes installability checks).
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (localStorage.getItem("jai_install_dismissed") === "1") return;
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    const sync = () => setOffline(!navigator.onLine);

    sync();
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem("jai_install_dismissed", "1");
    setDeferred(null);
  };

  return (
    <>
      <AnimatePresence>
        {offline && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass-strong fixed left-1/2 top-3 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs text-muted-foreground"
          >
            <WifiOff className="h-3.5 w-3.5" /> Offline — cached pages still work
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deferred && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="glass-strong fixed inset-x-3 bottom-3 z-[200] flex items-center gap-3 rounded-2xl p-3 sm:left-auto sm:right-4 sm:w-80"
          >
            <img src="/icon-192.png" alt="" aria-hidden="true" className="h-10 w-10 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">Install JAI.AI</div>
              <div className="truncate text-xs text-muted-foreground">Full-screen app, works offline</div>
            </div>
            <button
              onClick={install}
              className="flex items-center gap-1.5 rounded-full bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground glow-sm active:scale-[0.97]"
            >
              <Download className="h-3.5 w-3.5" /> Install
            </button>
            <button onClick={dismiss} aria-label="Dismiss" className="rounded-lg p-1 text-muted-foreground hover:bg-white/5">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
