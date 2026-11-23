# Widgets

@../../../../.agents/rules/widgets.md

## Stories

Premium Analytics hosts these widgets, and its `AGENTS.md` carries a story template whose helpers are not the ones here. Copy `items-sold`, `top-performing-products` or `sessions-by-device`, whichever shape is closest, rather than that template or a Premium Analytics story: helpers come from `widgets/stories/shared.ts`, mocks from `registerWooReportMocks()` and params from `storyReportParams()`, in place of its `widget-dashboard-with-widget` import, `registerReportMocks()` and `getDefaultQueryParams()`.

Storybook can mount a widget from this package at all only because its Vite config maps `@automattic/jetpack-premium-analytics-sdk` to the dashboard's facade source. The published runtime entry throws on purpose: the real implementation is a WordPress script module the dashboard registers.

```bash
pnpm --dir projects/js-packages/storybook run storybook:dev
pnpm --dir projects/js-packages/storybook run storybook:test
```

The per-story form is `storybook:test --project storybook <story-file-basename>`. Vitest's `-t` matches story export names rather than titles, so `-t ItemsSold` silently matches nothing and reports a pass over zero tests.
