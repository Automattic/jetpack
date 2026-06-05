/**
 * External dependencies
 */
import { useMemo } from 'react';
import { useGlobalChartsContext } from '@automattic/charts';
import type { SeriesData } from '@automattic/charts';

/**
 * Internal dependencies
 */
import type { BarChartStyle } from '../../components';

/**
 * Hook to build bar chart styles from theme.
 * Maps each series to its color from the theme provider.
 *
 * @param chartData - Array of series data (SeriesData[])
 * @return Array of bar styles with stroke color for each series
 *
 * @example
 * ```tsx
 * const barStyles = useBarStyles( chartData );
 * return <BarChart chartData={ chartData } styles={ barStyles } ... />;
 * ```
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
