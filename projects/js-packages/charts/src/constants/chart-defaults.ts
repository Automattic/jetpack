// Base legend defaults shared across all charts
export const LEGEND_DEFAULTS = {
	showLegend: true,
	legendOrientation: 'horizontal' as const,
	legendAlignmentHorizontal: 'center' as const,
	legendAlignmentVertical: 'bottom' as const,
} as const;

// Individual chart defaults - tree-shakeable
export const BAR_CHART_DEFAULTS = {
	...LEGEND_DEFAULTS,
	legendShape: 'rect' as const,
	withPatterns: false,
	showZeroValues: false,
	orientation: 'vertical' as const,
} as const;

export const LINE_CHART_DEFAULTS = {
	...LEGEND_DEFAULTS,
	legendShape: 'line' as const,
	withLegendGlyph: false,
	withTooltips: true,
	withGradientFill: false,
	smoothing: true,
	withStartGlyphs: false,
} as const;

export const PIE_CHART_DEFAULTS = {
	...LEGEND_DEFAULTS,
	legendShape: 'circle' as const,
	thickness: 1,
	padding: 20,
	gapScale: 0,
	cornerScale: 0,
} as const;

export const PIE_SEMI_CIRCLE_CHART_DEFAULTS = {
	...LEGEND_DEFAULTS,
	legendShape: 'circle' as const,
	thickness: 0.4,
	clockwise: true,
} as const;

// For backward compatibility and when you need dynamic chart type selection
export const CHART_DEFAULTS = {
	bar: BAR_CHART_DEFAULTS,
	line: LINE_CHART_DEFAULTS,
	pie: PIE_CHART_DEFAULTS,
	pieSemiCircle: PIE_SEMI_CIRCLE_CHART_DEFAULTS,
} as const;

export type ChartType = keyof typeof CHART_DEFAULTS;

// Get all defaults for a specific chart type - use when chart type is dynamic
export const getChartDefaults = < T extends ChartType >( chartType: T ) =>
	CHART_DEFAULTS[ chartType ];

// Get only legend-related defaults (backward compatible)
export const getChartLegendDefaults = ( chartType: ChartType ) => ( {
	...LEGEND_DEFAULTS,
	legendShape: CHART_DEFAULTS[ chartType ].legendShape,
} );
