# Error reporting

Reports uncaught Premium Analytics dashboard errors to WordPress.com's JS error log, so crashes on sites we cannot reproduce become visible.

It reports uncaught exceptions only. An API failure the UI already handles and shows to the user is not an error report, and must not be sent.

## Sources

Every report carries one of three sources.

- `boundary`: `StatsErrorBoundary` caught a render error. React already proved the error came from our tree, so the report is sent whether or not the stack has a dashboard frame. The boundary then rethrows, so the host's own boundary still renders the fallback UI.
- `error`: the window `error` event, installed by `installGlobalErrorHandlers()`.
- `unhandledrejection`: the window `unhandledrejection` event, installed by the same call.

The last two are dropped unless the stack has a frame inside a known dashboard script origin. A wp-admin page also runs other plugins' and browser extensions' scripts, and their errors are not ours to report.

## The gate

PHP decides whether reporting is on. The package only reads the boolean `premium_analytics.error_reporting.enabled` from the script data, and sends nothing when it is false or missing. Today only WordPress.com Simple and WoA sites report. Widening that to self-hosted sites is a change to that one PHP condition, with no change here.

## Script origins

`premium_analytics.error_reporting.script_origins` lists the URL prefixes that mark a stack frame as dashboard code. It starts with this package's own `build/` URL. A package that ships its own build for the dashboard adds its build base URL, ending in a slash, through the `jetpack_premium_analytics_error_reporting_script_origins` filter. `ads`, `videopress` and `woocommerce-stats` already do this. Without it, an error thrown in that package's widget bundle is dropped as foreign when it arrives through `error` or `unhandledrejection`.

## Redaction

Nothing a reader typed may leave the browser, and the log index on the other side is shared with every other reporter that posts to this endpoint.

The message, the stack and the component stack lose the page's own query string and hash, the query of any absolute URL, and any email address. Truncation to the length limits runs after all of that, so a redaction cannot be cut in half. The email pattern is deliberately broader than a valid address: under-matching leaks an address, over-matching costs a few characters.

The page query reaches the report as one masked string, not as a field per parameter, because each parameter name would otherwise become a field in that shared index. A parameter whose name is not a plain identifier is dropped rather than masked: in string form the name itself is the leak, and there is no key left to hide it behind. A single marker records that something was removed.

## Dedupe and budget

A report is dropped when its redacted message and first dashboard frame match one already sent during the life of the page. The key uses the redacted message so that a message embedding the page query string does not produce a new key on every date-range change.

Each browser may send 10 reports per clock hour, counted in `localStorage` against the current hour bucket rather than a rolling window. When storage throws, the cap is 3 per page load.

Any refusal from the endpoint stops reporting for the rest of the hour, whatever its status, because a request sent while a ban is already active restarts that ban. Each refusal status is named once in the console outside production builds, so a stall does not pass for a healthy dashboard.

The budget exists because the endpoint rate-limits by IP, and a block there reaches the other Jetpack reporters sharing that IP, so a crash loop here must not be able to trigger one.

## The package version

The Premium Analytics package version travels in `properties.version`. The endpoint's top-level `jetpack_version` conventionally carries the Jetpack plugin version, so filling it with a package version would make a shared field disagree with every other reporter that sets it. `projects/packages/comments` reports its own version the same way.

## Errors that are not ours

Two kinds of crash reach us through the boundary without being a bug of ours. Both carry a tag so a search on this feature can exclude them.

A tab left open across a deploy asks for a module file that no longer exists. `React.lazy` turns the failed import into a render error, so the boundary reports it. Those carry `chunk-load`, matched from the four wordings that differ per browser and bundler, one of which only names the error rather than wording the message. Reloading the page would be the other answer, and no user-visible change is allowed here.

A translation tool or an extension that reparents React-managed text nodes crashes the commit phase with a `NotFoundError` from `insertBefore`. Those carry `dom-interference`, and `properties.dom_interference` names the agents found, as one field rather than one per agent. The probes run only while a report is being built, and each keys on an artefact only Chromium and extension translators leave behind: Safari and Firefox translate in place with no marker, so an absent value means undetectable rather than absent.
