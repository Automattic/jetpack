# Newsletter Stats Recent Posts Design

## Goal

Add a **Recent Posts** card to the Newsletter Stats page. The card lists the site's ten most recent published posts and drafts, then enriches posts that appear in the WordPress.com email summary with recipient, open-rate, and click-rate data.

## Scope

- Add the card below the subscriber chart.
- List ten posts total across `publish` and `draft`, ordered newest first.
- Use the current site's WordPress data as the source of truth for post content.
- Use the latest 30 rows from WordPress.com `stats/emails/summary` only to enrich matching posts with email metrics.
- Keep the Stats page's existing 30-day subscriber chart and 30-send aggregate rates unchanged.
- Support Jetpack-connected sites and WordPress.com Simple sites through the same Newsletter REST response contract.

## Architecture

The Newsletter package will expose a composed endpoint:

```text
GET /jetpack/v4/newsletter/stats/recent-posts
```

`Subscriber_Stats_Controller` will own the endpoint because it already owns the Newsletter Stats authorization and WordPress.com integration. The endpoint will:

1. query the current site for its ten newest `post` records with status `publish` or `draft`;
2. request the latest 30 email-summary rows from WordPress.com Stats;
3. index summary rows by post ID;
4. combine local post presentation data with matching email metrics;
5. return one normalized response for the React application.

The endpoint will not fetch post content through the WordPress.com posts API. `WP_Query` remains the source of truth in every host environment, including WordPress.com Simple. WordPress.com Stats is used only for email metrics.

For connected self-hosted and Atomic sites, the portable package continues using its signed blog-token proxy. WordPress.com Simple has no general blog token on the Newsletter screen, so the package will expose the `jetpack_newsletter_stats_pre_request` filter with `( mixed|null $response, string $endpoint, array $query_args ): mixed`. A WPCOM-owned callback will register from the Newsletter mu-plugin integration, handle only `subscribers` and `emails/summary`, call the existing Stats implementation internally, and return the same payload. Returning `null` preserves the portable proxy fallback. The override must not weaken Connection Manager globally or introduce WPCOM library dependencies into the portable package.

To avoid two requests for the same email summary, the composed response will also include the totals needed by the existing Open Rate and Click Rate cards. The frontend will request:

- `stats/subscribers` for the 30-day subscriber series and current subscriber totals;
- `stats/recent-posts` for the recent-post rows and aggregate email totals.

## REST Contract

Successful responses use this shape:

```ts
type RecentPostsResponse = {
 posts: Array< {
  id: number;
  title: string;
  status: 'publish' | 'draft';
  date: string;
  url: string;
  image: string | null;
  recipients: number | null;
  openRatePercent: number | null;
  clickRatePercent: number | null;
 } >;
 emailTotals: {
  sends: number;
  uniqueOpens: number;
  uniqueClicks: number;
 } | null;
 viewAllUrl: string;
 createPostUrl: string;
};
```

Post fields come from the current site:

- `id` from `WP_Post::ID`;
- `title` from the post title, with an untitled fallback;
- `status` from `post_status`;
- `date` from the post date;
- `url` from the permalink for published posts and the authenticated preview link for drafts;
- `image` from the featured-image URL.

The response also supplies `viewAllUrl` as `wp-admin/edit.php` and `createPostUrl` as `wp-admin/post-new.php`.

Metric fields come from the matching email-summary row:

- `recipients` from `total_sends`;
- `openRatePercent` from `opens_rate` as a percentage in the `0–100` range;
- `clickRatePercent` from `clicks_rate` as a percentage in the `0–100` range.

Posts not present in the latest 30 summary rows receive `null` metric values. The absence of `_jetpack_dont_email_post_to_subs` will not be treated as proof that an email was sent.

The route requires `manage_options`, matching the existing Newsletter Stats routes.

## UI Structure

The current `subscriber-stats-chart.tsx` remains the Stats page owner. To keep this addition small, only the table is extracted:

```text
routes/dashboard/components/
├── subscriber-stats-chart.tsx
├── subscriber-stats-chart.module.scss
└── recent-posts.tsx
```

`SubscriberStatsChart` owns the two React Query requests, greeting, metrics, chart, and page composition. `RecentPosts` receives normalized rows and query-state props and renders the new card. Shared types stay beside their only consumers rather than introducing a new component hierarchy.

The Recent Posts card follows the supplied reference:

- heading **Recent Posts**;
- **View all** link to `wp-admin/edit.php`;
- columns **Post**, **Status**, **Recipients**, **Opens**, and **Clicks**;
- featured image, title, and date in the Post column;
- **Published** or **Draft** status badge;
- published titles and images link to the public permalink;
- draft titles and images link to the authenticated preview;
- recipient count and percentage-formatted rates for matched summary rows;
- em dashes for missing metrics.

The list contains ten rows rather than the five shown in the reference. The component will use semantic table markup, keyboard-accessible links, associated column headings, and decorative thumbnail alt text. Styling will use logical CSS properties and adapt the table for narrower screens. Automated tests will not assert layout.

## Loading, Empty, and Error States

- The existing dashboard `QueryClientProvider` owns caching, and separate `useQuery` calls keep Recent Posts loading and retry independent from the subscriber chart.
- If no eligible posts exist, the card presents an empty state with a link to create a post.
- If the composed endpoint fails, the card presents an error and retry action while the rest of Stats remains available.
- If the WordPress.com email-summary request fails but the local post query succeeds, the endpoint still returns the local rows with `null` metrics and `emailTotals: null`.
- A missing featured image uses a neutral placeholder.
- An empty post title uses the localized label **(no title)**.

## Testing

### PHP

Tests will verify that the controller:

- registers the route with the existing authorization rule;
- rejects unauthorized requests;
- queries only `publish` and `draft` posts and limits the result to ten;
- orders posts newest first;
- generates public and preview URLs for the corresponding statuses;
- maps featured images and untitled posts;
- matches summary rows by post ID;
- normalizes recipients and rates without confusing `0–1` ratios with `0–100` percentages;
- uses `null` for unavailable metrics;
- returns local posts when the WordPress.com summary request fails;
- produces aggregate email totals from the same summary response.

### WordPress.com Simple integration

WPCOM tests will verify that its Newsletter integration:

- registers the narrow host override only in the WPCOM environment;
- serves both supported Stats paths without requiring a Jetpack connection token;
- preserves the response shapes used by the portable controller;
- leaves signed blog-token behavior unchanged for connected sites.

### JavaScript

Tests will verify that the Stats UI:

- requests the subscribers and recent-posts endpoints;
- renders published and draft rows;
- renders recipient and percentage values when metrics exist;
- renders em dashes when metrics are absent;
- links published posts to permalinks and drafts to previews;
- renders the View all destination;
- covers loading, empty, error, and retry behavior;
- derives the aggregate Open Rate and Click Rate from the returned totals.

No visual-regression or layout-specific tests are included.

## Non-goals

- Fetching or identifying emails older than the 30 rows exposed by `stats/emails/summary`.
- Treating every published post as a sent newsletter.
- Filtering, sorting, searching, or paginating the Recent Posts card.
- Adding a dedicated all-posts Newsletter Stats report.
- Adding date-range controls to the subscriber chart.
