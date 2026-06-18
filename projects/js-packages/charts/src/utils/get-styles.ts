import type { BarStyles, ChartTheme, LegendShape, SeriesData } from '../types';
import type { LineStyles } from '@visx/xychart';

/**
 * Utility function to get consolidated line styles for a series
 * This consolidates the logic used by both LineChart and Legend components
 *
 * @param {SeriesData} seriesData    - The series data containing styling options
 * @param {number}     index         - The index of the series in the data array
 * @param {ChartTheme} providerTheme - The chart theme configuration
 * @return {LineStyles} The consolidated line styles for the series
 */
export function getSeriesLineStyles(
	seriesData: SeriesData,
	index: number,
	providerTheme: ChartTheme
): LineStyles {
	// Get theme-based line styles for line type
	const themeSemanticLineStyle = providerTheme?.lineChart?.lineStyles?.[ seriesData.options?.type ];

	// Get theme-based line styles for index of series data
	const themeSeriesLineStyle =
		providerTheme?.seriesLineStyles?.[ index % providerTheme.seriesLineStyles.length ];

	// Priority order: custom series style > theme line type style > default theme series style
	return (
		seriesData.options?.seriesLineStyle ?? themeSemanticLineStyle ?? themeSeriesLineStyle ?? {}
	);
}

/**
 * Utility to get consolidated bar styles for a series by semantic type.
 * Mirrors getSeriesLineStyles: a series with `options.type` (e.g. 'comparison')
 * resolves to `theme.barChart.barStyles[ type ]`.
 *
 * @param {SeriesData} seriesData    - The series data containing styling options
 * @param {number}     index         - The index of the series in the data array
 * @param {ChartTheme} providerTheme - The chart theme configuration
 * @return {BarStyles} The consolidated bar styles for the series
 */
export function getSeriesBarStyles(
	seriesData: SeriesData,
	index: number,
	providerTheme: ChartTheme
): BarStyles {
	const type = seriesData.options?.type;
	return ( type && providerTheme?.barChart?.barStyles?.[ type ] ) ?? {};
}

/**
 * Utility function to get stroke color for a series
 *
 * @param {SeriesData} seriesData  - The series data containing styling options
 * @param {number}     index       - The index of the series in the data array
 * @param {string[]}   themeColors - Array of theme colors
 * @return {string} The stroke color for the series
 */
export function getSeriesStroke(
	seriesData: SeriesData,
	index: number,
	themeColors: string[]
): string {
	return seriesData.options?.stroke ?? themeColors[ index % themeColors.length ];
}

/**
 * Utility function to get shape styles for a legend item
 *
 * @param {SeriesData}  series      - The series data containing styling options
 * @param {number}      index       - The index of the series in the data array
 * @param {ChartTheme}  theme       - The chart theme configuration
 * @param {LegendShape} legendShape - The shape to use for the item (optional)
 * @return {Record< string, unknown >} The shape styles for the item
 */
export function getItemShapeStyles(
	series: SeriesData,
	index: number,
	theme: ChartTheme,
	legendShape?: LegendShape< SeriesData[], number >
): Record< string, unknown > {
	const seriesShapeStyles = series.options?.legendShapeStyle ?? {};
	const lineStyles = legendShape === 'line' ? getSeriesLineStyles( series, index, theme ) : {};
	// For non-line legends (e.g. bar 'rect'), reflect the comparison bar's opacity on the
	// swatch so the legend marker matches the translucent comparison bar. Line-type legends
	// convey comparison via the dashed stroke (lineStyles) instead.
	const barOpacity =
		legendShape !== 'line' ? getSeriesBarStyles( series, index, theme ).opacity : undefined;
	const barShapeStyles = barOpacity !== undefined ? { opacity: barOpacity } : {};
	const themeShapeStyles = theme.legend?.shapeStyles?.[ index ];

	// Series-level styles (custom shape style + line styles) take precedence; otherwise fall
	// back to the per-index theme shape styles.
	const explicitStyles = {
		...seriesShapeStyles,
		...lineStyles,
	};
	const hasExplicitStyles = Object.values( explicitStyles ).some(
		value => value !== undefined && value !== null && value !== ''
	);
	const baseShapeStyles = hasExplicitStyles ? explicitStyles : themeShapeStyles ?? {};

	// Layer the comparison bar opacity on top so the swatch matches the translucent bar
	// without discarding the base (custom or theme) shape styles.
	return { ...baseShapeStyles, ...barShapeStyles };
}
