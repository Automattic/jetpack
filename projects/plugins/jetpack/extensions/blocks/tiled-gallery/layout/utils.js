export function layoutSupportsColumns( layout ) {
	return [ 'columns', 'circle', 'square' ].includes( layout );
}

/**
 * Whether two `columnWidths` values describe the same grid of rows and columns.
 *
 * `columnWidths` is applied by position — `columnWidths[ rowIndex ][ colIndex ]` —
 * against a row/column shape that is recomputed from the images on every render.
 * Comparing shapes is how a saved value is recognised as belonging to a layout the
 * block no longer renders. See JETPACK-1990.
 *
 * @param {Array<Array>} a - A columnWidths value.
 * @param {Array<Array>} b - The columnWidths value to compare it against.
 * @return {boolean} True when both have the same number of rows and the same number of columns in each row.
 */
export function hasSameColumnShape( a, b ) {
	return (
		Array.isArray( a ) &&
		Array.isArray( b ) &&
		a.length === b.length &&
		a.every( ( row, rowIndex ) => row?.length === b[ rowIndex ]?.length )
	);
}
