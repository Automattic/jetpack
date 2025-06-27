import { useMemo } from 'react';
import { parseAsLocalDate } from './date-parsing';
import type { SeriesData } from '../../types';

/**
 * Hook that transforms and sorts chart data, handling date parsing and sorting
 *
 * This hook extracts the common data transformation logic used in both line-chart
 * and bar-chart components. It:
 * 1. Parses date strings into Date objects using parseAsLocalDate
 * 2. Sorts data points by date when date properties are present
 * 3. Returns the original data unchanged when no date properties are found
 *
 * @param {SeriesData[]} data - The raw chart data to transform
 * @return {SeriesData[]} The transformed and sorted data
 */
export const useChartDataTransform = ( data: SeriesData[] ) => {
	return useMemo( () => {
		// Check if the first data point has date or dateString properties
		const firstPoint = data?.[ 0 ]?.data?.[ 0 ];
		const hasDateProperties = firstPoint && ( 'date' in firstPoint || 'dateString' in firstPoint );

		// If no date properties found, return data unchanged
		if ( ! hasDateProperties ) {
			return data;
		}

		// Transform and sort data with date properties
		return data.map( series => ( {
			...series,
			data: series.data
				.map( point => {
					let date: Date | undefined;

					if ( 'date' in point && point.date ) {
						date = point.date;
					} else if ( 'dateString' in point && point.dateString ) {
						date = parseAsLocalDate( point.dateString );
					}

					return {
						...point,
						date,
					};
				} )
				.sort( ( a, b ) => {
					if ( ! a.date || ! b.date ) return 0;
					return a.date.getTime() - b.date.getTime();
				} ),
		} ) );
	}, [ data ] );
};
