import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function markBootReady() {
  try {
    clearTimeout((window as unknown as { __visionBootTimer?: number }).__visionBootTimer);
    const boot = document.getElementById("boot");
    if (boot) boot.setAttribute("data-ready", "1");
  } catch {
    /* ignore */
  }
}

/** Visible fallback so iOS never shows a pure black unexplained screen */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            background: "#0e0a14",
            color: "#f4eef8",
            fontFamily: "system-ui, sans-serif",
            padding: "2rem 1.25rem",
            lineHeight: 1.45,
          }}
        >
          <h1 style={{ fontSize: "1.5rem" }}>vision hit a snag</h1>
          <p style={{ color: "#9a8eab" }}>{this.state.error.message}</p>
          <button
            type="button"
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 12,
              border: "none",
              background: "#6b4a9e",
              color: "#fff",
              fontSize: 16,
            }}
            onClick={() => {
              try {
                localStorage.removeItem("vision-app-v1");
              } catch {
                /* ignore */
              }
              location.reload();
            }}
          >
            Reset saved data & reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (rootEl) {
  markBootReady();
  rootEl.innerHTML = "";
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

/**
 * Service workers + Vite dev = black / stuck loading on iOS home screen.
 * Only register in production. Always purge bad SWs in dev.
 */
async function setupServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    /* ignore */
  }
}

void setupServiceWorker();
