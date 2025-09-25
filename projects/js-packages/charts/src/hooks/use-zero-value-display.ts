import { useMemo } from 'react';
import type { SeriesData, DataPointDate } from '../types';

export type EnhancedDataPoint = DataPointDate & {
	visualValue?: number;
};

export interface EnhancedSeriesData extends Omit< SeriesData, 'data' > {
	data: EnhancedDataPoint[];
}

export interface UseZeroValueDisplayOptions {
	enabled: boolean;
	minValueRatio?: number;
	maxValueRatio?: number;
}

export const useZeroValueDisplay = (
	data: SeriesData[],
	options: UseZeroValueDisplayOptions = { enabled: false }
): SeriesData[] | EnhancedSeriesData[] => {
	const { enabled, minValueRatio = 0.6, maxValueRatio = 0.008 } = options;

	return useMemo( () => {
		if ( ! enabled ) return data;

		// Collect all non-zero, non-null values (both positive and negative)
		const nonZeroValues: number[] = [];

		for ( const series of data ) {
			for ( const point of series.data ) {
				if ( point.value !== null && point.value !== 0 ) {
					nonZeroValues.push( point.value );
				}
			}
		}

		if ( nonZeroValues.length === 0 ) return data;

		// Convert to absolute values to find the range
		const absoluteValues = nonZeroValues.map( Math.abs );

		// Calculate min and max based on absolute values
		const minAbsoluteValue = Math.min( ...absoluteValues );
		const maxAbsoluteValue = Math.max( ...absoluteValues );

		// Calculate minimum visible value using absolute range
		const minVisibleValue = Math.min(
			minAbsoluteValue * minValueRatio,
			maxAbsoluteValue * maxValueRatio
		);

		return data.map( series => ( {
			...series,
			data: series.data.map( ( point ): EnhancedDataPoint => {
				if ( point.value === 0 ) {
					return {
						...point,
						visualValue: minVisibleValue,
					};
				}

				return point;
			} ),
		} ) );
	}, [ data, enabled, minValueRatio, maxValueRatio ] );
};
