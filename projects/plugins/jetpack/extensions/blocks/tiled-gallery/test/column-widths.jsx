import { render } from '@testing-library/react';
import Edit from '../edit';

// The mosaic watches its own size to decide when to lay out again. jsdom performs
// no layout so the observer would never fire anyway, and the pass these tests
// exercise is the one the component runs itself on mount. Stubbing the observer
// keeps its global refresh machinery out of the test environment.
jest.mock(
	'resize-observer-polyfill',
	() =>
		class ResizeObserverStub {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
);

/**
 * Five portrait images.
 *
 * The mosaic algorithm lays this set out as a single row of five columns when the
 * block is wide or full aligned, and as two rows (three columns, then two) at any
 * other alignment. The saved `columnWidths` shape therefore differs between the
 * two alignments, which is what makes the set useful here. See JETPACK-1990.
 */
const images = Array.from( { length: 5 }, ( _, i ) => ( {
	alt: `Gallery Image ${ i + 1 }`,
	height: 2048,
	id: `${ i + 1 }`,
	// A localhost URL stops photonizedImgProps from rewriting the src.
	url: `http://localhost:4759/wp-content/uploads/2021/03/tree${ i + 1 }.jpeg`,
	width: 1365,
} ) );

/** Widths the block saves for the two-row layout it uses when not wide aligned. */
const narrowColumnWidths = [
	[ '33.33333', '33.33333', '33.33333' ],
	[ '50.00000', '50.00000' ],
];

/** Widths the block saves for the one-row layout it uses when wide aligned. */
const wideColumnWidths = [ [ '20.00000', '20.00000', '20.00000', '20.00000', '20.00000' ] ];

const GALLERY_WIDTH = 600;

let clientWidthSpy;
let animationFrameSpy;

beforeEach( () => {
	// jsdom performs no layout, so the mosaic would otherwise measure a 0px wide
	// gallery. Give elements a width so a real layout pass runs.
	clientWidthSpy = jest
		.spyOn( window.Element.prototype, 'clientWidth', 'get' )
		.mockReturnValue( GALLERY_WIDTH );
	// The mosaic defers its layout pass to an animation frame. Running it inline
	// means rendering the block is enough to observe what it writes back.
	animationFrameSpy = jest
		.spyOn( window, 'requestAnimationFrame' )
		.mockImplementation( callback => {
			callback();
			return 0;
		} );
} );

afterEach( () => {
	clientWidthSpy.mockRestore();
	animationFrameSpy.mockRestore();
} );

/**
 * Render the block and return the setAttributes it was given.
 *
 * The mosaic lays itself out on mount, so by the time this returns the block has
 * already written back whatever it intends to.
 *
 * @param {object} attributes - Block attributes to render the block with.
 * @return {Function} The setAttributes mock the block was rendered with.
 */
function layOutGallery( attributes ) {
	const setAttributes = jest.fn();
	render( <Edit attributes={ attributes } setAttributes={ setAttributes } isSelected={ false } /> );
	return setAttributes;
}

/**
 * Column count of each row in a columnWidths value.
 *
 * @param {Array<Array>} columnWidths - A columnWidths attribute value.
 * @return {Array<number>|undefined} Number of columns in each row.
 */
function shapeOf( columnWidths ) {
	return columnWidths?.map( row => row.length );
}

/**
 * Percentage each row of a columnWidths value adds up to, rounded to two decimals.
 *
 * @param {Array<Array>} columnWidths - A columnWidths attribute value.
 * @return {Array<number>|undefined} Total percentage of each row.
 */
function rowTotalsOf( columnWidths ) {
	return columnWidths?.map(
		row =>
			Math.round( row.reduce( ( total, width ) => total + parseFloat( width ), 0 ) * 100 ) / 100
	);
}

/**
 * The columnWidths value the block last wrote back, or undefined if it wrote none.
 *
 * @param {Function} setAttributes - The setAttributes mock the block was rendered with.
 * @return {Array<Array>|undefined} The columnWidths that were written, if any.
 */
function writtenColumnWidths( setAttributes ) {
	const call = setAttributes.mock.calls.filter( ( [ attrs ] ) => 'columnWidths' in attrs ).pop();
	return call?.[ 0 ].columnWidths;
}

describe( 'columnWidths staleness', () => {
	it( 'rewrites saved columnWidths that no longer match the rendered layout', () => {
		// Widths computed for the not-wide layout, now rendered wide aligned. The
		// block used to keep the stale value because no image had changed, which
		// baked a two-row set of widths into a one-row layout on the next save:
		// the row took the first three widths, summing to 100% across five columns,
		// and the last two columns got no flex-basis at all.
		const setAttributes = layOutGallery( {
			align: 'wide',
			columnWidths: narrowColumnWidths,
			images,
		} );

		expect( shapeOf( writtenColumnWidths( setAttributes ) ) ).toEqual( [ 5 ] );
	} );

	it( 'writes columnWidths whose every row fills the gallery', () => {
		// The layout algorithm normalises each row to 100%, so a row adding up to
		// anything else can only be widths belonging to a differently shaped row.
		// That is what shipped to readers as a 57% wide row. See JETPACK-1990.
		const setAttributes = layOutGallery( {
			align: 'wide',
			columnWidths: narrowColumnWidths,
			images,
		} );

		expect( rowTotalsOf( writtenColumnWidths( setAttributes ) ) ).toEqual( [ 100 ] );
	} );

	it( 'writes nothing when the gallery has no width to lay out against', () => {
		// A gallery that has not been laid out yet, or that sits inside a hidden
		// container, measures 0px. A single column row reserves no gutter, so the
		// row is 0px wide too and turning its column into a percentage of the row
		// divides zero by zero. The resulting "NaN" must never reach saved content.
		clientWidthSpy.mockReturnValue( 0 );

		const setAttributes = layOutGallery( {
			align: 'wide',
			columnWidths: narrowColumnWidths,
			images: images.slice( 0, 1 ),
		} );

		expect( writtenColumnWidths( setAttributes ) ).toBeUndefined();
	} );

	it( 'leaves saved columnWidths alone when they still match the rendered layout', () => {
		// Opening a post must not mark it as modified. Nothing changed here, so the
		// block has no reason to write anything back.
		const setAttributes = layOutGallery( {
			align: 'wide',
			columnWidths: wideColumnWidths,
			images,
		} );

		expect( writtenColumnWidths( setAttributes ) ).toBeUndefined();
	} );
} );
