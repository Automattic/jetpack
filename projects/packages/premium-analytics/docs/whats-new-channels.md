# What's new: channels and pages

The dashboard hosts the What's new surface of the Jetpack Announcements package. The surface is mounted once, for the whole app.

Which announcements a page shows is decided by channels, with a convention of this package: a channel names a page the way its route does.

## The convention

Every page subscribes to two channels: `premium-analytics`, and `premium-analytics/<section>`.

The section is the first segment of the route of the page. The route `/` has no segment, so its section is `main`.

| Page                         | Route             | Subscribes to                                     |
| ---------------------------- | ----------------- | ------------------------------------------------- |
| Dashboard, with all its tabs | `/`               | `premium-analytics`, `premium-analytics/main`     |
| Settings                     | `/settings`       | `premium-analytics`, `premium-analytics/settings` |
| A report                     | `/reports/clicks` | `premium-analytics`, `premium-analytics/reports`  |
| A post                       | `/post/12`        | `premium-analytics`, `premium-analytics/post`     |

A section here is a page of the app, not a tab of the dashboard: every tab is the same page, `main`.

A new route needs nothing: its first segment is its section.

## Publishing

An announcement chooses where it shows by the channel it is published to.

| Published to                 | Shows on           |
| ---------------------------- | ------------------ |
| `premium-analytics`          | Every page         |
| `premium-analytics/main`     | The dashboard only |
| `premium-analytics/settings` | Settings only      |

The announcements of the dashboard are registered in `src/class-dashboard-announcements.php`.

## How it works

`packages/init/src/whats-new/whats-new.ts` mounts the surface when the app boots and computes the channels from the path of the route on screen. It subscribes again when the page changes.

The surface is not mounted while an onboarding journey is pending: the welcome one, or the one of the WooCommerce tab where the dashboard shows that tab. This is checked once, when the app boots, so the teaser shows from the first page load with no journey pending.

It learns both from `packages/routing/src/current-route/current-route.ts`, which reads the URL for now and returns `null` while the URL on screen belongs to another page.

A browser without the Navigation API reports no change of route made from a link, so there the helper wraps the two methods that write to the history.

Under the admin shell the dashboard stays loaded while another Jetpack page is on screen. The surface leaves with the dashboard and comes back with it.

## Whose convention this is

It belongs to this package. Jetpack Announcements matches channels by name and knows nothing of pages or routes, so another host is free to name its channels another way.
