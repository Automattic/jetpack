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
 * Minimum pixel height for zero-value bars to ensure visibility.
 */
const MIN_PIXEL_HEIGHT = 3;

export const useZeroValueDisplay = (
	data: SeriesData[],
	options: UseZeroValueDisplayOptions = { enabled: false }
): SeriesData[] | EnhancedSeriesData[] => {
	const { enabled, valueAxisLength } = options;

	return useMemo( () => {
		if ( ! enabled || ! valueAxisLength || valueAxisLength <= 0 ) return data;

		// Find max and min absolute values
		let maxAbsoluteValue = 0;
		let minAbsoluteValue = Infinity;
		for ( const series of data ) {
			for ( const point of series.data ) {
				if ( point.value !== null && point.value !== 0 ) {
					const absValue = Math.abs( point.value );
					maxAbsoluteValue = Math.max( maxAbsoluteValue, absValue );
					minAbsoluteValue = Math.min( minAbsoluteValue, absValue );
				}
			}
		}

		if ( maxAbsoluteValue === 0 ) return data;

		// Calculate the value that renders as MIN_PIXEL_HEIGHT pixels,
		// but never exceed the smallest actual value (so zero bars don't appear larger than real data)
		const pixelBasedValue = ( MIN_PIXEL_HEIGHT / valueAxisLength ) * maxAbsoluteValue;
		const minVisibleValue = Math.min( pixelBasedValue, minAbsoluteValue );

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
	}, [ data, enabled, valueAxisLength ] );
};
