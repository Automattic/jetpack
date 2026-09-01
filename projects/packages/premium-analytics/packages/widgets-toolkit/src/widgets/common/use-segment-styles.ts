/**
 * External dependencies
 */
import { useGlobalChartsContext } from '@jetpack-premium-analytics/externals';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import type { SegmentStyle } from '../../helpers';

type ChartSegment = {
	label: string;
	value: number;
	percentage?: number;
};

/**
 * Maps each chart segment to the color the theme provider resolves for it.
 *
 * @param chartData - Array of chart segments with label and value
 * @return Array of segment styles with color for each segment
 */
export function useSegmentStyles( chartData: ChartSegment[] ): SegmentStyle[] {
	const { getElementStyles } = useGlobalChartsContext();

	return useMemo(
		() =>
			chartData.map( ( segment, index ) => {
				const { color } = getElementStyles( {
					data: {
						...segment,
						group: segment.label, // Use label as group for stable color assignment
					} as Parameters< typeof getElementStyles >[ 0 ][ 'data' ],
					index,
				} );

				return { color };
			} ),
		[ chartData, getElementStyles ]
	);
}
