# Connect Route

Connection flow for Jetpack site registration and WordPress.com authorization.

This is the first step of a three-route onboarding flow:

- **`/connect`** — authorize the site (this route).
- **`/syncing`** — show sync progress while the initial data sync runs.
- **`/` (dashboard)** — the data view, gated on a finished sync.

## Structure

```
connect/
├── route.tsx                    # Route guard (redirects if already connected)
├── stage.tsx                    # Stage component (thin wrapper)
├── style.scss                   # Stage-level styles
├── components/
│   ├── connect/                 # Main connect screen (authorize + ToS)
│   │   ├── connect.tsx
│   │   ├── style.scss
│   │   └── index.ts
│   ├── connect-offline/         # Shown when the site is in Jetpack offline mode
│   │   ├── connect-offline.tsx
│   │   ├── style.scss
│   │   └── index.ts
│   └── connect-unavailable/     # Fallback when connection data is missing
│       ├── connect-unavailable.tsx
│       ├── style.scss
│       └── index.ts
└── images/
    ├── connection/              # Connection SVG illustration
    ├── connection-error/        # Error SVG illustration
    └── index.ts                 # Barrel export
```

## How it works

1. If the site is not connected, the dashboard guard redirects to `/connect`.
2. The user sees a welcome screen with an "Authorize and sync data" button.
3. Clicking the button starts the Jetpack registration + OAuth flow.
4. After authorization the user returns to the dashboard; if the initial sync
   has not finished, the dashboard guard forwards them to `/syncing`.
5. When the sync finishes, `/syncing` redirects to the dashboard.
6. If the site is already connected, visiting `/connect` redirects to `/`.
7. If the site is in Jetpack offline/staging mode, `/connect` shows an
   "unavailable in offline mode" screen with no authorize button (see
   Troubleshooting below) — the button would always 403 there.

## Route guards (`beforeLoad`)

| Route           | Redirect rule                                               |
| --------------- | ----------------------------------------------------------- |
| `/connect`      | already registered → `/`                                    |
| `/syncing`      | not registered → `/connect`; sync finished → `/`            |
| `/` (dashboard) | not registered → `/connect`; sync not finished → `/syncing` |

Connection state is read synchronously from
`getScriptData()?.connection?.connectionStatus?.isRegistered`, and the sync
milestone from `getScriptData()?.premium_analytics?.initial_full_sync_finished`
(injected by the backend `Sync_Status_Tracker`).

## Troubleshooting

### `invalid_user_permission_jetpack_connect` (403) when clicking "Authorize and sync data"

```json
{
	"code": "invalid_user_permission_jetpack_connect",
	"message": "You do not have the correct user permissions to perform this action.",
	"data": { "status": 403 }
}
```

This error is misleading — it has nothing to do with the current user's role. It
means the site is running in **Jetpack offline/staging mode**, and Jetpack's
capability map forces `jetpack_connect` → `do_not_allow` in that state,
regardless of whether the user is an admin.

**Where it comes from:** the `jetpack-connection` package's
`Manager::jetpack_connection_custom_caps()` checks `( new Status() )
->is_offline_mode()` and returns `do_not_allow` for `jetpack_connect` /
`jetpack_connect_user`. The REST permission callback on
`/jetpack/v4/connection/register` then returns the 403 above.

**What triggers offline mode:**

- `JETPACK_DEV_DEBUG` constant defined truthy
- `JETPACK_STAGING_MODE` constant defined truthy
- `WP_LOCAL_DEV` constant defined truthy
- Any callback on the `jetpack_offline_mode` or `jetpack_is_staging_site` filters returning `true`
- Hostnames that look like local/staging (`*.local`, `*.test`, etc.)

Confirm with `wp jetpack status` on the host — if the output starts with
`Jetpack is in Offline Mode:`, that's the cause. To connect locally, run on a
host that is not in offline mode (e.g. a Jurassic Ninja site), or remove the
offending constant / filter and reload.

**Handled in the UI:** the `/connect` stage detects offline mode via
`connectionStatus.offlineMode.isActive` (read synchronously from script data in
`stage.tsx`) and renders the `connect-offline/` screen — an informative
"unavailable in offline mode" state with no authorize button — instead of letting
the user click a button that always 403s. (`WOOA7S-1327`)
