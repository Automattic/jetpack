# AGENTS.md

Guidance for AI coding agents working in this package.

## Overview

Jetpack Premium Analytics is the unified analytics dashboard for Jetpack-connected sites — a full-page React SPA in wp-admin. It consolidates two older surfaces:

- **Jetpack Stats** — the Odyssey dashboard; backend from the `stats-admin` package, frontend built from `apps/odyssey-stats` in Calypso. Covers traffic, posts, subscribers, email stats, WordAds, and more.
- **Woo Analytics** — store reports (orders, products, customers, coupons, order attribution), from the private repo at https://github.com/woocommerce/woocommerce-analytics.

- Composer package: `automattic/jetpack-premium-analytics`
- PHP namespace: `Automattic\Jetpack\PremiumAnalytics`
- Text domain / REST namespace: `jetpack-premium-analytics-pkg` / `jetpack-premium-analytics/v1`
  (the `-pkg` suffix keeps the package's domain distinct from the plugin slug it ships under;
  `Assets::alias_textdomain()` maps it back to the plugin's domain at runtime)

## How it works

`Analytics::init()` loads the generated `build/build.php`, which registers an `admin_init`
interceptor for `?page=jetpack-premium-analytics`. The interceptor takes over the request
before WordPress renders the admin chrome; `@wordpress/boot` provides the SPA shell and
routing; each route under `routes/<name>/` is a lazy-loaded ES module discovered at build time
from its `package.json`. WordPress core or Jetpack's wp-build polyfills provide the WordPress
script handles/modules used by the dashboard, so the Gutenberg plugin is not required.

## Structure

```text
src/class-analytics.php                 # entry: loads build, registers menu + routes
src/REST/class-api-proxy-controller.php # the WPCOM data proxy (PREFIX_CONFIG)
src/REST/class-notices-controller.php   # /notices route
src/Sync/                               # interim woocommerce_analytics sync (WOOA7S-1550)
packages/data/src/api/                  # frontend fetch helpers (apiFetch)
packages/externals/                     # passthrough module for shared third-party libraries
routes/                                 # lazy-loaded SPA pages; build/ is generated
```

## Development

```bash
composer phpunit              # PHP tests
pnpm run build / watch        # frontend build (one-off / on change)
jetpack build --deps packages/premium-analytics
```

`pnpm run build` bundles only this package: monorepo dependencies (charts,
wp-build-polyfills, assets) must already be built. `jetpack build --deps` builds
them first — use it after merging trunk or when charts exports look stale.

Add a route: create `routes/<name>/package.json` (with `route.path` + `route.page`) and a
`stage.tsx` exporting `stage()`; rebuild — routes are auto-discovered.

Depends on `jetpack-connection`, `jetpack-stats`, `jetpack-sync`, `jetpack-config`.

## API

Two local REST surfaces; almost all data comes from WordPress.com via one agnostic proxy.

### Data proxy

`GET|POST /jetpack-premium-analytics/v1/proxy/v<version>/<prefix>/<sub-path>` forwards to
`public-api.wordpress.com/.../sites/<blog-id>/<prefix>/<sub-path>` signed as the connected blog
(no cross-origin or user-authed call).

- `<version>` is the WPCOM version (`1.1`, `1.2`, `2`); base derives from it (`v2`→`wpcom/`,
  `v1.x`→`rest/`). Use the version the old call used — the proxy does not normalise.
- `<blog-id>` is injected server-side — never put it in the path.
- `<prefix>` must be allowlisted in `PREFIX_CONFIG` or the route 404s. This is the security
  boundary — the blog token is only forwarded for these.

| Prefix                                                            | Capability                 | Writes (POST)                   |
| ----------------------------------------------------------------- | -------------------------- | ------------------------------- |
| `analytics` (Woo store reports)                                   | `view_woocommerce_reports` | —                               |
| `stats`                                                           | `view_stats`               | `stats/referrers/spam/`         |
| `wordads`                                                         | `activate_wordads`         | —                               |
| `subscribers` / `site-has-never-published-post` / `jetpack-stats` | `view_stats`               | —                               |
| `jetpack-stats-dashboard`                                         | `view_stats`               | whole prefix (busts read cache) |
| `commercial-classification`                                       | `view_stats`               | exact path                      |
| `upgrades` (not under `/sites/`)                                  | `view_stats`               | —                               |
| `posts` (pattern-constrained: only `<id>/likes`)                  | `view_stats`               | —                               |

`manage_options` is always accepted too. `POST` is rejected (`405 rest_read_only`) outside the
Writes column. Query params pass through except control params (`endpoint`, `version`,
`force_refresh`) and `site`. Successful `GET`s are cached 5 min (key: path+version+params); add
`force_refresh` to bypass. `x-wp-total` / `x-wp-totalpages` are forwarded back. Errors:
`403 no_connection`, `500`/`502 api_error`, `405 rest_read_only`, `401`/`403` on a failed cap.

### Notices

`GET|POST /jetpack-premium-analytics/v1/notices` (`{ id, status, postponed_for }`). Not proxied
because GET merges WPCOM dismissal state with local flags. Anything needing local processing
gets its own route outside `proxy/`, like this.

### Adding a proxied endpoint

To add a transparent forward, add a key to `PREFIX_CONFIG` (at least `capability`; add
`writes` / `cache_bust` as needed) and cover it in `data_endpoint_matrix()`.

### Migrating from Stats / Woo Analytics

Re-point a screen's data layer at the proxy instead of re-implementing old routes: `stats-admin`
routes (`jetpack/v4/stats-app/*`) → `stats` / `jetpack-stats` / `subscribers` / `wordads`
prefixes; Woo `analytics/reports/*` → `proxy/v2/analytics/reports/*`. The dashboard UI lives in
`routes/` here, not in Calypso. Frontend helpers go under `packages/data/src/api/`.

## WordPress.com Simple

Simple has no local proxy, notices, sync, or dashboard support routes — WPCOM serves the dashboard
and reaches `public-api.wordpress.com` directly. `jetpack-mu-wpcom` boots the package via
`Analytics::init_wpcom_simple()`, behind the `jetpack-premium-analytics` blog sticker.

### Route guards must use the shared site-readiness helpers

Every route's `beforeLoad` that checks connection or sync state must call
`isPremiumAnalyticsSiteConnected()` / `isPremiumAnalyticsInitialSyncFinished()` from
`routes/site-readiness.ts` — never read `getScriptData()?.connection?.connectionStatus?.isRegistered`
or `getScriptData()?.premium_analytics?.initial_full_sync_finished` directly. Simple has no Jetpack
connection, so a direct read silently evaluates to "not connected" there.

That's more than one broken route: it's a redirect loop. `/connect` and `/syncing` already go
through the shared helpers and treat Simple as connected and synced, so if a route added later
skips the helpers, Simple hits that route, gets redirected to `/connect`, and `/connect` — seeing
Simple as already connected — immediately redirects back to `/`. From the user's side this looks
like "the page just bounces to the dashboard," with nothing in the console pointing at the cause.
This shipped once (Automattic/jetpack#50266): the `/reports/$report` route was left reading script
data directly when the other four routes were migrated to the shared helpers, so it fell out of
sync with `/connect`'s guard and the two routes bounced traffic between each other on Simple.

Adding a new route with a connection/sync guard: grep `routes/` for
`isPremiumAnalyticsSiteConnected` first and copy that shape — don't re-derive the check from
script data.

### Why the dashboard support routes moved from `jetpack/v4` to `wpcom/v2`

The dashboard support routes (widget modules, default layout, sections) used to live under
`jetpack/v4` — the self-hosted Jetpack plugin's own namespace. WPCOM's REST centralization doesn't
recognize or expose that namespace for Simple sites, which run no Jetpack plugin at all, so those
routes were unreachable from public-api. `wpcom/v2` is a namespace WPCOM's centralization already
treats as site-specific by default for plain function-callback routes: registering under it is
enough for WPCOM to rewrite and expose the route as `/wpcom/v2/sites/<blog_id>/...` through
public-api, with no separate dotcom-side registration and no `wpcom_rest_api_v2_load_plugin()`
class shim required. That's why the rename happened (Automattic/jetpack#50266), and it's why
`Dashboard_Support_Routes::register()` exists as a standalone entry point WPCOM can call.

### Choosing a REST namespace for new endpoints

**Any future Premium Analytics REST endpoint that needs to work on both connected Jetpack sites
and WPCOM Simple must register under `wpcom/v2`** (via `DASHBOARD_REST_NAMESPACE` in
`src/rest-namespace.php`), not `jetpack/v4` or a plugin-specific namespace — those only reach
connected sites. An endpoint that's intentionally connected-site-only (e.g. the local data proxy,
notices) can stay under `jetpack-premium-analytics/v1`, since Simple never calls it.

**WPCOM's public-api process calls `Dashboard_Support_Routes::register()` directly**
(`src/class-dashboard-support-routes.php`) to register the dashboard's REST support routes
(widget modules, default layout, sections) standalone. The WPCOM-side caller is
`wp-content/rest-api-plugins/jetpack-endpoints/premium-analytics-dashboard.php` in the `wpcom`
repo — it `require_once`s this exact file and calls `::register()` by name.

**Renaming, moving, or changing this method's signature requires a matching WPCOM-side update.**
See Automattic/jetpack#50266 for the PR that established this contract.

## Pitfalls

- Never put the blog ID in a proxy path — it's injected server-side.
- A proxy 404 usually means the prefix isn't in `PREFIX_CONFIG`, not a missing WPCOM endpoint.
- Reads are cached 5 min; add `force_refresh` if a screen looks stale.
- `v2` vs `v1.x` changes the WPCOM base — a wrong version silently hits a different endpoint.
- Sync code under `src/Sync/` is interim (WOOA7S-1550); don't build on it.
- Don't edit dashboard React in Calypso — it lives here now.
- Internal package names use `@jetpack-premium-analytics/*` aliases throughout the package —
  never `@automattic/jetpack-premium-analytics-*`.
- Never import `@automattic/ui`, `@wordpress/ui`, or `@wordpress/dataviews` directly from
  anything under `packages/`, `widgets/`, or `routes/` — go through
  `@jetpack-premium-analytics/externals`. A direct import compiles the whole library into that
  bundle again; ESLint enforces this. `@automattic/charts` follows the same rule under
  `packages/`, but under `widgets/` and `routes/` it must come from
  `@jetpack-premium-analytics/widgets-toolkit` instead. See `packages/externals/README.md`.
- All source code comments must be in English.

## Widgets

New widgets live at the top of the package in `widgets/<widget-name>/` and are composed from
primitives in `packages/widgets-toolkit/` — chart, metric, and layout components built on
`@automattic/charts`. Each widget is its own pnpm workspace package so its render bundle can be
lazy-loaded by the dashboard at runtime.

> `packages/widgets-toolkit/` is an interim layer while the dashboard is in development and is
> expected to shrink over time (much of it folding into `@automattic/charts`), so treat its
> module paths as provisional rather than a long-term API.

> **Legacy note.** Widgets currently under `packages/widgets-toolkit/src/widgets/*` (e.g.
> `sales-by-coupon`, `sales-by-utm`) predate this layout and are scheduled to be migrated.
> Do not use them as templates for new work — follow the structure and story template below
> instead.

These rules apply to registered dashboard widgets: folders with `package.json`,
`widget.json`, `widget.ts`, and `render.tsx` that the dashboard can lazy-load.
Presentational-only component folders under `widgets/` are out of scope unless they
are being converted into registered widgets.

### REQUIRED: widget folder structure

Each new widget MUST ship as a self-contained folder with these files:

```text
widgets/<widget-name>/
├── package.json                            # workspace package; link: deps on widgets-toolkit
├── widget.json                             # declarative metadata (name, title, description, help, category, presentation)
├── widget.ts                               # runtime-only definition (icon, attributes, example)
├── render.tsx                              # the React component, wrapped in <WidgetRoot> from widgets-toolkit
└── stories/<widget-name>-widget.stories.tsx
```

Notes:

- `name` lives in `widget.json` and MUST use the `jpa/` prefix
  (e.g. `jpa/<widget-name>`). `widget.ts` no longer declares it.
- Keep `render.tsx` thin: compose toolkit primitives (`WidgetRoot`,
  `OrderMetricWidget`, etc.) rather than reimplementing data fetching, chart wiring, or
  theming.
- Per-widget React/`@wordpress/*` dependencies go in the widget's own `package.json` using
  `link:` for internal packages (e.g.
  `"@jetpack-premium-analytics/widgets-toolkit": "link:../../packages/widgets-toolkit"`).

### REQUIRED: render component contract

The render component receives only widget host props. Type it with
`WidgetRenderProps<T>` from `@wordpress/widget-primitives`, default `attributes`, and pass
host-provided attributes into `<WidgetRoot>`. This is how Storybook and the dashboard inject
`reportParams` for date range and comparison state.

```tsx
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { MyWidgetAttributes } from './widget';

type MyWidgetRenderAttributes = MyWidgetAttributes & Partial< ReportParamsFieldAttributes >;

export default function MyWidget( {
	attributes = {},
}: WidgetRenderProps< MyWidgetRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MyWidgetInner max={ attributes.max } />
		</WidgetRoot>
	);
}
```

The widget's own attribute shape is declared and exported once from `widget.ts`,
alongside the `attributes`/`example` schema it describes. `render.tsx` imports that type;
it may compose a render-only type with host fields like `Partial<ReportParamsFieldAttributes>`,
but it must not re-declare the widget's own attributes. A widget with no own attributes
must type its shape as `Record< never, never >`, not `Record< string, never >` — the
latter's `[key: string]: never` index signature collapses composed host fields such as
`reportParams` to `never`, while `Record< never, never >` composes cleanly.

Dashboard state is read inside the component wrapped by `<WidgetRoot>`:

```tsx
function MyWidgetInner( { max }: { max?: number } ) {
	const { reportParams } = useWidgetRootContext();
	// Fetch data with hooks that accept reportParams.
}
```

Do not call `useWidgetRootContext()` in the outer render component before `<WidgetRoot>`
exists, and do not read the dashboard date range directly from `attributes` in the inner
component.

### REQUIRED: Storybook story for every widget

Every widget MUST have a Storybook story alongside it. New widgets without a story should
not be merged.

1. **Location**: `widgets/<widget-name>/stories/<widget-name>-widget.stories.tsx`.
2. **Dashboard story**: Include a `WidgetDashboardWithWidget` story that renders through the
   shared `WidgetDashboardWithWidget` helper from `widgets/stories/widget-dashboard-with-widget.tsx`.
   It mounts the real `WidgetDashboard` with this single widget and exposes the standard
   dashboard controls (size, edit mode, host environment, etc.), so it shows how the widget
   actually renders in product. The `Default` and, when applicable, `WithComparison` close-up
   stories use the shared `withWidgetCanvas` decorator from the template below — but never ship
   _only_ a close-up story.
3. **Mocks**: Call `registerReportMocks()` at module-level for any widget that fetches
   report data. Without this the widget renders an error state in Storybook.
   - **Woo analytics widgets** (`/proxy/v2/analytics/reports/*`) are covered out of the box.
   - **Stats widgets** (`/proxy/v1.1/stats/*`) are NOT covered by default. For each new Stats
     endpoint, add fixture data under `packages/widgets-toolkit/src/stories/mocks/data/` and
     wire a handler in `routeStatsReport()` inside `register-report-mocks.ts`. See
     `data/search-terms.ts` for a reference implementation.
4. **Title**: `Packages/Premium Analytics/Widgets/<WidgetName>` (note: no "Widgets Toolkit"
   in the path — that path is reserved for the legacy widgets).
5. **Tags**: Include `tags: [ 'autodocs' ]` so the widget shows up in auto-generated docs.
6. **Storybook registration**: Add `projects/packages/premium-analytics/widgets` to
   `projects/js-packages/storybook/storybook/projects.js` if it isn't there already. New
   per-widget folders are picked up automatically once that root is registered.

### Story template

Every widget ships a **Default** close-up and a **WidgetDashboardWithWidget** story that mounts
the real dashboard. Add a **WithComparison** close-up only when the widget's data hook populates
`comparisonRows` — in practice, when it passes `mergeComparisonRows` to `useStatsReport` (see
`packages/data/src/hooks/use-stats-clicks.ts`). `rg -l mergeComparisonRows packages/data/src/hooks`
lists the comparison-capable hooks; a widget whose hook is not in that list omits the story.
`hasComparison` alone does not qualify — `useReport` returns it for any params carrying `compare_*`,
whether or not the module has comparison data to show. This template is self-contained — copy it as
the base rather than an existing widget's story file, which may have drifted. `meta.component` is
the widget's render component; widget-specific args (view selectors, metric toggles, …) are wired
as Storybook controls.

`WithComparison` tests the date range picker's comparison parameters and the visible comparison
UI. Widgets without mapped comparison rows omit the story and the `withComparison` control. Their
`WidgetDashboardWithWidget` story should still pass comparison report params by default, so the
widget is covered against crashing or inventing deltas when the host supplies comparison dates.

The shared imports, helpers, and `meta`:

```tsx
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { createStoryWidgetType } from '../../stories/create-story-widget-type';
import { withWidgetCanvas } from '../../stories/with-widget-canvas';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import MyWidgetRender from '../render';
import widgetDefinition from '../widget';
import widgetManifest from '../widget.json';
import type { Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const MY_WIDGET_RENDER_MODULE = 'storybook/<widget-name>';

function renderMyWidget() {
	return <MyWidgetRender attributes={ { reportParams: getDefaultQueryParams() } } />;
}

// Close-up canvas: `withWidgetCanvas` from `widgets/stories/with-widget-canvas` frames the
// story in a white, widget-sized card so each state reads as a real dashboard widget. Import
// the shared decorator — do not redefine a local bare-div canvas.

const meta = {
	title: 'Packages/Premium Analytics/Widgets/MyWidget',
	component: MyWidgetRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component: 'Brief description of what this widget shows and when to use it.',
			},
		},
	},
} satisfies Meta< typeof MyWidgetRender >;

export default meta;

// Always parameterize the alias: bare `StoryObj` defaults to `Args = { [name: string]: any }`,
// which silently accepts any `args` key and degrades `render`'s parameter to `{}`.
type Story = StoryObj< typeof meta >;
```

**1. `Default`** — the widget on its own, current period only:

```tsx
export const Default: Story = {
	render: renderMyWidget,
	decorators: [ withWidgetCanvas ],
};
```

**2. `WidgetDashboardWithWidget`** — mounts the real `WidgetDashboard` so the widget renders
exactly as it does in product, inheriting the size / edit-mode / host-environment controls. It
passes comparison params unconditionally, so the widget stays covered against crashing or
inventing deltas when the host supplies comparison dates:

```tsx
function MyWidgetDashboardStory( dashboardArgs: WidgetDashboardWithWidgetControls ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ createStoryWidgetType( widgetManifest, widgetDefinition ) }
			renderModule={ MY_WIDGET_RENDER_MODULE }
			renderComponent={ MyWidgetRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( true ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< WidgetDashboardWithWidgetControls > = {
	render: args => <MyWidgetDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
	},
};
```

**3. `WithComparison` — only when the widget's hook populates `comparisonRows`** (see the
criterion above). Add a `withComparison` control, thread it through the render helper, and add
the second close-up. It should show the period-over-period values the render path consumes:

