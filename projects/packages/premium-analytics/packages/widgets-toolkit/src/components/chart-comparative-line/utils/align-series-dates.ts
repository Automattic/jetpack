/**
 * Internal dependencies
 */
import { resolvePrimarySeriesByGroup } from '../../../helpers/resolve-series-names';
import type { ComparativeLineChartSeries } from '../types';

/**
 * Aligns comparison points onto the primary series by index, keeping their real dates
 * in `realDate` for tooltips. A grouped comparison aligns to its group's current
 * period; an ungrouped one keeps the historical behavior of aligning to series[0].
 */
export function alignSeriesDates(
	series: ComparativeLineChartSeries[]
): ComparativeLineChartSeries[] {
	if ( series.length < 2 ) {
		return series;
	}

	const fallbackPrimary = series[ 0 ];

	// Preserve the historical no-data contract, including the original array
	// reference, when the chart's axis-setting series has no points.
	if ( ! fallbackPrimary.data.length ) {
		return series;
	}

	const primarySeriesByGroup = resolvePrimarySeriesByGroup( series );

	return series.map( comparisonSeries => {
		if ( ! comparisonSeries.data.length || comparisonSeries.options?.type !== 'comparison' ) {
			return comparisonSeries;
		}

		const primary =
			( comparisonSeries.group !== undefined
				? primarySeriesByGroup.get( comparisonSeries.group )
				: undefined ) ?? fallbackPrimary;

		if ( ! primary.data.length ) {
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
}
