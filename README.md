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
| **Backup** | Save everything to a file, restore it on any device (Settings → Backup) |
| **Sign-in** | Optional accounts — email link, Google, Apple (off until Supabase is set up) |

Data stays in **this browser’s storage** (localStorage). Clearing site data — or losing the phone — wipes boards, goals and journal.

### Backup & restore

There is no account and no server, so **the file is the only safety net**.

- **Settings → Backup → Save a backup** writes `vision-backup-YYYY-MM-DD.json` (boards, goals, journal, affirmations, profile, Muse history).
- **Restore from file** replaces everything on the device. It shows what's there now vs. what's in the file and asks first — but it can't be undone.
- Board images are embedded, so a picture-heavy board makes a bigger file.
- Your Muse **API key is never written to the file**; the key already on the device is kept when you restore.

Restoring is also how you move to a new phone: save on the old one, open vision on the new one, restore.

---

## Sign-in (optional — off by default)

**Signing in does not sync or back up anything yet.** It creates an account and nothing more; boards and journal still live only in the browser, and the backup file above is still the only recovery path. Sync is a later, bigger job (board images need blob storage). The Account card says this out loud so an account never reads as "my stuff is safe now".

Until it's configured, vision runs exactly as before and Settings → Account explains it isn't switched on. `supabase-js` (~57kB gzipped) is code-split and **never downloads** while sign-in is off.

### Switching it on

1. Create a free project at [supabase.com](https://supabase.com) (David has to do this — it needs an account).
2. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
   The anon key is designed to ship in client code — it is *not* a secret. Row-level security protects user data.
3. **Local dev** — `cp .env.example .env.local` and paste both in. (`.env.*` is gitignored.)
4. **Live site** — GitHub repo → Settings → Secrets and variables → Actions → **Variables** → add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Repo *variables*, not secrets: the anon key is public by design, and secrets aren't readable in a Pages build anyway. The workflow already passes both through.
5. **Supabase → Authentication → URL Configuration**, add to redirect URLs:
   - `https://davidegt7.github.io/vision/` (live — the trailing `/vision/` matters)
   - `http://localhost:5188/` (dev)
6. **Supabase → Authentication → Providers**: enable **Email**. For **Google**, add OAuth credentials. **Apple** needs a paid Apple developer account ($99/yr) — the button is there, but it errors until configured, and says so.

Push to `main` after adding the variables; the next deploy picks them up.

### Sign-in methods

| Method | Notes |
|--------|-------|
| **Email link** | No password. Most reliable in an iPhone home-screen PWA. |
| **Google** | One tap. OAuth redirects can be fiddly in standalone PWA mode. |
| **Apple** | Expected on iPhone; needs the paid developer account. |

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
