import type { HeatmapColumn } from '../types';

export const isPresent = ( value: number | null | undefined ): value is number =>
	value !== null && value !== undefined && ! isNaN( value );

/**
 * Get the min and max values from heatmap data, ignoring null/NaN and the zeros
 * `isEmptyValue` paints as empty. Summary columns stay out: a roll-up on the
 * scale would flatten every real cell.
 * @param data - The heatmap columns
 * @return Tuple of [min, max] values
 */
export const getValueExtent = ( data: HeatmapColumn[] ): [ number, number ] => {
	let min = Infinity;
	let max = -Infinity;
	let hasZero = false;
	for ( const column of data ) {
		if ( column.summary ) {
			continue;
		}
		for ( const cell of column.data ) {
			if ( ! isPresent( cell.value ) ) {
				continue;
			}
			if ( cell.value === 0 ) {
				hasZero = true;
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
	// A zero only takes a place on the scale beside negatives.
	if ( hasZero && min < 0 ) {
		max = Math.max( max, 0 );
	}
	if ( min === Infinity ) {
		return [ 0, 0 ];
	}
	return [ min, max ];
};

/**
 * Whether a value paints as an empty cell: a zero in data with no negatives
 * counts nothing, so it must not look like the lowest step of activity.
 *
 * @param value  - The cell value
 * @param extent - The extent from `getValueExtent`
 * @return True when the cell takes the empty-cell color
 */
export const isEmptyValue = ( value: number, extent: [ number, number ] ): boolean =>
	value === 0 && extent[ 0 ] >= 0;

/**
 * Normalize a value to 0–1 within the extent. A flat extent (min === max)
 * maps to 1, since every cell is equally the "highest".
 *
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
