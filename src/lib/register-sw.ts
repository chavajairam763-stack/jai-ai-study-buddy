// Guarded PWA service worker registration.
// Never registers in dev, Lovable preview, iframes, or when ?sw=off is present.
export async function registerPwa() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const url = new URL(window.location.href);
  const host = window.location.hostname;
  const inIframe = window.top !== window.self;
  const isPreview =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev");
  const disabled = url.searchParams.get("sw") === "off";
  const isProd = import.meta.env.PROD;

  if (!isProd || inIframe || isPreview || disabled) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        if (r.active?.scriptURL.endsWith("/sw.js")) await r.unregister();
      }
    } catch { /* ignore */ }
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } catch { /* ignore */ }
}