```tsx
interface MyWidgetStoryControls {
	withComparison: boolean;
}

function renderMyWidget( { withComparison }: MyWidgetStoryControls ) {
	return (
		<MyWidgetRender attributes={ { reportParams: getDefaultQueryParams( withComparison ) } } />
	);
}

// The story args are the widget-specific controls, but `component` is the render component
// (host `WidgetRenderProps`). Intersect the two so `component` type-checks against the meta
// while the controls still drive `argTypes`/`args`.
const meta = {
	// …as above, plus:
	argTypes: {
		withComparison: { control: 'boolean' },
	},
} satisfies Meta< ComponentProps< typeof MyWidgetRender > & MyWidgetStoryControls >;

type Story = StoryObj< MyWidgetStoryControls >;

export const Default: Story = {
	render: renderMyWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};

export const WithComparison: Story = {
	render: renderMyWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};
```

Expose additional widget-specific props (e.g. a `view: 'source' | 'channel' | 'campaign'`
selector) as fields on a `MyWidgetStoryControls` interface plus matching `args` and `argTypes`,
switching the alias to `StoryObj< MyWidgetStoryControls >` and the `meta` to the intersection
form shown above. Where the dashboard story also needs those controls, have its props interface
extend both: `interface MyWidgetDashboardStoryProps extends WidgetDashboardWithWidgetControls,
MyWidgetStoryControls {}`. The shared dashboard helper already provides container width /
edit-mode / host-environment controls, so there's no need to add custom size decorators per
widget.

