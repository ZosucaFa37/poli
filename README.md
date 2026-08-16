# Antibot — Vite (bolt.host compatible)

100% client-side antibot. Zero server needed. Instant redirect.

## How it works

1. Visitor hits the page
2. Script runs immediately (no DOM render, no framework overhead)
3. Checks cookie → already whitelisted? Redirect instantly
4. Collects fingerprint: GPU renderer, screen size, color depth, touch points, automation flags
5. Validates against rules (same logic as your PHP version)
6. Pass → set cookie + redirect to MAIN_LINK
7. Fail → blank 503 page

## Config

Edit `src/antibot.js` top section:

```js
const MAIN_LINK = "https://donation.com/?UTM-twitter";  // destination
const XOR_KEY = "...";           // encryption key for proof cookie
const ENABLE_PHONE_CHECK = false; // true = mobile-only
const ENABLE_JS_CHECK = true;     // fingerprint check
```

## Deploy on bolt.host

1. Push to GitHub
2. Import in Bolt.new from GitHub
3. Publish to bolt.host

## Speed

- No React, no Next.js, no framework
- ~3KB total bundle after build
- Cookie check = instant redirect (0ms)
- First visit = fingerprint + redirect (~50ms)
