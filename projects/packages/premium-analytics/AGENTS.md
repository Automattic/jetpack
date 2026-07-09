# AGENTS.md

Guidance for AI coding agents working in this package.

## Overview

Jetpack Premium Analytics is the unified analytics dashboard for Jetpack-connected sites — a full-page React SPA in wp-admin. It consolidates two older surfaces:

- **Jetpack Stats** — the Odyssey dashboard; backend from the `stats-admin` package, frontend built from `apps/odyssey-stats` in Calypso. Covers traffic, posts, subscribers, email stats, WordAds, and more.
- **Woo Analytics** — store reports (orders, products, customers, coupons, order attribution), from the private repo at https://github.com/woocommerce/woocommerce-analytics.

- Composer package: `automattic/jetpack-premium-analytics`
- PHP namespace: `Automattic\Jetpack\PremiumAnalytics`
- Text domain / REST namespace: `jetpack-premium-analytics` / `jetpack-premium-analytics/v1`

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

| Prefix                                                            | Capability         | Writes (POST)                   |
| ----------------------------------------------------------------- | ------------------ | ------------------------------- |
| `analytics` (Woo store reports)                                   | `manage_options`   | —                               |
| `stats`                                                           | `view_stats`       | `stats/referrers/spam/`         |
| `wordads`                                                         | `activate_wordads` | —                               |
| `subscribers` / `site-has-never-published-post` / `jetpack-stats` | `view_stats`       | —                               |
| `jetpack-stats-dashboard`                                         | `view_stats`       | whole prefix (busts read cache) |
| `commercial-classification`                                       | `view_stats`       | exact path                      |
| `upgrades` (not under `/sites/`)                                  | `view_stats`       | —                               |

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

## Pitfalls

- Never put the blog ID in a proxy path — it's injected server-side.
- A proxy 404 usually means the prefix isn't in `PREFIX_CONFIG`, not a missing WPCOM endpoint.
- Reads are cached 5 min; add `force_refresh` if a screen looks stale.
- `v2` vs `v1.x` changes the WPCOM base — a wrong version silently hits a different endpoint.
- Sync code under `src/Sync/` is interim (WOOA7S-1550); don't build on it.
- Don't edit dashboard React in Calypso — it lives here now.
- Internal package names use `@jetpack-premium-analytics/*` aliases throughout the package —
  never `@automattic/jetpack-premium-analytics-*`.
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
├── widget.json                             # declarative metadata (name, title, description, category)
├── widget.ts                               # runtime widget type definition (icon + translatable strings)
├── render.tsx                              # the React component, wrapped in <WidgetRoot> from widgets-toolkit
└── stories/<widget-name>-widget.stories.tsx
```

Notes:

- `name` in both `widget.json` and `widget.ts` MUST use the `jpa/` prefix
  (e.g. `jpa/<widget-name>`).
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
   actually renders in product. The `Default` / `WithComparison` close-up stories use the
   simpler canvas decorator from the template below — but never ship _only_ a bare-div story.
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

Every widget ships three stories: a **Default** close-up, a **WithComparison** close-up, and a
**WidgetDashboardWithWidget** story that mounts the real dashboard. This template is
self-contained — copy it as the base rather than an existing widget's story file, which may
have drifted. `meta.component` is the widget's render component; widget-specific args
(comparison toggles, view selectors, …) are wired as Storybook controls.

`WithComparison` tests the date range picker's comparison parameters, not only visible delta
UI. Some Stats endpoints accept `compare_*` params but return no comparison rows. Those widgets
must still render gracefully when `reportParams` contains comparison dates; in that case keep
the chart's comparison UI disabled or empty rather than inventing `previousValue`/`delta`
values, and add a short story docs note explaining that the module has no comparison data to
display.

The shared imports, helpers, and `meta`:

```tsx
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import {
	DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
	WidgetDashboardWithWidget as WidgetDashboardWithWidgetStory,
	widgetDashboardWithWidgetArgTypes,
	type WidgetDashboardWithWidgetControls,
} from '../../stories/widget-dashboard-with-widget';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import MyWidgetRender from '../render';
import widgetDefinition from '../widget';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps, ComponentType } from 'react';

registerReportMocks();