Helpers that compose a story's `reportParams` (e.g. to add a `post_id` scope) should keep
comparison as a parameter — `getMyWidgetAttributes( controls, withComparison = false )` — so the
dashboard story can call them with `true` instead of rebuilding the params and duplicating the
scoping rule.

If a story exposes `withComparison`, both the close-up story and the dashboard story must pass
`reportParams: getDefaultQueryParams( withComparison )` into the render component, and the render
component must pass those attributes into `<WidgetRoot>`. A visible Storybook control that is not
wired into the render/data flow gives reviewers a false comparison test.

Report mocks should exercise the shapes reviewers need to validate, not only the happy path:
populated primary data for every widget; comparison data when the widget maps comparison rows;
parent rows plus child rows for drill-down widgets; leaf rows with external links when a
leaderboard can render non-drill-down links; and known unsupported/error responses when the
module has a special failure mode. Prefer adding those shapes to the widget's existing stories
over creating one-off state stories unless the state needs direct review.

To review a widget's loading / error / empty state directly, force it with
`setReportMockState( '<endpoint>', 'loading' | 'error' | 'error-retryable' | 'empty' )` in the
story's `beforeEach`, clearing it in the returned cleanup. Keep such stories off the shared
autodocs page (`tags: [ '!autodocs' ]`, since the override is keyed by path and would otherwise
force the sibling stories into the same state) and give each one a date preset distinct from the
other stories so it hits the mock fresh instead of reading their cached success. See
`widgets/search-terms/stories/` for the reference.

