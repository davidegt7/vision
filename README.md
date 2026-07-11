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
| **Dream board** | Multi-upload, drag-drop, text with fonts/aspect, Pinterest, wallpaper export |
| **Saved boards** | Multiple boards, auto-save in the browser |
| **Manifestation** | Check goals off as they land |
| **Affirmations** | Sleep TTS loop + night mode |
| **Daily write** | One gentle prompt per day |
| **Stars** | Birthday → daily reading + optional notifications |
| **Human Design** | Calculate or paste your chart (under Stars) |
| **Muse** | Soft AI companion — use *your* ChatGPT / OpenRouter / Grok key |

Data stays in **this browser’s storage** (localStorage). Clearing site data wipes boards.

### Muse (AI) setup

Muse can use **your ChatGPT paid plan via Codex CLI** (same idea as Caspian Studio) — no separate API key — or cloud API keys.

#### A) Codex / Claude / Grok CLI (recommended if you already use them)

On your Mac:

```bash
# once: log into Codex with your ChatGPT account
codex login

cd vision
npm run muse-bridge
# → http://127.0.0.1:5199
```

In the app → **Muse → Settings**:

1. Provider: **Codex (ChatGPT plan)** (or Claude / Grok CLI)
2. Bridge URL: `http://127.0.0.1:5199/v1/muse`  
   (on phone: `http://YOUR_MAC_IP:5199/v1/muse`, same Wi‑Fi)
3. Save → chat

#### B) API keys (OpenAI / OpenRouter / Grok / custom)

1. Muse → Settings → pick provider → paste key  
2. Best with a **Vercel** deploy (`/api/muse` proxy). GitHub Pages alone can’t call OpenAI from the browser without a proxy.

## Stack

React + Vite + TypeScript + Zustand · PWA (manifest + service worker)
