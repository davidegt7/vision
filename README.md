# vision

**Your dream life, all in one place.**

Mobile-first PWA for Chrome (Android) and Safari (iPhone). Vision boards, manifestation, affirmations, journal & astrology — no app store required.

## Run on your computer + phone (same Wi‑Fi)

```bash
cd vision
npm install
npm run dev
```

Vite prints something like:

```
➜  Local:   http://127.0.0.1:5188/
➜  Network: http://192.168.x.x:5188/
```

On your **phone** (Chrome or Safari), open the **Network** URL (not `127.0.0.1`).

### Install on the home screen

| Browser | How |
|---------|-----|
| **Safari (iPhone)** | Share → **Add to Home Screen** |
| **Chrome (Android)** | Menu ⋮ → **Install app** / **Add to Home screen** |

Opens full-screen like a native app.

---

## Live site (no Mac hosting)

**Production URL:**  
**https://davidegt7.github.io/vision/**

Pushes to `main` deploy automatically (GitHub Actions → GitHub Pages).

### Install on your phone

1. Open the URL above in **Safari** (iPhone) or **Chrome** (Android)
2. **iPhone:** Share → **Add to Home Screen**
3. **Android:** Menu → **Install app** / Add to Home screen

No computer required after deploy. HTTPS works properly for install.

---

## Features

| Area | What you get |
|------|----------------|
| **Today** | One daily screen: HD line, star focus, top goal, affirmation, Muse 10‑min start, evening 3 lines + mark manifested |
| **Languages** | English, Español, Français, Português, Deutsch, Italiano, 中文, 日本語 (picker on Today + Stars; Muse replies in that language) |
| **Dream board** | Multi-upload, drag-drop, text with fonts/aspect, Pinterest, wallpaper export |
| **Saved boards** | Multiple boards, auto-save in the browser |
| **Manifestation** | Check goals off as they land |
| **Affirmations** | Sleep TTS loop + night mode |
| **Daily write** | One gentle prompt per day |
| **Stars** | Birthday → daily reading + optional notifications |
| **Human Design** | Calculate or paste your chart (under Stars) |
| **Muse** | Soft AI companion via Codex CLI on your Mac |

Data stays in **this browser’s storage** (localStorage). Clearing site data wipes boards.

### Muse (AI) — Codex only (for now)

Uses **Codex CLI** on your Mac (ChatGPT paid plan via `codex login`) — same idea as Caspian Studio. No OpenAI API key yet.

```bash
# once
codex login

# leave this running while you chat
cd vision
npm run muse-bridge
# → http://127.0.0.1:5199
```

In the app → **Muse**:

1. Bridge URL defaults to `http://127.0.0.1:5199/v1/muse`
2. Wait for **Codex ready**
3. Chat or tap a quick chip

**Phone (same Wi‑Fi as Mac):**

1. Open vision via the Mac **Network** URL from `npm run dev`  
   (e.g. `http://192.168.1.10:5188`) — **not** GitHub Pages HTTPS.
2. Muse auto-sets the bridge to `http://YOUR_MAC_IP:5199/v1/muse`.  
   If it still says Bridge off, tap **Use this** / **Save & check**.
3. Mac must keep `npm run muse-bridge` running.

GitHub Pages can’t reach the local bridge (browser blocks HTTPS → HTTP).

API keys (OpenAI etc.) can come later when you’re ready to pay for platform access.

## Stack

React + Vite + TypeScript + Zustand · PWA (manifest + service worker)
