# Newsletter Stats Recent Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the owner-specified Recent Posts table to Newsletter Stats and make the existing Stats requests work on both connected Jetpack sites and WordPress.com Simple.

**Architecture:** Keep the current Stats component and stylesheet. Add one composed Newsletter endpoint that queries ten local posts and enriches IDs found in the latest 30 email-summary rows; extract only the table into `recent-posts.tsx`. The existing dashboard `QueryClientProvider` and two stable `useQuery` keys own fetching, caching, independent errors, and retry. The portable package uses the existing blog-token proxy by default and exposes a narrow response override that the WPCOM Newsletter integration implements for Simple sites.

**Tech Stack:** PHP 7.4-compatible WordPress REST API and `WP_Query`; React 18, TypeScript, TanStack Query v5, `@wordpress/api-fetch`, `@automattic/charts`; Jest/Testing Library; PHPUnit/WorDBless; SCSS logical properties.

**UX authority:** The supplied screenshot and the owner's explicit decisions are authoritative. Do not alter the table UX without owner feedback, and do not add layout-specific tests.

---

## Files

### Jetpack

- Modify `projects/packages/newsletter/src/class-subscriber-stats-controller.php`
- Create `projects/packages/newsletter/tests/php/Subscriber_Stats_Controller_Test.php`
- Modify `projects/packages/newsletter/routes/dashboard/components/subscriber-stats-chart.tsx`
- Modify `projects/packages/newsletter/routes/dashboard/components/subscriber-stats-chart.module.scss`
- Create `projects/packages/newsletter/routes/dashboard/components/recent-posts.tsx`
- Create `projects/packages/newsletter/tests/subscriber-stats-chart.test.tsx`
- Create `projects/packages/newsletter/tests/recent-posts.test.tsx`
- Create Newsletter package and Jetpack plugin changelog entries

### WordPress.com

- The `wpcom-api` owner session implements the WPCOM side of the exact hook below and its tests on branch `add/newsletter-stats-blog-token-tests`.

## Task 1: Add the Portable Stats Host Override

- [ ] Write PHP tests proving `jetpack_newsletter_stats_pre_request` short-circuits both `subscribers` and `emails/summary` responses without a Jetpack connection.

Use this contract in the test:

```php
add_filter(
 'jetpack_newsletter_stats_pre_request',
 function ( $response, $endpoint, $query_args ) {
  return array(
   'endpoint'   => $endpoint,
   'query_args' => $query_args,
  );
 },
 10,
 3
);
```

Assert `get_subscribers()` returns endpoint `subscribers`, `get_email_summary()` returns `emails/summary`, and the original validated query arguments are preserved.

- [ ] Run the filtered test and verify it fails because the controller does not apply the hook:

```bash
cd projects/packages/newsletter
composer phpunit -- --filter Subscriber_Stats_Controller_Test
```

- [ ] Add one private dispatcher and route both existing methods through it:

```php
private function request_stats( $request, $path ) {
 /**
  * Allows a host to provide Newsletter Stats without a Jetpack connection proxy.
  *
  * @since $$next-version$$
  *
  * @param mixed|null $response   Host response, or null to use the portable proxy.
  * @param string     $endpoint   Stats endpoint path.
  * @param array      $query_args Validated request query arguments.
  */
 $response = apply_filters(
  'jetpack_newsletter_stats_pre_request',
  null,
  $path,
  $request->get_query_params()
 );

 return null !== $response
  ? $response
  : $this->proxy_request_to_wpcom_as_blog( $request, $path );
}
```

```php
public function get_subscribers( $request ) {
 return $this->request_stats( $request, 'subscribers' );
}

public function get_email_summary( $request ) {
 return $this->request_stats( $request, 'emails/summary' );
}
```

- [ ] Run the test again and verify it passes.

- [ ] Send the exact hook name/signature to `wpcom-api`; require its WPCOM callback to hook only on Simple/WPCOM, return null for unsupported paths, and leave Connection Manager semantics untouched.

## Task 2: Add the Composed Recent Posts Endpoint

- [ ] Add failing PHP tests for:
  - route registration and `manage_options` authorization;
  - exactly ten newest `post` records across `publish` and `draft`;
  - exclusion of pages and other statuses;
  - public permalink for published posts and preview link for drafts;
  - `(no title)` and null-image fallbacks;
  - summary matching by integer post ID;
  - `recipients`, `openRatePercent`, and `clickRatePercent` only for matches;
  - local rows with null metrics when summary returns `WP_Error`;
  - `emailTotals`, `viewAllUrl`, and `createPostUrl`.

Use an anonymous test subclass overriding `get_email_summary()` with a public fixture property. This uses an existing production method rather than introducing a test-only API.

- [ ] Run the filtered PHP test and verify RED.

- [ ] Register:

```text
GET /jetpack/v4/newsletter/stats/recent-posts
```

with `can_view()` and no public query arguments.

- [ ] Implement one `WP_Query`:

```php
new WP_Query(
 array(
  'post_type'           => 'post',
  'post_status'         => array( 'publish', 'draft' ),
  'posts_per_page'      => 10,
  'orderby'             => 'date',
  'order'               => 'DESC',
  'ignore_sticky_posts' => true,
  'no_found_rows'       => true,
 )
);
```

- [ ] Build one internal summary request with `period=alltime`, `quantity=30`, `sort_field=post_date`, and `sort_order=desc`. Index valid rows by `(int) $item['id']` and aggregate `total_sends`, `unique_opens`, and `unique_clicks` once.

