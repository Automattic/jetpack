import { __ } from '@wordpress/i18n';
import type { DataPoint, DataPointDate, SeriesData } from '../../../types';

/**
 * Up-front data validation. Returns a localised error message when the chart
 * cannot safely render, otherwise `null`. Catches the cases that would
 * NaN-cascade through the tick formatter and stack layout: empty top-level
 * array, empty per-series data, null/NaN values, invalid dates.
 *
 * @param data - Series data passed to AreaChart.
 * @return Error message, or `null` if the data is renderable.
 */
export const validateData = ( data: SeriesData[] ) => {
	if ( ! data?.length ) return __( 'No data available', 'jetpack-charts' );

	const hasEmptySeries = data.some( series => ! series.data?.length );
	if ( hasEmptySeries ) return __( 'No data available', 'jetpack-charts' );

	const hasInvalidData = data.some( series =>
		series.data.some(
			( point: DataPointDate | DataPoint ) =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				( 'date' in point && point.date && isNaN( point.date.getTime() ) )
		)
	);

	if ( hasInvalidData ) return __( 'Invalid data', 'jetpack-charts' );
	return null;
};
