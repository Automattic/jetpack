/**
 * External dependencies
 */
import { useGlobalChartsContext, type SeriesData } from '@jetpack-premium-analytics/externals';
import { useMemo } from 'react';
import type { BarChartStyle } from '../../components';

/**
 * Internal dependencies
 */

/**
 * Maps each series to the color the theme provider resolves for it.
 *
 * @param chartData - Array of series data (SeriesData[])
 * @return Array of bar styles with stroke color for each series
 */
export function useBarStyles( chartData: SeriesData[] ): BarChartStyle[] {
	const { getElementStyles } = useGlobalChartsContext();

	return useMemo(
		() =>
			chartData.map( ( seriesData, index ) => {
				const { color } = getElementStyles( {
					data: seriesData,
					index,
				} );

				return { stroke: color };
			} ),
		[ chartData, getElementStyles ]
	);
}
