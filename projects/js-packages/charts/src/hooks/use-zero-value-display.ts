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
 * Minimum pixel height/width for bars to ensure visibility.
 */
const MIN_PIXEL_SIZE = 3;

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

		// Calculate the minimum value that renders as MIN_PIXEL_SIZE pixels
		const minVisibleValue = ( MIN_PIXEL_SIZE / valueAxisLength ) * maxAbsoluteValue;

		return data.map( series => ( {
			...series,
			data: series.data.map( ( point: DataPointDate ): EnhancedDataPoint => {
				const absValue = Math.abs( point.value ?? 0 );

				// Boost any value that would render smaller than MIN_PIXEL_SIZE
				if ( absValue < minVisibleValue ) {
					return {
						...point,
						visualValue: minVisibleValue,
					};
				}

				return point;
			} ),
		} ) );
	}, [ data, enabled, valueAxisLength ] );
};