`error` mocks a permission-gated 403 and `error-retryable` the proxy's `no_connection` 403. A
widget that maps its error through `describeError` renders a Retry action only for the latter, so
give it a story for each; both mocks are 403s, so neither waits out the query's retry backoff.

### Widget pitfalls

- Putting new widgets under `packages/widgets-toolkit/src/widgets/*` — that path is for the
  legacy widgets that haven't been migrated yet.
- Using the legacy `withWidgetRoot()` decorator for new stories — new widgets render via the
  real `WidgetDashboard` through the shared story helper instead.
- Declaring `name`, `title`, `help`, `description`, `category`, or `presentation` in
  `widget.ts` — `widget.json` is the source of truth for all declarative metadata; the
  `widget.ts` default export carries only `icon`, `attributes`, and `example`. Stories read
  those declarative fields from `widget.json` via `createStoryWidgetType()`.
- Re-declaring the attribute type in `render.tsx` — the shape is declared once in `widget.ts`
  and imported in `render.tsx`; render-only types may compose that imported shape with host
  fields like `Partial<ReportParamsFieldAttributes>`, but must not duplicate the shape.
- Typing a zero-attribute widget as `Record< string, never >` — its `[key: string]: never`
  index signature collapses composed host fields like `reportParams` to `never` and breaks the
  typecheck. Use `Record< never, never >` instead.
