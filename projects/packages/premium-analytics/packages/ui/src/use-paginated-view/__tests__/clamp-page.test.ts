/**
 * Internal dependencies
 */
import { clampPage } from '../clamp-page';

describe( 'clampPage', () => {
	it( 'leaves a page that is still in range alone', () => {
		expect( clampPage( 2, 3 ) ).toBe( 2 );
		expect( clampPage( 3, 3 ) ).toBe( 3 );
	} );

	it( 'falls back to the last page when the page is past the end', () => {
		expect( clampPage( 3, 2 ) ).toBe( 2 );
		expect( clampPage( 99, 1 ) ).toBe( 1 );
	} );

	it( 'falls back to the first page when there are no pages', () => {
		expect( clampPage( 3, 0 ) ).toBe( 1 );
	} );

	it( 'never returns a page below one', () => {
		expect( clampPage( 0, 3 ) ).toBe( 1 );
		expect( clampPage( -1, 3 ) ).toBe( 1 );
	} );
} );
