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
	/**
	 * The pixel length of the value axis (height for vertical charts, width for
	 * horizontal charts). Used to calculate a minimum visible value that ensures
	 * zero-value bars are at least MIN_PIXEL_HEIGHT pixels tall along that axis.
	 */
	valueAxisLength?: number;
}

/**
 * Minimum pixel size for near-zero bars (non-zero values that would render too small).
 * Using 3px to be visible but not misleading - larger values might look like actual data.
 */
const MIN_PIXEL_SIZE = 3;

/**
 * Pixel size for zero-value bars (1px less than near-zero to be visually distinguishable).
 */
const ZERO_PIXEL_SIZE = MIN_PIXEL_SIZE - 1;

export const useZeroValueDisplay = (
	data: SeriesData[],
	options: UseZeroValueDisplayOptions = { enabled: false }
): SeriesData[] | EnhancedSeriesData[] => {
	const { enabled, valueAxisLength } = options;

	return useMemo( () => {
		if ( ! enabled || ! valueAxisLength || valueAxisLength <= 0 ) return data;

		// Find max absolute value
		let maxAbsoluteValue = 0;
		for ( const series of data ) {
			for ( const point of series.data ) {
				if ( point.value !== null && point.value !== 0 ) {
					maxAbsoluteValue = Math.max( maxAbsoluteValue, Math.abs( point.value ) );
				}
			}
		}

		if ( maxAbsoluteValue === 0 ) return data;

		// Calculate values that render as specific pixel sizes, clamped to maxAbsoluteValue
		// to prevent visual distortion when valueAxisLength is very small
		const minNonZeroValue = Math.min(
			( MIN_PIXEL_SIZE / valueAxisLength ) * maxAbsoluteValue,
			maxAbsoluteValue
		);
		const zeroVisualValue = Math.min(
			( ZERO_PIXEL_SIZE / valueAxisLength ) * maxAbsoluteValue,
			maxAbsoluteValue
		);

		return data.map( series => ( {
			...series,
			data: series.data.map( ( point: DataPointDate ): EnhancedDataPoint => {
				// Zero values get a smaller visual representation (2px)
				if ( point.value === 0 ) {
					return {
						...point,
						visualValue: zeroVisualValue,
					};
				}

				// Null values should remain untouched
				if ( point.value === null ) {
					return point;
				}

				const absValue = Math.abs( point.value );

				// Near-zero values that would render below MIN_PIXEL_SIZE get boosted to 3px
				// Preserve the sign for negative values
				if ( absValue < minNonZeroValue ) {
					return {
						...point,
						visualValue: Math.sign( point.value ) * minNonZeroValue,
					};
				}

				return point;
			} ),
		} ) );
	}, [ data, enabled, valueAxisLength ] );
};
