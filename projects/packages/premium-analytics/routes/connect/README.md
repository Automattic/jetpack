# Connect Route

The Stats plan choice a site sees before it is connected to WordPress.com. Picking a plan connects the site.

Onboarding is two routes:

- **`/connect`** — the plan choice (this route).
- **`/` (dashboard)** — the data view. Nothing waits on the analytics sync; the store section notes that its numbers are incomplete until that sync lands.

## Structure

```
connect/
├── route.tsx                    # Route guard (redirects if already connected)
├── stage.tsx                    # Offline-mode notice, or the plan choice
├── use-plan-choice.ts           # Registration and where each plan goes next
├── style.scss                   # Stage-level styles
└── components/
    └── pricing-grid/            # Free vs. paid table, on the Jetpack PricingTable
```

## How it works

1. If the site is not connected, the dashboard guard redirects to `/connect`.
2. Every plan registers the site first, which gives WordPress.com a blog to attach a plan to.
   - **Start for free** and **I already have a plan** then send the user to authorize, and come back to the dashboard.
   - **Get Paid Stats** opens the `/upgrade` route to pick a tier. Its checkout links the account afterwards and returns to the dashboard.
3. An offline-mode site cannot be registered, so it gets a notice instead of the table.
4. Once the site is connected, visiting `/connect` redirects to the dashboard.

## Route guards (`beforeLoad`)

| Route           | Redirect rule               |
| --------------- | --------------------------- |
| `/connect`      | already registered → `/`    |
| `/` (dashboard) | not registered → `/connect` |

Route guards read connection state synchronously through
`isPremiumAnalyticsSiteConnected()`, which also treats WordPress.com Simple as
connected. Do not read connection script data directly in a route guard.
