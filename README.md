# Card Hub

A mobile-first Progressive Web App that hosts a collection of casual games,
playable offline once installed. The first game is **Wild Cards**, a
generic Uno-style card game played against bots (no networking — everything
runs client-side).

## Adding a game

Each game is a self-contained module under `src/games/<id>/` that exports a
`GameModule` descriptor (see `src/shared/types/GameModule.ts`). Register it
in `src/hub/GameRegistry.ts` and it appears on the home screen and gets
routed automatically — the hub shell never needs to change.

## Development

```
npm install
npm run dev        # start the dev server
npm run test        # run the vitest suite (rules engine, bot AI)
npm run lint         # eslint
npm run build        # type-check + production build to dist/
npm run preview      # serve the production build locally
npm run icons        # regenerate the placeholder PWA icons in public/icons/
```

## Deployment

`npm run build` produces a fully static `dist/` folder — HTML/JS/CSS,
the web app manifest, the service worker, and icons. There's no backend or
API, so any static file host works, with two requirements:

1. **HTTPS.** Service worker registration (which is what makes offline play
   and "Add to Home Screen" installability work) only happens on a secure
   origin (`https://` or `localhost`). Plain HTTP will silently fail to
   install or cache anything.
2. **SPA fallback.** The app uses client-side routing (`react-router-dom`),
   so the server must serve `index.html` for any path it doesn't recognize
   as a file — otherwise a hard refresh on `/games/wild-cards` 404s.

### nginx

```nginx
server {
    listen 443 ssl;
    server_name games.example.com;
    root /var/www/games/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Don't let the service worker itself go stale in a browser cache.
    location = /sw.js {
        add_header Cache-Control "no-cache";
    }
}
```

### Caddy

```caddyfile
games.example.com {
    root * /var/www/games/dist
    encode gzip
    try_files {path} /index.html
    file_server
}
```

Caddy auto-provisions HTTPS via Let's Encrypt if the domain is publicly
reachable.

### After deploying

Visit the domain on the target phone's browser. The app shows a custom
"Add to Home Screen" banner on Android/Chrome; on iOS Safari (which doesn't
support that prompt) it shows instructions to use Share → Add to Home
Screen instead. Once installed, disconnecting from the network and
reopening the app should still work — everything needed to play is
precached by the service worker.

### Replacing the placeholder icons

`public/icons/*.png` and `public/favicon.svg` are simple generated
placeholders (see `scripts/generate-placeholder-icons.mjs`). Swap in real
artwork at the same file names/sizes (192, 512, 512 maskable, 180 apple
touch icon) and nothing else needs to change.
