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
jetpack build packages/premium-analytics
```

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

| Prefix | Capability | Writes (POST) |
| --- | --- | --- |
| `analytics` (Woo store reports) | `manage_options` | — |
| `stats` | `view_stats` | `stats/referrers/spam/` |
| `wordads` | `activate_wordads` | — |
| `subscribers` / `site-has-never-published-post` / `jetpack-stats` | `view_stats` | — |
| `jetpack-stats-dashboard` | `view_stats` | whole prefix (busts read cache) |
| `commercial-classification` | `view_stats` | exact path |
| `upgrades` (not under `/sites/`) | `view_stats` | — |

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

### REQUIRED: Storybook story for every widget

Every widget MUST have a Storybook story alongside it. New widgets without a story should
not be merged.

1. **Location**: `widgets/<widget-name>/stories/<widget-name>-widget.stories.tsx`.
2. **Dashboard story**: Include a `WidgetDashboardWithWidget` story that renders through the
   shared `WidgetDashboardWithWidget` helper from `widgets/stories/widget-dashboard-with-widget.tsx`.
   It mounts the real `WidgetDashboard` with this single widget and exposes the standard
   dashboard controls (size, edit mode, host environment, etc.), so it shows how the widget
   actually renders in product. The `Default` / `WithComparison` close-up stories use the
   simpler canvas decorator from the template below — but never ship *only* a bare-div story.
3. **Mocks**: Call `registerReportMocks()` at module-level for any widget that fetches
   report data. Without this the widget renders an error state in Storybook.
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
import type { ComponentType } from 'react';

registerReportMocks();

const MY_WIDGET_RENDER_MODULE = 'storybook/<widget-name>';

// Widget-specific controls — add view selectors, metric toggles, etc. here.
interface MyWidgetStoryControls {
	withComparison: boolean;
}

function renderMyWidget( { withComparison }: MyWidgetStoryControls ) {
	return (
		<MyWidgetRender
			attributes={ { reportParams: getDefaultQueryParams( withComparison ) } }
		/>
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
} satisfies Meta< MyWidgetStoryControls >;

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

**2. `WithComparison`** — same close-up with the period-over-period delta + sparkline:

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

function MyWidgetDashboardStory( { withComparison, ...dashboardArgs }: MyWidgetDashboardStoryProps ) {
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

### Widget pitfalls

- Putting new widgets under `packages/widgets-toolkit/src/widgets/*` — that path is for the
  legacy widgets that haven't been migrated yet.
- Using the legacy `withWidgetRoot()` decorator for new stories — new widgets render via the
  real `WidgetDashboard` through the shared story helper instead.
