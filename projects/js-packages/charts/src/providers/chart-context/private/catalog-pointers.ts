import { SERIES_PALETTE_POINTERS } from './series-palette';

/*
 * The `var()` chain for each color JS has to hand to something. Nothing here is resolved in JS —
 * the chain lands on the element; the terminal literal covers SSR and jsdom. See TOKENS.md.
 */
export const CATALOG_POINTERS = {
	background: 'var(--a8c-charts-color-background, #fff)',
	labelAxis: 'var(--a8c-charts-color-label-axis, #1e1e1e)',
	grid: 'var(--a8c-charts-color-grid, #dbdbdb)',
	// The y pair resolves to `none`: that axis carries labels only until a consumer declares them.
	axisX: 'var(--a8c-charts-color-axis-x, #dbdbdb)',
	tickX: 'var(--a8c-charts-color-tick-x, #dbdbdb)',
	axisY: 'var(--a8c-charts-color-axis-y, none)',
	tickY: 'var(--a8c-charts-color-tick-y, none)',
	annotation: 'var(--a8c-charts-color-annotation, #1e1e1e)',
	surface: 'var(--a8c-charts-color-surface, #fff)',
	surfaceSecondary: 'var(--a8c-charts-color-surface-secondary, #f4f4f4)',
	// Only for `renderMainMetric`, which hands a consumer's own markup something to paint with.
	trendUp: 'var(--a8c-charts-color-trend-up, #008030)',
	trendDown: 'var(--a8c-charts-color-trend-down, #cc1818)',
	series: SERIES_PALETTE_POINTERS,
} as const;

/**
 * The annotation parts visx paints, in the shape `@visx/annotation` takes. `radius`
 * rides along as the base the theme and the per-datum styles merge onto.
 */
export const ANNOTATION_POINTERS = {
	label: {
		anchorLineStroke: CATALOG_POINTERS.annotation,
		backgroundFill: CATALOG_POINTERS.surface,
	},
	connector: {
		stroke: CATALOG_POINTERS.annotation,
	},
	circleSubject: {
		stroke: 'transparent',
		fill: CATALOG_POINTERS.annotation,
		radius: 5,
	},
} as const;
