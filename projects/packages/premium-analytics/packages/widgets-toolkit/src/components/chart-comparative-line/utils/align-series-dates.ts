/**
 * Internal dependencies
 */
import type { ComparativeLineChartSeries } from '../types';

/**
 * Aligns comparison series dates to primary series dates by index.
 *
 * Each comparison point gets assigned the date of the corresponding primary point
 * (same index), ensuring both series align perfectly on the X-axis regardless of
 * their original date intervals. Original dates are preserved in realDate for tooltips.
 *
 * This approach handles:
 * - Different period lengths (e.g., weeks starting on different days)
 * - Partial intervals at period boundaries
 * - Any time granularity (daily, weekly, monthly)
 *
 * @param series - Array of series data where index 0 is primary and index 1+ are comparison
 * @return New array with aligned series (comparison dates match primary, originals in realDate)
 */
export function alignSeriesDates(
	series: ComparativeLineChartSeries[]
): ComparativeLineChartSeries[] {
	if ( series.length < 2 ) {
		return series;
	}

	const [ primary, ...rest ] = series;

	if ( ! primary.data.length ) {
		return series;
	}

	const alignedRest = rest.map( comparisonSeries => {
		if ( ! comparisonSeries.data.length ) {
			return comparisonSeries;
		}

		const primaryFirstDate = primary.data[ 0 ]?.date;
		const comparisonFirstDate = comparisonSeries.data[ 0 ]?.date;

		const primaryFirstMs =
			primaryFirstDate instanceof Date ? primaryFirstDate.getTime() : primaryFirstDate;

		const comparisonFirstMs =
			comparisonFirstDate instanceof Date ? comparisonFirstDate.getTime() : comparisonFirstDate;

		if ( primaryFirstMs === comparisonFirstMs ) {
			return comparisonSeries;
		}

		return {
			...comparisonSeries,
			data: comparisonSeries.data.map( ( point, index ) => {
				// A longer comparison series falls back to the last primary date.
				const primaryDate =
					primary.data[ index ]?.date ?? primary.data[ primary.data.length - 1 ]?.date;

				return {
					...point,
					date: primaryDate,
					realDate: point.date,
				};
			} ),
		};
	} );

	return [ primary, ...alignedRest ];
}
