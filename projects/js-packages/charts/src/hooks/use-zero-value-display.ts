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

		// Find max absolute value to calculate the 3px equivalent
		let maxAbsoluteValue = 0;
		for ( const series of data ) {
			for ( const point of series.data ) {
				if ( point.value !== null && point.value !== 0 ) {
					maxAbsoluteValue = Math.max( maxAbsoluteValue, Math.abs( point.value ) );
				}
			}
		}

		if ( maxAbsoluteValue === 0 ) return data;

		// Calculate the value that renders as MIN_PIXEL_HEIGHT pixels
		const minVisibleValue = ( MIN_PIXEL_HEIGHT / valueAxisLength ) * maxAbsoluteValue;

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
