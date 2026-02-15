# JavaScript Build

This PHP package includes webpack-built JS/CSS assets for wp-admin functionality. Output: `dist/`.

## Webpack Entries (`webpack.config.js`)

- **`jetpack-connection`** — UMD bundle re-exporting `@automattic/jetpack-connection` JS package. Registered as WP script handle `jetpack-connection` via `Connection_Assets::register_assets()`. This bridges the JS connection package to PHP plugins that need `wp_enqueue_script('jetpack-connection')` without their own webpack.
- **`identity-crisis`** — React app for IDC resolution UI (`src/identity-crisis/_inc/admin.jsx`). Uses `@automattic/jetpack-idc`.
- **`tracks-ajax`** — jQuery AJAX click tracking. Auto-tracks elements with `.jptracks` class.
- **`tracks-callables`** — Pixel-based analytics, exposed as `window.analytics`.
- **`jetpack-users-connection`** — Tooltips for WPCOM account column in Users list table.
- **SSO entries** — All `src/sso/*.js` and `src/sso/*.css` are auto-discovered as entries.

All assets are admin-only — do not enqueue on the frontend.

## Commands

```bash
jetpack build packages/connection       # dev build
jetpack watch packages/connection       # watch mode
pnpm run build                          # dev (from package dir)
pnpm run build-production              # production (minified + ES validation)
```

Uses `@automattic/jetpack-webpack-config` for transpilation, CSS extraction, and WP dependency extraction.