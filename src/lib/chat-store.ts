import type { ToolId } from "./tools";

export type Msg = { role: "user" | "assistant"; content: string };

export type Session = {
  messages: Msg[];
  conversationId: string | null;
  input: string;
};

const EMPTY: Session = { messages: [], conversationId: null, input: "" };

/** In-memory per-tool session cache so state survives page navigation. */
const sessions = new Map<ToolId, Session>();

export function getSession(id: ToolId): Session {
  return sessions.get(id) ?? EMPTY;
}

export function setSession(id: ToolId, s: Session) {
  sessions.set(id, s);
}

export function clearSession(id: ToolId) {
  sessions.delete(id);
}

/* ------------------------------------------------------------------ */
/* Tiny event buses (no external state library needed)                 */
/* ------------------------------------------------------------------ */

function createBus() {
  const listeners = new Set<() => void>();
  return {
    on(fn: () => void) {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },

    emit() {
      listeners.forEach((fn) => fn());
    },
  };
}

/** Fires when the conversation list should refetch. */
export const historyBus = createBus();

const openBus = createBus();
let pendingOpen: { tool: ToolId; conversationId: string | null } | null = null;

/** Ask a tool page to load a specific conversation (null = fresh chat). */
export function requestOpen(tool: ToolId, conversationId: string | null) {
  pendingOpen = { tool, conversationId };
  openBus.emit();
}

export function consumeOpen(tool: ToolId): { conversationId: string | null } | null {
  if (pendingOpen && pendingOpen.tool === tool) {
    const out = { conversationId: pendingOpen.conversationId };
    pendingOpen = null;
    return out;
  }
  return null;
}

export const onOpenRequest = openBus.on;
