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

1. Open the **Muse** tab → **Settings**
2. Pick a provider (ChatGPT / OpenRouter / Grok / custom)
3. Paste your API key (stored **only on this device**)
4. Chat or tap a quick chip (affirmations, board read, HD tips, …)

**Note:** OpenAI blocks browser calls for security. Muse works best when the app is on **Vercel** (included `/api/muse` proxy). On GitHub Pages alone, set a **Proxy URL** or deploy the same repo to Vercel.

## Stack

React + Vite + TypeScript + Zustand · PWA (manifest + service worker)
