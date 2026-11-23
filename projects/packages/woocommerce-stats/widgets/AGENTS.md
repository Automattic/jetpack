# Widgets

@../../../../.agents/rules/widgets.md

The contract above is shared with Premium Analytics, whose dashboard hosts these widgets. Three things differ here.

- Everything the dashboard serves comes from `@automattic/jetpack-premium-analytics-sdk`: charts, `@wordpress/ui`, `@wordpress/dataviews`, Base UI, and the widget primitives. The `@jetpack-premium-analytics/*` aliases resolve only inside that package. ESLint enforces this over `src/**` and `widgets/**`, and its message says where to add a missing export.
- `name` in `widget.json` uses the `woocommerce-analytics/` prefix, and `textdomain` is `jetpack-woocommerce-stats-pkg`.
- Report data comes from this package's own hooks in `src/reports/`, which read the WooCommerce report endpoints through the dashboard's proxy. There is no `@jetpack-premium-analytics/data` hook for them.

## Stories

Three widgets have a story so far, one of each shape the package uses: `items-sold` (chart), `top-performing-products` (leaderboard) and `sessions-by-device` (donut). Copy the nearest of those rather than a Premium Analytics story, whose helpers and import paths differ.

- Title: `Packages/WooCommerce Stats/Widgets/<WidgetName>`.
- Import every helper from `widgets/stories/shared.ts`. It re-exports the Premium Analytics story helpers next to this package's own, so a story file carries no cross-package relative import.
- Call `registerWooReportMocks()` at module level, and force a state with `beforeEach: forceWooReportState( '<report path>', 'loading' | 'empty' | 'error' | 'error-retryable' )`. `error` is a permission-gated 403 and renders no Retry action; `error-retryable` is the proxy's `no_connection` 403 and does. A widget that maps its error through `describeError` needs a story for each.
- Build report params with `storyReportParams( { withComparison } )`, not `getDefaultQueryParams`.
- A new endpoint needs fixture data under `widgets/stories/mocks/data/` and a handler in `register-woo-report-mocks.ts`. The fixtures have their own Jest suite in `mocks/__tests__/`; assert a new shape there rather than trusting a story to show a bad fixture.

Storybook reaches these widgets at all because its Vite config maps the SDK to the dashboard's facade source. The published runtime entry throws on purpose, so without that resolver no widget in this package can be imported outside the dashboard.

```bash
pnpm --dir projects/js-packages/storybook run storybook:dev
pnpm --dir projects/js-packages/storybook run storybook:test
```

The per-story form of the test run is `storybook:test --project storybook <story-file-basename>`. Vitest's `-t` matches story export names rather than titles, so `-t ItemsSold` silently matches nothing and reports a pass over zero tests.