const MY_WIDGET_RENDER_MODULE = 'storybook/<widget-name>';

// Widget-specific controls — add view selectors, metric toggles, etc. here.
interface MyWidgetStoryControls {
	withComparison: boolean;
}

function renderMyWidget( { withComparison }: MyWidgetStoryControls ) {
	return (
		<MyWidgetRender attributes={ { reportParams: getDefaultQueryParams( withComparison ) } } />
	);
}

// Close-up canvas so the chart fills the frame outside the dashboard grid.
const withWidgetCanvas: Decorator = Story => (
	<div style={ { width: '100%', height: '300px' } }>
		<Story />
	</div>
);

const meta = {
	title: 'Packages/Premium Analytics/Widgets/MyWidget',
	component: MyWidgetRender,
	tags: [ 'autodocs' ],
	argTypes: {
		withComparison: { control: 'boolean' },
	},
	parameters: {
		docs: {
			description: {
				component: 'Brief description of what this widget shows and when to use it.',
			},
		},
	},
	// The story args are the widget-specific controls, but `component` is the render
	// component (host `WidgetRenderProps`). Intersect the two so `component` type-checks
	// against the meta while the controls still drive `argTypes`/`args`.
} satisfies Meta< ComponentProps< typeof MyWidgetRender > & MyWidgetStoryControls >;

export default meta;

type Story = StoryObj< MyWidgetStoryControls >;
```

**1. `Default`** — the widget on its own, current period only:

```tsx
export const Default: Story = {
	render: renderMyWidget,
	args: { withComparison: false },
	decorators: [ withWidgetCanvas ],
};
```

**2. `WithComparison`** — same close-up with comparison `reportParams` from the date range
picker. Widgets with comparison data should show period-over-period values; widgets without
comparison data should still render normally without fake deltas:

```tsx
export const WithComparison: Story = {
	render: renderMyWidget,
	args: { withComparison: true },
	decorators: [ withWidgetCanvas ],
};
```

**3. `WidgetDashboardWithWidget`** — mounts the real `WidgetDashboard` so the widget renders
exactly as it does in product, inheriting the size / edit-mode / host-environment controls:

```tsx
interface MyWidgetDashboardStoryProps
	extends WidgetDashboardWithWidgetControls,
		MyWidgetStoryControls {}

function MyWidgetDashboardStory( {
	withComparison,
	...dashboardArgs
}: MyWidgetDashboardStoryProps ) {
	return (
		<WidgetDashboardWithWidgetStory
			{ ...dashboardArgs }
			widgetType={ widgetDefinition }
			renderModule={ MY_WIDGET_RENDER_MODULE }
			renderComponent={ MyWidgetRender as ComponentType< WidgetRenderProps< unknown > > }
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
	);
}

