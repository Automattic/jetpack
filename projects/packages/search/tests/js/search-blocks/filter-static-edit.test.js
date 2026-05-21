// Locks the pure helpers behind the filter-static inspector. The component
// itself is integration-tested via the editor; here we pin the variation
// normalisation in isolation so the JS gate matches `Filter_Static::normalize_variation()`
// on the PHP side.
import { normalizeVariation } from '../../../src/search-blocks/blocks/filter-static/edit.js';

describe( 'normalizeVariation', () => {
	it( "returns 'tabbed' verbatim", () => {
		expect( normalizeVariation( 'tabbed' ) ).toBe( 'tabbed' );
	} );

	it( "returns 'sidebar' verbatim", () => {
		expect( normalizeVariation( 'sidebar' ) ).toBe( 'sidebar' );
	} );

	it( "collapses unknown / missing / non-string values to 'sidebar'", () => {
		// Mirrors `Filter_Static::normalize_variation()` — anything that
		// isn't the literal string 'tabbed' becomes 'sidebar'. A drift
		// between these two would scope the editor preview to a
		// different filter subset than the front-end render.
		expect( normalizeVariation( '' ) ).toBe( 'sidebar' );
		expect( normalizeVariation( 'garbage' ) ).toBe( 'sidebar' );
		expect( normalizeVariation( undefined ) ).toBe( 'sidebar' );
		expect( normalizeVariation( null ) ).toBe( 'sidebar' );
		expect( normalizeVariation( 0 ) ).toBe( 'sidebar' );
	} );
} );