- Dropping `attributes` at the `<WidgetRoot>` boundary — this discards host-provided
  `reportParams` and makes date/comparison Storybook controls misleading.
- Writing `<button>` without an explicit `type` — the HTML default is `type="submit"`, which
  can fire accidental form submissions. Use `type="button"` for non-submit actions.
- Do not use inline `style={{ … }}` props in production widget render files — all widget
  styles belong in the widget's CSS Module. Story-only canvas wrappers may use inline
  sizing when the style is not part of the shipped widget UI.
- Reimplementing a utility that already exists in `widgets-toolkit` (e.g. `flagUrl`) — check
  `packages/widgets-toolkit/src/helpers/` before writing a new one.
- Passing a URL from report data straight to `href` — it must go through `safeHttpUrl` first.
  See "Remote URLs in links" below; nothing upstream validates the scheme.
- Importing `@automattic/charts` directly from a widget — chart components must come through
  `@jetpack-premium-analytics/widgets-toolkit` (a shared script module). A direct import
  bundles the entire charting stack into that widget's render bundle; add a re-export to the
  toolkit's "Charts passthrough" section instead. The toolkit in turn takes charts from
  `@jetpack-premium-analytics/externals`, so a passthrough export costs nothing.
- Porting a Stats widget and forgetting to add its endpoint to `routeStatsReport()` in
  `register-report-mocks.ts` — stories will render an error state instead of mock data because
  the middleware only intercepts Woo analytics paths by default.