- [ ] Return this exact shape, sourcing content locally and metrics only from a matched summary row:

```ts
{
  posts: Array<{
    id: number;
    title: string;
    status: 'publish' | 'draft';
    date: string;
    url: string;
    image: string | null;
    recipients: number | null;
    openRatePercent: number | null;
    clickRatePercent: number | null;
  }>;
  emailTotals: {
    sends: number;
    uniqueOpens: number;
    uniqueClicks: number;
  } | null;
  viewAllUrl: string;
  createPostUrl: string;
}
```

Use `get_permalink()` for published posts, `get_preview_post_link()` for drafts, `get_the_post_thumbnail_url( $post, 'thumbnail' )`, `admin_url( 'edit.php' )`, and `admin_url( 'post-new.php' )`. When summary fails, return local posts with null metrics and `emailTotals: null`.

- [ ] Run the filtered test and the full Newsletter PHP suite:

```bash
composer phpunit -- --filter Subscriber_Stats_Controller_Test
cd ../../../..
jp test php packages/newsletter
```

Expected: all pass.

## Task 3: Add the Recent Posts React Component

- [ ] Create `tests/recent-posts.test.tsx` first with one published row containing `122`, `58%`, and `21%`, plus one draft row whose three metrics are em dashes.

Assert the exact owner-approved behavior:

- headings: `Post`, `Status`, `Recipients`, `Opens`, `Clicks`;
- statuses: `Published`, `Draft`;
- published URL is the public permalink;
- draft URL is the preview URL;
- `View all` points to `wp-admin/edit.php`;
- featured image has `alt=""` and missing image renders a neutral placeholder;
- loading, empty, error, and Retry states work;
- no CSS/layout assertions.

- [ ] Run the test and verify RED:

```bash
cd projects/packages/newsletter
pnpm test -- --runInBand tests/recent-posts.test.tsx
```

- [ ] Implement `recent-posts.tsx` as a semantic `<section>` and `<table>`. Accept normalized rows, `viewAllUrl`, `createPostUrl`, `isLoading`, `isError`, and `onRetry`. Format recipient counts with `Intl.NumberFormat`, percentage fields as rounded values followed by `%`, and null metrics as `—`.

- [ ] Run the component test and verify GREEN.

## Task 4: Integrate the Table Without Refactoring Stats

- [ ] Create `tests/subscriber-stats-chart.test.tsx` with `apiFetch` routed by path. Require exactly:

```text
/jetpack/v4/newsletter/stats/subscribers
/jetpack/v4/newsletter/stats/recent-posts
```

Assert there is no direct frontend request to `/emails/summary`.

- [ ] Return `emailTotals: { sends: 200, uniqueOpens: 116, uniqueClicks: 42 }` and assert the existing cards show `58%` and `21%` while the Recent Posts rows render.

- [ ] Add a partial-failure case: reject only Recent Posts, resolve subscriber series, and assert the chart remains visible while the table shows Retry and aggregate rates show `—`.

- [ ] Run the test and verify RED.

- [ ] Modify `subscriber-stats-chart.tsx` only as needed:

  - replace the direct email-summary request with `/stats/recent-posts`;
  - use separate `useQuery` calls with stable keys `[ 'newsletter-stats', 'subscribers', 30 ]` and `[ 'newsletter-stats', 'recent-posts' ]`;
  - keep loading and error state independent through each query result;
  - derive weighted aggregate rates from `recentPostsQuery.data?.emailTotals`;
  - render `<RecentPosts />` after the existing chart;
  - pass `recentPostsQuery.refetch` to Retry so it retries only Recent Posts;
  - preserve all existing greeting, metric, chart, and 30-send label UX.

- [ ] Run targeted and full JavaScript tests:

```bash
pnpm test -- --runInBand tests/subscriber-stats-chart.test.tsx tests/recent-posts.test.tsx
pnpm test -- --runInBand
```

## Task 5: Apply the Supplied UX and Finish

- [ ] Extend the existing CSS module only. Match the supplied screenshot: white bordered card, 8px radius, heading/View all row, uppercase headers, row separators, 48px thumbnails, outlined statuses, muted dates and numeric cells, one-line ellipsized titles, and horizontal overflow at narrow widths. Use logical properties. Add no controls or layout changes not present in the owner's reference.

- [ ] Run Stylelint and build:

```bash
pnpm run lint-style projects/packages/newsletter/routes/dashboard/components/subscriber-stats-chart.module.scss
cd projects/packages/newsletter
volta run --node 24.20.0 --pnpm 11.5.2 pnpm run build
```

- [ ] Inspect with the owner at:

```text
http://localhost/wp-admin/admin.php?page=jetpack-newsletter&tab=stats
```

Do not revise UX without owner feedback.

- [ ] Add changelogs:

```bash
jp changelog add packages/newsletter -s minor -t added \
  -e "Stats: Add recent post email performance details."
jp changelog add plugins/jetpack -s minor -t enhancement \
  -e "Newsletter: Add recent post email performance details."
```

- [ ] Run final checks:

```bash
jp test js packages/newsletter
jp test php packages/newsletter
jp phan packages/newsletter
pnpm run lint-changed
composer phpcs:changed
cd projects/packages/newsletter && pnpm run typecheck
```

Run LSP diagnostics on changed PHP/TypeScript files and `lens_diagnostics mode=all`. Confirm the diff contains no unrelated untracked files and no layout-specific tests.

- [ ] Request code review, then commit/push only after all checks and owner UX runway pass.
