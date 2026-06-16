# Connect Route

Connection flow for Jetpack site registration and WordPress.com authorization.

## Structure

```
connect/
├── route.tsx                    # Route guard (redirects if connected)
├── stage.tsx                    # Stage component (thin wrapper)
├── style.scss                   # Stage-level styles
├── components/
│   ├── connect/                 # Main connect screen
│   │   ├── connect.tsx
│   │   ├── style.scss
│   │   └── index.ts
│   └── connect-unavailable/     # Jetpack unavailable fallback
│       ├── connect-unavailable.tsx
│       ├── style.scss
│       └── index.ts
└── images/
    ├── connection/              # Connection SVG illustration
    ├── connection-error/        # Error SVG illustration
    └── index.ts                 # Barrel export
```

## How it works

1. If the site is not connected, the dashboard redirects to `/connect`
2. The user sees a welcome screen with an "Authorize and sync data" button
3. Clicking the button starts the Jetpack registration + OAuth flow
4. After authorization, the user is redirected back to the dashboard
5. If the site is already connected, visiting `/connect` redirects to `/`

## Route guards

- **`/connect`** → if connected, redirects to `/`
- **`/` (dashboard)** → if not connected, redirects to `/connect`

Both guards use `getScriptData()?.connection?.connectionStatus?.isRegistered`.

## Testing the connection flow

### Disconnect the site

```bash
npx wp-env run cli -- wp eval "delete_option('jetpack_options'); delete_option('jetpack_private_options'); wp_cache_flush();"
```

### Check connection status

```bash
npx wp-env run cli -- wp jetpack status
```

### Reconnect

Navigate to the Analytics dashboard — the route guard will redirect to `/connect` where you can authorize again.

## Troubleshooting

### `invalid_user_permission_jetpack_connect` (403) when clicking "Authorize and sync data"

```json
{
  "code": "invalid_user_permission_jetpack_connect",
  "message": "You do not have the correct user permissions to perform this action.",
  "data": { "status": 403 }
}
```

This error is misleading — it has nothing to do with the current user's role. It means the site is running in **Jetpack offline/staging mode**, and Jetpack's capability map forces `jetpack_connect` → `do_not_allow` in that state, regardless of whether the user is an admin.

**Where it comes from:** `vendor/automattic/jetpack-connection/src/class-manager.php::jetpack_connection_custom_caps()` (installed via Composer) checks `( new Status() )->is_offline_mode()` and returns `do_not_allow` for `jetpack_connect` and `jetpack_connect_user`. The REST permission callback on `/jetpack/v4/connection/register` then returns 403 with the code above.

**What triggers offline mode:**

- `JETPACK_DEV_DEBUG` constant defined truthy
- `JETPACK_STAGING_MODE` constant defined truthy (common in `.wp-env.override.json`)
- `WP_LOCAL_DEV` constant defined truthy
- Any callback on the `jetpack_offline_mode` or `jetpack_is_staging_site` filters returning `true`
- Hostnames that look like local/staging (`*.local`, `*.test`, etc.)

Confirm with:

```bash
npx wp-env run cli -- wp jetpack status
```

If the output starts with `Jetpack is in Offline Mode:`, that's the cause.

**Fix:** remove `JETPACK_STAGING_MODE` / `JETPACK_DEV_DEBUG` from `.wp-env.override.json`, then restart wp-env:

```bash
npx wp-env stop && npx wp-env start
```

**Alternative — mu-plugin that overrides the filters** (useful if you want to keep the constants in place):

This repo's `.wp-env.json` does not map `wp-content/mu-plugins/` directly. `bin/setup-dev.sh` generates per-file mappings from `../woocommerce-analytics-wp-env/mu-plugins/` into `.wp-env.override.json`. So:

1. Drop the file in `../woocommerce-analytics-wp-env/mu-plugins/disable-jetpack-offline.php`:
   ```php
   <?php
   add_filter( 'jetpack_offline_mode', '__return_false' );
   add_filter( 'jetpack_is_staging_site', '__return_false' );
   ```
2. Re-run `bin/setup-dev.sh` to regenerate `.wp-env.override.json` with the new mapping.
3. Restart wp-env (`npx wp-env stop && npx wp-env start`).

Either way a restart is required — the constant toggle is usually simpler.

**Related:** `WOOA7S-1220` — the standalone UI should detect offline mode via `connectionStatus` and render the unavailable state instead of letting the user click a button that will always 403.