### Stats widgets

Ports of Jetpack Stats modules into the dashboard follow a fixed pattern. Read this
before writing any Stats widget — many mistakes here are silent at build time.

**Data layer**

`packages/data/` already has a typed hook for every Stats module (`useStatsTopPosts`,
`useStatsSearchTerms`, `useStatsLocations`, `useStatsDevices`, …). Look there first —
do not call `fetchStatsProxy` or `apiFetch` directly from a widget.

Each hook returns `{ primary, comparison, comparisonRows, isLoading, isError, … }`. For the standard
leaderboard/list widgets, reach data through:

```ts
const report = primary.data as StatsNormalizedReport< StatsXxxItem > | undefined;
const items = report?.data?.[ 0 ]?.items ?? [];
```

Date-range conversion (`from`/`to` → `period`/`end_date`/`days`) is handled inside
the query factory — do not do it in the widget or the view hook.

**`max` semantics**

`max = 0` means "all rows" — but only where the widget caps rows _after_ fetching,
via `limitStatsRows()`. Use `slice( 0, max > 0 ? max : undefined )`, never
`slice( 0, max )` (the latter returns an empty array when `max` is 0).

Where `max` is instead passed straight to the endpoint as a request param, it is a
page size and `0` carries no "all rows" meaning — clamp it to the widget's own
default. `widgets/subscribers-list/render.tsx` is the current example: its
`stats/followers` request is paginated, so it falls back to 6.

