# Error reporting

Reports uncaught Premium Analytics dashboard errors to WordPress.com's JS error log, so crashes on sites we cannot reproduce become visible.

It reports uncaught exceptions only. An API failure the UI already handles and shows to the user is not an error report, and must not be sent.

## Sources

Every report carries one of three sources.

- `boundary`: `StatsErrorBoundary` caught a render error. React already proved the error came from our tree, so the report is sent whether or not the stack has a dashboard frame.
- `error`: the window `error` event, installed by `installGlobalHandlers()`.
- `unhandledrejection`: the window `unhandledrejection` event, installed by the same call.

The last two are dropped unless the stack has a frame inside a known dashboard script origin. A wp-admin page also runs other plugins' and browser extensions' scripts, and their errors are not ours to report.

## The gate

PHP decides whether reporting is on. The package only reads the boolean `premium_analytics.error_reporting.enabled` from the script data, and sends nothing when it is false or missing. Today only WordPress.com Simple and WoA sites report. Widening that to self-hosted sites is a change to that one PHP condition, with no change here.

## Script origins

`premium_analytics.error_reporting.script_origins` lists the URL prefixes that mark a stack frame as dashboard code. A package that ships its own build for the dashboard adds its build base URL, ending in a slash, through the `jetpack_premium_analytics_error_reporting_script_origins` filter. `ads`, `videopress` and `woocommerce-stats` already do this. Without it, an error thrown in that package's widget bundle is dropped as foreign when it arrives through `error` or `unhandledrejection`.

## Dedupe and budget

A report is dropped when its message and first dashboard frame match one already sent during the life of the page.

Each browser may send 10 reports per rolling hour, counted in `localStorage`. When storage throws, the cap is 3 per page load. Any non-2xx response stops reporting for the rest of the hour.

The budget exists because the endpoint bans an IP for 60 minutes after 30 requests in an hour. That ban also stops every other Jetpack reporter behind the same IP, Comments included, so a crash loop here must not be able to trigger it.
