# Workout Tracker

A full-body A/B/C session tracker: pick a day, log sets with weight/rep
steppers or a right-swipe, see last session's numbers as a muted reference,
run a rest timer between sets, edit your plan, and chart weight-over-time
per lift. Everything is stored on-device (`localStorage`) — there's no
server and no account.

It's a installable PWA: plain HTML/CSS/JS, no build step, no framework
dependency (a small hand-written virtual-DOM in `dom.js` handles re-renders
without losing input focus or caret position while you type).

## Installing it on your phone

The app is just static files, but a service worker needs to be served over
**HTTPS** (or `localhost`) to register — opening `index.html` directly from
disk (`file://`) will render the app but skip offline caching and the
"Add to Home Screen" install prompt. Easiest options:

1. **GitHub Pages** — push this repo, enable Pages for it (Settings → Pages
   → serve from the branch, `/app` folder or move these files to the repo
   root), then open the published URL on your phone.
2. **Any static host** — Netlify, Vercel, Cloudflare Pages, etc. Drag-and-drop
   the `app/` folder, no build command needed.
3. **Your own network** — run a static server (e.g. `npx http-server app`)
   on a computer on the same Wi-Fi as your phone and open its LAN address —
   fine for trying it out, but the service worker will only register if that
   server is on `localhost` from the phone's point of view, which a LAN IP
   isn't. Use option 1 or 2 for the real install.

Once it's reachable over HTTPS on your Pixel 9 Pro:

1. Open the URL in Chrome.
2. Tap the **⋮** menu → **Add to Home screen** (Chrome may also offer an
   install banner automatically).
3. Launch it from the home screen icon — it opens full-screen, no browser
   chrome, and keeps working offline after that first visit.

## Files

- `index.html` — app shell + manifest/meta tags
- `styles.css` — all visual styling (palette, layout, components)
- `dom.js` — tiny virtual-DOM (`h`, `Component`) the app is built on
- `app.js` — all app state, screens, and logic
- `manifest.webmanifest` — PWA name/icons/colors for the install prompt
- `sw.js` — service worker (cache-first, offline support)
- `icons/` — app icons (including maskable variants for Android's adaptive icon shapes)

## Settings

Units (lb/kg), carry-over from last session, and the rest timer are all
toggleable from the gear icon on the Today screen — these were exposed via
the design tool's own props panel in the original prototype, so they got a
real in-app Settings sheet here instead.
