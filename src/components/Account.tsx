import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  currentSession,
  displayEmail,
  isAuthConfigured,
  onAuthChange,
  sendMagicLink,
  signInWith,
  signOut,
} from "../lib/auth";

/**
 * Sign-in card.
 *
 * Signing in is identity only right now — nothing syncs. The copy has to be
 * honest about that, otherwise an account reads as "my stuff is safe now"
 * and someone loses a journal they thought was backed up.
 */
export function Account() {
  const configured = isAuthConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!configured) return;
    let alive = true;
    void currentSession().then((s) => {
      if (alive) setSession(s);
    });
    const off = onAuthChange((s) => {
      setSession(s);
      // Landing back from a magic link / OAuth round trip.
      if (s) setNote("");
    });
    return () => {
      alive = false;
      off();
    };
  }, [configured]);

  const run = async (fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(true);
    setNote("");
    const res = await fn();
    setNote(res.message);
    setBusy(false);
  };

  if (!configured) {
    return (
      <section className="card form-card">
        <p className="card-label">Account</p>
        <p className="hint" style={{ marginTop: 0 }}>
          Sign-in is built but not switched on yet — it needs a free Supabase
          project, then <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code>. See <strong>Sign-in</strong> in
          the README.
        </p>
        <p className="muted tiny" style={{ margin: 0 }}>
          Nothing is lost meanwhile: vision works exactly as it does today, and
          Backup below is still how you keep your data safe.
        </p>
      </section>
    );
  }

  if (session) {
    return (
      <section className="card form-card">
        <p className="card-label">Account</p>
        <p className="hint" style={{ marginTop: 0 }}>
          Signed in as <strong>{displayEmail(session) || "your account"}</strong>.
        </p>
        <p className="muted tiny">
          Signing in doesn’t move your boards or journal off this device yet —
          they’re still only in this browser. Use <strong>Backup</strong> below
          to keep a copy.
        </p>
        <div className="add-row" style={{ marginTop: "0.75rem" }}>
          <button
            type="button"
            className="btn ghost"
            disabled={busy}
            onClick={() => void run(signOut)}
          >
            {busy ? "…" : "Sign out"}
          </button>
        </div>
        {note && <p className="status-line">{note}</p>}
      </section>
    );
  }

  return (
    <section className="card form-card">
      <p className="card-label">Account</p>
      <p className="hint" style={{ marginTop: 0 }}>
        Sign in to claim your spot. Right now it’s just an account — your
        boards and journal stay on this device either way, so this is optional.
      </p>

      <label style={{ marginTop: "0.85rem" }}>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
        />
      </label>
      <div className="add-row" style={{ marginTop: "0.5rem" }}>
        <button
          type="button"
          className="btn primary"
          disabled={busy || !email.trim()}
          onClick={() => void run(() => sendMagicLink(email))}
        >
          {busy ? "…" : "Email me a link"}
        </button>
      </div>
      <p className="muted tiny">No password — you get a link that signs you in.</p>

      <p className="muted tiny" style={{ margin: "0.75rem 0 0.5rem" }}>
        Or
      </p>
      <div className="add-row">
        <button
          type="button"
          className="btn ghost"
          disabled={busy}
          onClick={() => void run(() => signInWith("google"))}
        >
          Continue with Google
        </button>
        <button
          type="button"
          className="btn ghost"
          disabled={busy}
          onClick={() => void run(() => signInWith("apple"))}
        >
          Continue with Apple
        </button>
      </div>

      {note && <p className="status-line">{note}</p>}
    </section>
  );
}
