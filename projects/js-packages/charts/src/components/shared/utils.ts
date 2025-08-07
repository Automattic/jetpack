import { getStringWidth } from '@visx/text';
import type { ChartTheme, SeriesData } from '../../types';
import type { TickFormatter } from '@visx/axis';
import type { AnyD3Scale, ScaleInput } from '@visx/scale';
import type { LineStyles } from '@visx/xychart';

/**
 * Returns the width of the longest tick.
 *
 * @param          ticks      - Ticks to get the width of.
 * @param          formatTick - Function to format the tick.
 * @param {object} labelStyle - Style object for the label.
 * @return {number} - Width of the longest tick.
 */
export const getLongestTickWidth = < T extends AnyD3Scale >(
	ticks: ScaleInput< T >[],
	formatTick: TickFormatter< ScaleInput< T > >,
	labelStyle?: object
) => {
	const formattedTicks = ticks.map( tick => formatTick( tick, 0, [] ) );
	const longestTick = formattedTicks.reduce(
		( longest, current ) => ( longest.length >= current.length ? longest : current ),
		formattedTicks[ 0 ]
	);

	return getStringWidth( longestTick, labelStyle );
};

export const isSafari = () => {
	if ( typeof navigator !== 'undefined' && navigator.userAgent ) {
		return /^((?!chrome|android).)*safari/i.test( navigator.userAgent );
	}
	return false;
};

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
 * Combined utility that returns both stroke and line styles
 *
 * @param {SeriesData} seriesData    - The series data containing styling options
 * @param {number}     index         - The index of the series in the data array
 * @param {ChartTheme} providerTheme - The chart theme configuration
 * @return {object} Object containing stroke color and line styles
 */
export function getSeriesStyles(
	seriesData: SeriesData,
	index: number,
	providerTheme: ChartTheme
): { stroke: string; lineStyles: LineStyles } {
	const stroke = getSeriesStroke( seriesData, index, providerTheme.colors );
	const lineStyles = getSeriesLineStyles( seriesData, index, providerTheme );

	return { stroke, lineStyles };
}
