import type { HeatmapColumn } from '../types';

export const isPresent = ( value: number | null | undefined ): value is number =>
	value !== null && value !== undefined && ! isNaN( value );

/**
 * Get the min and max values from heatmap data, ignoring null/NaN.
 * @param data - The heatmap columns
 * @return Tuple of [min, max] values
 */
export const getValueExtent = ( data: HeatmapColumn[] ): [ number, number ] => {
	let min = Infinity;
	let max = -Infinity;
	for ( const column of data ) {
		for ( const cell of column.data ) {
			if ( ! isPresent( cell.value ) ) {
				continue;
			}
			if ( cell.value < min ) {
				min = cell.value;
			}
			if ( cell.value > max ) {
				max = cell.value;
			}
		}
	}
	if ( min === Infinity ) {
		return [ 0, 0 ];
	}
	return [ min, max ];
};

/**
 * Normalize a value to 0–1 within the extent. A flat extent (min === max) maps to 1.
 * @param value  - The value to normalize
 * @param extent - Tuple of [min, max] values for the normalization range
 * @return Normalized value between 0 and 1
 */
export const getNormalizedValue = ( value: number, extent: [ number, number ] ): number => {
	const [ min, max ] = extent;
	if ( min === max ) {
		return 1;
	}
	return Math.min( 1, Math.max( 0, ( value - min ) / ( max - min ) ) );
};
