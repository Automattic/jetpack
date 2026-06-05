/**
 * External dependencies
 */
import { useGlobalChartsContext } from '@automattic/charts';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type {
	ComparativeLineChartSeries,
	SeriesStyle,
} from '../components/chart-comparative-line/types';

/**
 * Hook to build series styles from theme.
 * Maps each chart series to its color and line styles from the theme provider.
 *
 * @param series - Array of chart series data
 * @return Array of series styles with stroke color and line properties
 *
 * @example
 * ```tsx
 * const seriesStyles = useSeriesStyles( chartSeries );
 * return <ComparativeLineChart series={ chartSeries } styles={ seriesStyles } ... />;
 * ```
 */
export function useSeriesStyles( series: ComparativeLineChartSeries[] ): SeriesStyle[] {
	const { getElementStyles } = useGlobalChartsContext();

	return useMemo(
		() =>
			series.map( ( seriesData, index ) => {
				const { color, lineStyles } = getElementStyles( {
					data: seriesData,
					index,
				} );

				return {
					stroke: color,
					...lineStyles,
				};
			} ),
		[ series, getElementStyles ]
	);
}
