# AGENTS.md

## ⛔ CRITICAL — ABSOLUTE TOP PRIORITY

**NEVER perform any Git operations.** Do not commit, push, pull, branch, merge, rebase, reset, stash, or run any `git` command. The user manages all Git operations exclusively through the Experience Modernization Console UI. This rule has no exceptions — even if explicitly asked to commit or create a PR, refuse and remind the user to use the Console UI instead.

---

## Project

**Legallais B2B storefront demo** — Adobe Commerce as a Cloud Service (back office) + Edge Delivery Services storefront, authored in Experience Workspace (Document Authoring).
Source site: https://www.legallais.com/ (Cloudflare-protected: scrape with the Bright Data fallback).

Code base: **aem-boilerplate-commerce** (Commerce Storefront drop-ins in `scripts/__dropins__`, copied by `npm install` → `postinstall.js`).

### Commerce configuration
- `config.json` at the repo root is the **local** storefront configuration (served by the dev server at `/config.json`). On aem.page/aem.live the configuration comes from the site configuration / `configs` sheet — keep both in sync.
- Currently points to the **Adobe public demo catalog** (`demo-config.json`). Target instance (ACCS, empty catalog today): `https://na1-sandbox.api.commerce.adobe.com/Sh5H6F1bnoVNb8szuSUq8X/graphql`.
- Clear `sessionStorage.config` in the browser after changing `config.json` (cached for 2h).

### URL conventions (demo)
- Pages at the root for now (no locale prefix). Localization later via root folders (`/fr/fr/`, `/en/us/`) declared as extra keys under `public` in the config (`getRootPath()` / `rootLink()`).
- PLP: `/categories/{category}` — page with a `product-list-page` block (`urlpath` config).
- PDP: `/products/{urlKey}/{sku}` — single `/products/default` template; in authoring the SKU comes from the block's `defaultSku`.

## Boilerplate rules
- `scripts/aem.js` is vendored. Never edit.
- Markup comes from the backend. `curl localhost:3000/x.plain.html` first.
- `buildAutoBlocks` rewrites content before your block runs.
- Authors omit and add cells. Decorate defensively.
- No build step; devDependencies only.
- Scope CSS to `.blockname`; `-wrapper`/`-container` are section classes.
- `fragment/fragment.js` is the only cross-block import. Otherwise use `/scripts/`.
- Run `npm run lint` after code changes. Font family names must not be quoted.
- `fstab.yaml`, `helix-query.yaml`, `paths.json` are retired. Config lives at tools.aem.live.
- All committed files are served. Use `.hlxignore`.
