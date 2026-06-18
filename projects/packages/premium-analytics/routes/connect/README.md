# Connect Route

Detects whether the site is connected to WordPress.com and, when it is not,
shows a "site not connected" screen.

This package does **not** own the connection flow. Under the Jetpack umbrella the
consumer (e.g. the Premium Analytics plugin, or Jetpack itself) is responsible
for connecting the site — `@automattic/jetpack-connection` already ships the
`ConnectScreen` and `useConnection` building blocks for that. This package only
needs to know whether the site is connected, and route accordingly.

This is the first step of a two-route onboarding flow:

- **`/connect`** — surfaces the not-connected state (this route).
- **`/syncing`** — show sync progress while the initial data sync runs.
- **`/` (dashboard)** — the data view, gated on a finished sync.

## Structure

```
connect/
├── route.tsx                    # Route guard (redirects if already connected)
├── stage.tsx                    # Stage component (thin wrapper)
├── style.scss                   # Stage-level styles
├── components/
│   └── site-not-connected/      # "Site not connected" screen
│       ├── site-not-connected.tsx
│       ├── style.scss
│       └── index.ts
└── images/
    ├── connection/              # Connection SVG illustration
    └── index.ts                 # Barrel export
```

## How it works

1. If the site is not connected, the dashboard guard redirects to `/connect`.
2. The user sees a "site not connected" screen. Connecting the site is handled
   by the consumer, not by this package.
3. Once the site is connected, visiting `/connect` redirects to the dashboard;
   if the initial sync has not finished, the dashboard guard forwards them to
   `/syncing`.
4. When the sync finishes, `/syncing` redirects to the dashboard.

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
