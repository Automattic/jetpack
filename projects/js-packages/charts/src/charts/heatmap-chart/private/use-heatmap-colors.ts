import type { HeatmapColumn } from '../types';

export const isPresent = ( value: number | null | undefined ): value is number =>
	value !== null && value !== undefined && ! isNaN( value );

/**
 * Every value the color scale is built from, ascending. Summary columns stay
 * out — a roll-up on the scale would flatten every real cell — as do cells that
 * paint no fill of their own and so report nothing about the series.
 *
 * @param data - The heatmap columns
 * @return The eligible values, ascending
 */
export const scaleValues = ( data: HeatmapColumn[] ): number[] => {
	const values: number[] = [];
	for ( const column of data ) {
		if ( column.summary ) {
			continue;
		}
		for ( const cell of column.data ) {
			if ( cell.hidden || cell.placeholder || cell.partial || ! isPresent( cell.value ) ) {
				continue;
			}
			values.push( cell.value );
		}
	}
	return values.sort( ( a, b ) => a - b );
};

/**
 * Get the min and max values from heatmap data, ignoring the zeros
 * `isEmptyValue` paints as empty.
 *
 * @param data - The heatmap columns
 * @return Tuple of [min, max] values
 */
export const getValueExtent = ( data: HeatmapColumn[] ): [ number, number ] => {
	const values = scaleValues( data );
	const nonZero = values.filter( value => value !== 0 );
	if ( ! nonZero.length ) {
		return [ 0, 0 ];
	}
	const min = nonZero[ 0 ];
	const max = nonZero[ nonZero.length - 1 ];
	// A zero counts as data once the series has negatives, so the scale has to reach it.
	return [ min, min < 0 && nonZero.length < values.length ? Math.max( max, 0 ) : max ];
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
