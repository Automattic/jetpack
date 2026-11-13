import type { HeatmapColumn } from '../types';

export const isPresent = ( value: number | null | undefined ): value is number =>
	value !== null && value !== undefined && ! isNaN( value );

/**
 * Every value a cell reports, ascending. Roll-up columns stay out, since a
 * summary on the scale would flatten every real cell, and so do cells that
 * report nothing about the series.
 *
 * @param data - The heatmap columns
 * @return The reported values, ascending
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
 * Get the min and max of an ascending value list, ignoring the zeros
 * `isEmptyValue` paints as empty.
 *
 * @param values - The values from `scaleValues`
 * @return Tuple of [min, max] values
 */
export const getExtentOf = ( values: number[] ): [ number, number ] => {
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
 * Get the min and max values from heatmap data, ignoring the zeros
 * `isEmptyValue` paints as empty.
 *
 * @param data - The heatmap columns
 * @return Tuple of [min, max] values
 */
export const getValueExtent = ( data: HeatmapColumn[] ): [ number, number ] =>
	getExtentOf( scaleValues( data ) );

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
 * Place a value by its distance from the extent's ends rather than its rank.
 * A flat extent maps to 1, since every cell is equally the highest.
 *
 * @param value  - The value to place
 * @param extent - Tuple of [min, max] from `getExtentOf`
 * @return Position between 0 and 1
 */
export const getNormalizedValue = ( value: number, extent: [ number, number ] ): number => {
	const [ min, max ] = extent;
	if ( min === max ) {
		return 1;
	}
	return Math.min( 1, Math.max( 0, ( value - min ) / ( max - min ) ) );
};

/**
 * Place a value by its distance in log space and snap it to `steps`, so a
 * tenfold jump moves the color by the same amount wherever it falls in the
 * series and a cell always matches a legend swatch. Undefined at or below zero,
 * so the caller checks `canPlaceOnLogScale` first.
 *
 * @param value  - The value to place
 * @param extent - Tuple of [min, max] from `getExtentOf`
 * @param steps  - How many color steps the cells share with the legend
 * @return The swatch position between 0 and 1
 */
export const getLogValue = ( value: number, extent: [ number, number ], steps: number ): number => {
	const [ min, max ] = extent;
	if ( min === max ) {
		return 1;
	}
	const position = ( Math.log( value ) - Math.log( min ) ) / ( Math.log( max ) - Math.log( min ) );
	const bounded = Math.min( 1, Math.max( 0, position ) );
	return Math.round( bounded * ( steps - 1 ) ) / ( steps - 1 );
};

/**
 * Whether a series can take the log scale. A zero or a negative has no
 * logarithm, and `getExtentOf` keeps the lowest of either in the extent.
 *
 * @param extent - The extent from `getExtentOf`
 * @return True when every value on the scale is above zero
 */
export const canPlaceOnLogScale = ( extent: [ number, number ] ): boolean => extent[ 0 ] > 0;