**Loading / error / empty state**

Render these states through `<WidgetState>` from `@jetpack-premium-analytics/widgets-toolkit`
rather than hand-rolling `if ( isError )` / empty branches or a `WidgetLoadingOverlay`. Map the
data/view hook's result to its four signals. For Stats API errors, pass the raw `error` to the
shared `describeError()` mapper so 403 access failures have neutral copy and no retry action,
while other failures — including the proxy's `no_connection` 403, which can heal after
reconnecting — offer Retry. Pass the retryable copy as a full sentence (not a fragment
interpolated into a shared frame) so translators see the whole sentence:

```tsx
<WidgetState
	isLoading={ isLoading }            // first load, no data yet
	isError={ isError }
	isEmpty={ data.length === 0 }
	// isFetching is optional: a background refetch shows a non-blocking busy overlay
	// over the existing rows instead of hiding them.
	error={ describeError( error, {
		retryDescription: __( "We couldn't load search terms. Please try again in a moment.", 'jetpack-premium-analytics-pkg' ),
		onRetry: refetch,
	} ) }
	empty={ { icon: search, description: __( 'No search terms in this period.', 'jetpack-premium-analytics-pkg' ) } }
>
	<LeaderboardChart … />
</WidgetState>
```

`<WidgetState>` derives one state (error → loading → empty → ready, plus a busy overlay while
`isFetching` and data are shown) and swaps only the content area. Notes:

- Expose `refetch` from the data/view hook so the error state's Retry can re-run the query.
- When a view hook masks `isError` (e.g. `rows.length === 0 && isError` to keep placeholder
  rows), gate `error` with the same predicate (`error: showError ? error : null`) so the two
  fields can't disagree.
- Give `empty.icon` a neutral glyph distinct from the error icon — the widget's own glyph from
  `@jetpack-premium-analytics/icons` (e.g. `search`, `customer`); omit it for no icon. Don't use
  a caution glyph: empty is not an error.
- Keep interactive body chrome (dropdown, view selector, drill-down back link) as a **sibling**
  of `<WidgetState>`, not inside it, so it stays available in every state.
- `<WidgetState>` covers only a widget's own data state; the host still owns the crash error
  boundary and the module-load `<Suspense>`.

> Many Stats widgets predate this and still hand-roll loading/empty via `<WidgetLoadingOverlay>`,
> `isLoading && data.length === 0`, and `LeaderboardChart`'s `emptyStateText`. They are being
> migrated to `<WidgetState>` — follow the contract above, not those widgets.
> `widgets/search-terms/render.tsx` is the reference. (A `ReportWidget` wrapper that removes the
> remaining per-widget state boilerplate is a planned follow-up.)

**Comparison data**

Stats hooks built on `useStatsReport()` return `{ primary, comparison, comparisonRows,
hasComparison, ... }`. When `reportParams` includes `comp=1`, `compare_from`, and `compare_to`,
the data layer fetches the comparison period automatically.

