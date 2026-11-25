# What's new: channels and pages

The dashboard hosts the What's new surface of the Jetpack Announcements package. The surface is mounted once, for the whole app.

Which announcements a page shows is decided by channels, with a convention of this package: a channel names a page the way its route does.

## The convention

The channel of the dashboard is `stats`, the slug of the product.

Every page subscribes to two channels: `stats`, and `stats/<section>`.

The section is the first segment of the route of the page. The route `/` has no segment, so its section is `main`.

| Page                         | Route             | Subscribes to             |
| ---------------------------- | ----------------- | ------------------------- |
| Dashboard, with all its tabs | `/`               | `stats`, `stats/main`     |
| Settings                     | `/settings`       | `stats`, `stats/settings` |
| A report                     | `/reports/clicks` | `stats`, `stats/reports`  |
| A post                       | `/post/12`        | `stats`, `stats/post`     |

A section here is a page of the app, not a tab of the dashboard: every tab is the same page, `main`.

A new route needs nothing: its first segment is its section.

## Publishing

An announcement chooses where it shows by the channel it is published to.

| Published to     | Shows on           |
| ---------------- | ------------------ |
| `stats`          | Every page         |
| `stats/main`     | The dashboard only |
| `stats/settings` | Settings only      |

The announcements of the dashboard are the entries of `get_announcements()`, in `src/class-dashboard-announcements.php`: an id, and the arguments of `register_announcement()`.

```php
'stats/arrange-tabs' => array(
	'date'     => '2026-11-12',
	'title'    => __( 'Arrange your tabs', 'jetpack-premium-analytics-pkg' ),
	'excerpt'  => __( 'Reorder the dashboard tabs and choose the one that opens first.', 'jetpack-premium-analytics-pkg' ),
	'content'  => '<p>' . esc_html__( 'Open the Stats options menu and choose Arrange tabs to reorder the tabs and to choose the one that opens first.', 'jetpack-premium-analytics-pkg' ) . '</p>',
	'channels' => array( self::CHANNEL . '/main' ),
),
```

The dashboard adds two rules to every entry. Only a user who can read the dashboard sees it, and a user who registered after its date does not.

## How it works

`packages/init/src/whats-new/whats-new.ts` mounts the surface when the app boots and computes the channels from the path of the route on screen. It subscribes again when the page changes.

The surface is not mounted while an onboarding journey is pending: the welcome one, or the one of the WooCommerce tab where the dashboard shows that tab. This is checked once, when the app boots, so the teaser shows from the first page load with no journey pending.

It learns both from `packages/routing/src/current-route/current-route.ts`, which reads the URL for now and returns `null` while the URL on screen belongs to another page.

A browser without the Navigation API reports no change of route made from a link, so there the helper wraps the two methods that write to the history.

Under the admin shell the dashboard stays loaded while another Jetpack page is on screen. The surface leaves with the dashboard and comes back with it.

## Whose convention this is

It belongs to this package. Jetpack Announcements matches channels by name and knows nothing of pages or routes, so another host is free to name its channels another way.
