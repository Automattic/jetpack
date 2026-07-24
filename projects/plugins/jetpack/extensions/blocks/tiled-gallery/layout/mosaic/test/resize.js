import { GUTTER_WIDTH } from '../../../constants';
import { handleRowResize } from '../resize';

/**
 * Build a `.tiled-gallery__row` element with the given number of single-image columns.
 *
 * @param {number} numCols - Number of columns to create.
 * @return {HTMLElement} The constructed row element.
 */
function buildRow( numCols ) {
	const row = document.createElement( 'div' );
	row.className = 'tiled-gallery__row';

	for ( let c = 0; c < numCols; c++ ) {
		const col = document.createElement( 'div' );
		col.className = 'tiled-gallery__col';

		const item = document.createElement( 'div' );
		item.className = 'tiled-gallery__item';

		const img = document.createElement( 'img' );
		img.dataset.width = '100';
		img.dataset.height = '100';

		item.appendChild( img );
		col.appendChild( item );
		row.appendChild( col );
	}

	return row;
}

/**
 * Sum the inline pixel widths handleRowResize wrote onto a row's items.
 *
 * @param {HTMLElement} row - The row element previously passed to handleRowResize.
 * @return {number} Total of the items' inline `width` values, in pixels.
 */
function sumItemWidths( row ) {
	return Array.from( row.querySelectorAll( '.tiled-gallery__item' ) ).reduce(
		( sum, item ) => sum + parseFloat( item.style.width ),
		0
	);
}

describe( 'handleRowResize gutter accounting', () => {
	it.each( [ 2, 3, 4 ] )(
		'lays a %i-column row out so columns + one rendered gutter per gap fill the width',
		numCols => {
			const width = 600;
			const row = buildRow( numCols );

			handleRowResize( row, width );

			// The DOM renders exactly one gutter per gap (margin between columns).
			// The laid-out columns plus those rendered gutters must add up to the
			// measured width. Reserving more gutter space than is rendered makes
			// every layout pass narrower than its container, which spirals into an
			// infinite resize loop when the block is a content-sized flex item
			// (inside a Row/Stack). See JETPACK-1726.
			const renderedGutters = GUTTER_WIDTH * ( numCols - 1 );
			expect( sumItemWidths( row ) + renderedGutters ).toBeCloseTo( width, 5 );
		}
	);
} );
