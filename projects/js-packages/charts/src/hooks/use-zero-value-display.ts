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
	/**
	 * The height of the chart in pixels. Used to calculate a minimum visible value
	 * that ensures zero-value bars are at least MIN_PIXEL_HEIGHT pixels tall.
	 */
	chartHeight?: number;
}

/**
 * Minimum pixel height for zero-value bars to ensure visibility.
 */
const MIN_PIXEL_HEIGHT = 3;

export const useZeroValueDisplay = (
	data: SeriesData[],
	options: UseZeroValueDisplayOptions = { enabled: false }
): SeriesData[] | EnhancedSeriesData[] => {
	const { enabled, minValueRatio = 0.6, maxValueRatio = 0.008, chartHeight } = options;

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
		let minVisibleValue = Math.min(
			minAbsoluteValue * minValueRatio,
			maxAbsoluteValue * maxValueRatio
		);

		// Ensure minimum pixel height when chartHeight is provided
		// Calculate the value that would result in MIN_PIXEL_HEIGHT pixels
		if ( chartHeight && chartHeight > 0 ) {
			const minPixelBasedValue = ( MIN_PIXEL_HEIGHT / chartHeight ) * maxAbsoluteValue;
			minVisibleValue = Math.max( minVisibleValue, minPixelBasedValue );
		}

		return data.map( series => ( {
			...series,
			data: series.data.map( ( point: DataPointDate ): EnhancedDataPoint => {
				if ( point.value === 0 ) {
					return {
						...point,
						visualValue: minVisibleValue,
					};
				}

				return point;
			} ),
		} ) );
	}, [ data, enabled, minValueRatio, maxValueRatio, chartHeight ] );
};
