# Adding new wp-verify Playwright tests

This directory holds the Playwright Test specs that run against the wp-verify
WordPress stack. New specs go here as `<feature>.spec.ts`; Playwright
auto-discovers any `*.spec.ts` under this directory (see
`testDir: './tests'` in `../playwright.config.ts`).

For how to run the suite, see [`tools/ai-sandbox/README.md`](../../README.md#wp-verify-playwright-ui-verification).

## What you get for free in every spec

Both `playwright.config.ts` and `global-setup.ts` set things up so a new spec
can `page.goto( '/wp-admin/...' )` and assert. Specifically:

| Concern | Where it's set | What that means for your spec |
|---|---|---|
| `baseURL = $WP_BASE` | `playwright.config.ts` (`use.baseURL`) | Use relative URLs: `await page.goto( '/wp-admin/admin.php?page=…' )`. |
| Admin login (cookies + localStorage) | `global-setup.ts` writes `auth.json`; `playwright.config.ts` (`use.storageState`) loads it | Every test starts already logged in as `admin`. No per-test login. |
| premium-analytics plugin activated | `../mu-loader.php` (auto-mounted by `docker-compose.wp-verify.yml`) | The dashboard route is reachable without any plugin-activation step. |
| Single worker, no parallelism, `retries: 0` | `playwright.config.ts` (`workers: 1`, `fullyParallel: false`) | WP cookies/nonces stay coherent; flaky failures show through instead of being silently retried. |
| Artifacts on failure | `playwright.config.ts` (`screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `trace: 'retain-on-failure'`) | Failed runs leave a screenshot of the failing assertion plus full video + trace under `${PA_VERIFY_ARTIFACT_DIR:-/tmp/pa-verify}/playwright-output/`. |

## Patterns by scenario

### (a) Pure UI flow — most common case

Drop a new `.spec.ts` here, `goto` the route, assert. Use the existing
[`dashboard-mount.spec.ts`](./dashboard-mount.spec.ts) as the reference shape:

```ts
import { test, expect } from '@playwright/test';

const ANALYTICS_URL = '/wp-admin/admin.php?page=jetpack-premium-analytics';
const DASHBOARD_ROOT = '.jetpack-premium-analytics-dashboard';

test.describe( '<feature> flow', () => {
	test( '<expected behavior>', async ( { page } ) => {
		await page.goto( ANALYTICS_URL );
		await page.waitForSelector( DASHBOARD_ROOT );
		// interact with the page, then assert.
	} );
} );
```

Conventions worth following:

- One `test.describe` per feature; one `test()` per failure mode you want to
  see reported independently. Split rather than `expect.soft`-stacking — the
  reporter is much more informative when each failure mode has its own line.
- Constants (route URL, root selector) at the top of the file. The two
  existing specs both do this and it keeps the body focused on behavior.
- Prefer `page.waitForSelector` / `expect( locator ).toBeVisible()` over
  arbitrary `page.waitForTimeout` — the latter masks real timing regressions.

### (b) Need to seed WordPress data (posts, users, options)

Two routes, in order of preference:

1. **Per-spec via wp-json REST** — the test is already logged in as admin, so
   cookies authenticate REST calls automatically:

   ```ts
   const created = await page.request.post( '/wp-json/wp/v2/posts', {
   	data: { title: 'Seed post', status: 'publish' },
   } );
   const post = await created.json();
   // …drive the UI that depends on this post…
   ```

   This keeps the seed code in the spec file alongside the assertions that
   need it. Fast (in-process, no container hop) and self-cleaning if you
   teardown via the same REST surface in `test.afterEach`.

2. **One-shot via the `wpcli` container** for bulk fixture data or things
   wp-json doesn't expose (`wp option update`, `wp transient set`, etc.).
   Shell out from a `test.beforeAll`:

   ```ts
   import { execSync } from 'child_process';

   test.beforeAll( () => {
   	execSync(
   		"docker exec jetpack-ai-wpcli wp option update some_key 'some_value'",
   		{ stdio: 'inherit' }
   	);
   } );
   ```

   Trade-off: cross-container exec is slower (~hundreds of ms) and assumes
   the suite runs on the host, not from inside the sandbox container.

If a fixture is needed by **every** spec, lift it into `../global-setup.ts`
instead — the cost is paid once at the start of the run.

### (c) Need extra plugins active or other WP filesystem changes

- **Activate another plugin from this monorepo**: extend
  [`../mu-loader.php`](../mu-loader.php) to `require_once` that plugin's
  entry file, *and* add a `volumes:` entry under the `wordpress` service in
  `../../docker-compose.wp-verify.yml` mounting the plugin source into
  `/var/www/html/wp-content/plugins/<name>/` (ro mount, like
  premium-analytics).
- **Activate a plugin from the WordPress.org repo**: run `wp plugin install
  <slug> --activate` against the `jetpack-ai-wpcli` container — either as a
  `beforeAll` hook in the spec that needs it, or as a one-time step in
  `../global-setup.ts` if every spec needs it.
- **Tweak a WP option or theme**: same two routes as (b) — `wp option
  update` via wpcli exec, or hit the REST `settings` endpoint from inside
  the spec.

## File layout conventions

- **Specs**: `<feature>.spec.ts` directly under this directory. Playwright
  only discovers `*.spec.ts`; helpers can sit alongside without being
  picked up as tests.
- **Helpers** (shared selectors, page-object wrappers, fixture builders):
  put them in `_helpers/` so the underscore-prefixed directory reads as
  "not a spec". Specs sit alongside `_helpers/` in this directory, so
  import as `from './_helpers/<name>'` (`../_helpers/...` would point
  outside `tests/` and fail to resolve).
- **Test-only fixtures** (HTML snippets, JSON payloads): `_fixtures/` under
  this directory.

## When to touch the config files instead of adding a spec

| If you want to… | Edit |
|---|---|
| Add a new browser (Firefox, WebKit) or device emulation | `../playwright.config.ts` `projects` |
| Bump the per-test timeout / retries policy | `../playwright.config.ts` `timeout` / `retries` |
| Add a different reporter (e.g. JSON for CI ingestion) | `../playwright.config.ts` `reporter` |
| Run extra steps before any spec (seed dataset, install a plugin) | `../global-setup.ts` |
| Inspect or modify the auth flow / which user logs in | `../global-setup.ts` |

## Common pitfalls

- **`expect().toHaveText()` with React-rendered nodes**: React can hydrate
  text in stages. Prefer `await expect( locator ).toHaveText( 'X' )`
  (web-first assertion, has its own retry) over a `textContent()` snapshot.
- **Hovering SVG children**: see the comment block in
  [`pie-chart-tooltip.spec.ts`](./pie-chart-tooltip.spec.ts) — `locator.hover()`
  on SVG paths sometimes misses the listener attached to a parent `<g>`.
  Use `page.mouse.move( x, y )` against the segment's bounding box.
- **Cookie / nonce desync from parallel writes**: don't increase
  `workers` for this suite. The WP backend is shared single-tenant.
- **Slow first-run**: the first invocation on a machine downloads Chromium
  and warms caches; subsequent runs are ~2-3× faster. Don't size timeouts
  to first-run behavior.
