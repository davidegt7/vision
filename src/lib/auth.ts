import type { Session, SupabaseClient } from "@supabase/supabase-js";

/**
 * Sign-in for vision.
 *
 * Identity only, for now — signing in does NOT sync or back up anything yet.
 * The backup file is still the only recovery path, and the UI has to keep
 * saying so, or an account becomes a false sense of safety.
 *
 * Config is baked at build time (static host, no server to ask):
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 * The anon key is meant to ship in client code — it's not a secret. Row-level
 * security in Supabase is what keeps one user's rows away from another's.
 *
 * supabase-js is ~57kB gzipped, so it's loaded on demand rather than in the
 * main bundle: unconfigured, it never downloads at all, and this is a phone
 * app where that weight is felt.
 */

const URL_ = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

/** False until David creates the Supabase project and sets the two vars. */
export function isAuthConfigured(): boolean {
  return Boolean(URL_ && ANON);
}

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * Null when unconfigured — callers must handle it rather than crash the app.
 * Downloads supabase-js on first real use.
 */
export async function supabase(): Promise<SupabaseClient | null> {
  if (!isAuthConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(URL_, ANON, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Magic-link / OAuth land back here with tokens in the URL.
          detectSessionInUrl: true,
        },
      }),
    );
  }
  return clientPromise;
}

/**
 * Where providers send people back to. Must match the Supabase redirect
 * allow-list exactly, including the /vision/ base on GitHub Pages.
 */
export function redirectUrl(): string {
  return new URL(import.meta.env.BASE_URL || "/", window.location.origin).href;
}

export type OAuthProvider = "google" | "apple";

export interface AuthResult {
  ok: boolean;
  message: string;
}

const NOT_SET_UP =
  "Sign-in isn’t switched on yet — vision needs a Supabase project first (see README).";

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Supabase's provider errors are cryptic; say the useful thing instead. */
function readable(raw: string, provider?: string): string {
  const m = raw.toLowerCase();
  // Chrome says "Failed to fetch", Safari "Load failed" — both mean the project
  // URL is wrong or the phone is offline, and neither says so.
  if (
    m.includes("failed to fetch") ||
    m.includes("load failed") ||
    m.includes("networkerror") ||
    m.includes("network request failed")
  ) {
    return "Couldn’t reach the sign-in service. Check your connection — or, if you just set this up, that VITE_SUPABASE_URL points at a real project.";
  }
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) {
    return `${provider ?? "That provider"} isn’t enabled in the Supabase project yet — turn it on under Authentication → Providers.`;
  }
  if (m.includes("redirect") && m.includes("not allowed")) {
    return "This address isn’t in the Supabase redirect allow-list yet — add it under Authentication → URL Configuration.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many tries just now. Give it a minute.";
  }
  return raw;
}

export async function sendMagicLink(email: string): Promise<AuthResult> {
  const address = email.trim();
  if (!address || !address.includes("@")) {
    return { ok: false, message: "That doesn’t look like an email address." };
  }
  try {
    const sb = await supabase();
    if (!sb) return { ok: false, message: NOT_SET_UP };
    const { error } = await sb.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: redirectUrl() },
    });
    if (error) return { ok: false, message: readable(error.message) };
    return {
      ok: true,
      message: `Check ${address} — there's a sign-in link waiting. It opens vision back up.`,
    };
  } catch (e) {
    return { ok: false, message: readable(messageOf(e)) };
  }
}

export async function signInWith(provider: OAuthProvider): Promise<AuthResult> {
  const label = provider === "google" ? "Google" : "Apple";
  try {
    const sb = await supabase();
    if (!sb) return { ok: false, message: NOT_SET_UP };
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl() },
    });
    // On success the browser is already navigating away.
    if (error) return { ok: false, message: readable(error.message, label) };
    return { ok: true, message: `Opening ${label}…` };
  } catch (e) {
    return { ok: false, message: readable(messageOf(e), label) };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const sb = await supabase();
    if (!sb) return { ok: false, message: NOT_SET_UP };
    const { error } = await sb.auth.signOut();
    if (error) return { ok: false, message: readable(error.message) };
    return { ok: true, message: "Signed out." };
  } catch (e) {
    return { ok: false, message: readable(messageOf(e)) };
  }
}

export async function currentSession(): Promise<Session | null> {
  try {
    const sb = await supabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/** Fires on sign-in, sign-out and token refresh. Returns an unsubscribe. */
export function onAuthChange(fn: (session: Session | null) => void): () => void {
  let unsubscribe = () => {};
  let cancelled = false;
  void supabase().then((sb) => {
    if (!sb || cancelled) return;
    const { data } = sb.auth.onAuthStateChange((_event, session) => fn(session));
    unsubscribe = () => data.subscription.unsubscribe();
    // Unsubscribed before the client finished loading.
    if (cancelled) unsubscribe();
  });
  return () => {
    cancelled = true;
    unsubscribe();
  };
}

/** Best display name we have: profile name comes from the app, not the provider. */
export function displayEmail(session: Session | null): string {
  return session?.user?.email || "";
}