export const WidgetDashboardWithWidget: StoryObj< MyWidgetDashboardStoryProps > = {
	render: args => <MyWidgetDashboardStory { ...args } />,
	args: {
		...DEFAULT_WIDGET_DASHBOARD_STORY_ARGS,
		withComparison: true,
	},
	argTypes: {
		...widgetDashboardWithWidgetArgTypes,
		withComparison: { control: 'boolean' },
	},
};
```

Expose additional widget-specific props (e.g. a `view: 'source' | 'channel' | 'campaign'`
selector) as extra fields on the controls interface plus matching `args` and `argTypes`. The
shared dashboard helper already provides container width / edit-mode / host-environment
controls, so there's no need to add custom size decorators per widget.

If a story exposes `withComparison`, both the close-up story and the dashboard story must pass
`reportParams: getDefaultQueryParams( withComparison )` into the render component, and the render
component must pass those attributes into `<WidgetRoot>`. A visible Storybook control that is not
wired into the render/data flow gives reviewers a false comparison test.

Report mocks should exercise the shapes reviewers need to validate, not only the happy path:
populated primary data for every widget; comparison data when the widget maps comparison rows;
parent rows plus child rows for drill-down widgets; leaf rows with external links when a
leaderboard can render non-drill-down links; and known unsupported/error responses when the
module has a special failure mode. Prefer adding those shapes to the existing Default,
WithComparison, or WidgetDashboardWithWidget stories over creating one-off state stories unless
the state needs direct review.

To review a widget's loading / error / empty state directly, force it with
`setReportMockState( '<endpoint>', 'loading' | 'error' | 'empty' )` in the story's `beforeEach`,
clearing it in the returned cleanup. Keep such stories off the shared autodocs page
(`tags: [ '!autodocs' ]`, since the override is keyed by path and would otherwise force the
sibling stories into the same state) and give each one a date preset distinct from the other
stories so it hits the mock fresh instead of reading their cached success. See
`widgets/search-terms/stories/` for the reference.

### Widget pitfalls

- Putting new widgets under `packages/widgets-toolkit/src/widgets/*` — that path is for the
  legacy widgets that haven't been migrated yet.
- Using the legacy `withWidgetRoot()` decorator for new stories — new widgets render via the
  real `WidgetDashboard` through the shared story helper instead.
- Declaring `presentation` in `widget.ts` — `widget.json` is the source of truth for that
  field; omit it from `widget.ts` entirely.
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
- Importing `@automattic/charts` directly from a widget — chart components must come through
  `@jetpack-premium-analytics/widgets-toolkit` (a shared script module). A direct import
  bundles the entire charting stack into that widget's render bundle; add a re-export to the
  toolkit's "Charts passthrough" section instead.
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

Each hook returns `{ primary, comparison, isLoading, isError, … }`. For the standard
leaderboard/list widgets, reach data through:

```ts
const report = primary.data as StatsNormalizedReport< StatsXxxItem > | undefined;
const items = report?.data?.[ 0 ]?.items ?? [];
```

Date-range conversion (`from`/`to` → `period`/`end_date`/`days`) is handled inside
the query factory — do not do it in the widget or the view hook.

**`max` semantics**

`max = 0` means "all rows". Use `slice( 0, max > 0 ? max : undefined )`, never
`slice( 0, max )` (the latter returns an empty array when `max` is 0).

**Loading / error / empty state**

Render these states through `<WidgetState>` from `@jetpack-premium-analytics/widgets-toolkit`
rather than hand-rolling `if ( isError )` / empty branches or a `WidgetLoadingOverlay`. Map the
data/view hook's result to its four signals and pass generic descriptors:

```tsx
<WidgetState
	isLoading={ isLoading }            // first load, no data yet
	isError={ isError }
	isEmpty={ data.length === 0 }
	// isFetching is optional: a background refetch shows a non-blocking busy overlay
	// over the existing rows instead of hiding them.
	error={ {
		description: __( "We couldn't load this data. Please try again in a moment.", 'jetpack-premium-analytics' ),
		actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
	} }
	empty={ { icon: search, description: __( 'No search terms in this period.', 'jetpack-premium-analytics' ) } }
>
	<LeaderboardChart … />
</WidgetState>
```

`<WidgetState>` derives one state (error → loading → empty → ready, plus a busy overlay while
`isFetching` and data are shown) and swaps only the content area. Notes:

- Expose `refetch` from the data/view hook so the error state's Retry can re-run the query.
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
> `widgets/search-terms/render.tsx` is the reference. (A `describeError` mapper and a
> `ReportWidget` wrapper that remove the per-widget error/retry boilerplate are planned follow-ups.)

**Comparison data**

Stats hooks built on `useStatsReport()` return `{ primary, comparison, hasComparison, ... }`.
When `reportParams` includes `comp=1`, `compare_from`, and `compare_to`, the data layer fetches
the comparison period automatically.

Widgets still need to map comparison rows into chart data explicitly. For leaderboard/list
widgets, build a lookup from `comparison.data?.[ 0 ]?.items` using the same stable key used for
the primary row (post ID/URL, country code, search term, device key, etc.), then set
`previousValue`, `previousShare`, and `delta` from the matched comparison row. Do not assume
primary and comparison arrays have the same order or the same rows.

If comparison params are present but the endpoint returns no comparable rows, the widget should
fall back to a non-comparison view. Using `previousValue: 0` and `delta: 0` as placeholders is
only acceptable when the chart comparison UI is disabled (`withComparison={ false }` or omitted)
or when the story explicitly documents that the module has no comparison data to display. Do not
render a visible delta/sparkline from placeholder values.

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
