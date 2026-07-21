export function friendlyAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const m = raw.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (m.includes("user already registered") || m.includes("already registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("password should be")) return "Password must be at least 6 characters.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (m.includes("unsupported phone provider") || m.includes("sms provider")) return "Phone sign-in isn't configured yet. Use email or Google instead.";
  if (m.includes("invalid phone")) return "Enter a valid phone number with country code (e.g. +91…).";
  if (m.includes("otp") && m.includes("expired")) return "That code expired. Request a new OTP.";
  if (m.includes("token has expired") || m.includes("invalid token")) return "That code is invalid or expired.";
  if (m.includes("network") || m.includes("fetch")) return "Network issue — check your connection and try again.";
  if (m.includes("unauthorized")) return "Session expired. Please sign in again.";
  return raw || "Something went wrong. Please try again.";
}
