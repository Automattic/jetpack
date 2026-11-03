/**
 * External dependencies
 */
import { useGlobalChartsContext } from '@jetpack-premium-analytics/externals';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type {
	ComparativeLineChartSeries,
	SeriesStyle,
} from '../components/chart-comparative-line/types';

/**
 * Maps each chart series to the color and line styles the theme provider
 * resolves for it.
 *
 * @param series - Array of chart series data
 * @return Array of series styles with stroke color and line properties
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