For leaderboard/list Stats widgets, row matching belongs in the data layer. Add or update the
module-specific `mergeStats*ComparisonRows()` helper in `packages/data/src/processing/stats/`,
then pass it to `useStatsReport()` from the corresponding `useStats*` hook. If the hook captures
options such as `maxRows`, wrap that mapper with `useCallback()` so the `useStatsReport()`
comparison memo stays stable across renders.

The merge helper should compare primary and comparison rows with the module's stable row key
(post ID/URL, country code, search term, device key, etc.), preserve missing comparison values
as `undefined`, and treat `0` as a valid previous value. Return `hasComparison: true` only when
at least one primary row has a matching comparison row.

Widgets should consume `comparisonRows?.rows` and the hook-level `hasComparison`; do not call
`mergeStats*ComparisonRows()` or duplicate the row-overlap guard from render/view code.
Widget-level mapping may still add presentation-only fields such as labels, icons, links,
shares, or chart colors. Leave missing `previousValue`/`previousShare`/`delta` values as
`undefined` so charts show the missing-data placeholder, instead of coercing them to `0` and
implying a real zero previous period.

For comparison leaderboards, calculate one denominator from the largest value represented in
either period with `getCombinedPeriodMax()`. Use that denominator for both `currentShare` and
`previousShare`; separate per-period maxima make equal-width bars represent different values and
can contradict the displayed delta. Only include visible primary rows and their matched comparison
values in the denominator. Missing comparison values remain `undefined` and are ignored.

**Remote URLs in links**

Pass every URL from report data through `safeHttpUrl` from `@jetpack-premium-analytics/ui`
(re-exported by `widgets-toolkit` for widgets) before using it as an `href`. It allows http(s)
only; render a plain-text fallback when it returns `null`:

```tsx
const href = safeHttpUrl( item.link );
// …
return href ? <Link href={ href }>{ label }</Link> : <span>{ label }</span>;
```

Pass `{ allowRelative: true }` only where the endpoint is known to return a root-relative path
— currently just the file-download sinks, whose `relative_url` fallback has no scheme.

Guard in the widget or route layer, either where the row is mapped or at the link itself, but
never in `packages/data/`: some modules key comparison rows on the raw URL. Locally constructed
URLs do not need the guard.

**Drill-down leaderboards**

Rows with children may be interactive and drill into a second-level leaderboard. Rows without
children must not look like drill-down rows. If a row has an external `href` and no children,
render it as a normal external link even when sibling rows drill down.

When a leaderboard drills down, use `WidgetBackLink` from `widgets-toolkit` in the widget body
to navigate back to the parent list. Keep the static widget title/icon in the framed widget host
header, not in a body breadcrumb. The child list should show child labels only; do not repeat the
selected parent label in every row when the back link already identifies the parent view. Body
controls such as dropdowns should stay in normal flex flow with the back link; when they wrap on
narrow widget widths, order the dropdown above the back link so the back link can sit directly
above the leaderboard or chart content.

**Storybook mocks for Stats endpoints**

`registerReportMocks()` covers Woo analytics paths (`/proxy/v2/analytics/reports/*`) out of
the box. Stats proxy paths (`/proxy/v1.1/stats/*`) are NOT covered by default. For each new
Stats endpoint, add fixture data under `packages/widgets-toolkit/src/stories/mocks/data/` and
wire a handler in `routeStatsReport()` inside `register-report-mocks.ts`. See
`data/search-terms.ts` for a reference implementation.

**Visual conventions**

- Widget title: use the framed widget host header via the widget definition/title/icon. Do not
  add a second in-widget `<Text variant="heading-md" render={ <h3 /> }>` title for framed Stats
  widgets.
- View count format: `dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }`
- Leaderboard row height: custom labels should produce a stable 36px row height. For the common
  `<Text>` label case, `padding: var(--wpds-dimension-padding-sm)` is enough when the text
  line-height plus vertical padding yields 36px. Use `min-height: 36px` when the label content
  or typography does not naturally produce that height.
- Loading / error / empty state: render through `<WidgetState>` (see "Loading / error / empty
  state" above), not `LeaderboardChart`'s `emptyStateText` or a hand-rolled `data.length === 0`
  branch. Empty uses a neutral glyph distinct from the error icon.
