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

## Deploy for real (HTTPS — best for phones)

HTTPS is required for reliable install, notifications, and service worker on real devices.

### Option A — Vercel (easiest)

```bash
cd vision
npm i -g vercel   # once
vercel
```

Follow prompts. You get a URL like `https://vision-xxx.vercel.app` — open that in phone Chrome/Safari.

### Option B — Netlify

```bash
cd vision
npm run build
npx netlify deploy --prod --dir=dist
```

### Option C — Any static host

```bash
npm run build
# upload the `dist/` folder
```

`vercel.json` and `netlify.toml` are included for SPA routing.

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

Data stays in **this browser’s storage** (localStorage). Clearing site data wipes boards.

## Stack

React + Vite + TypeScript + Zustand · PWA (manifest + service worker)
