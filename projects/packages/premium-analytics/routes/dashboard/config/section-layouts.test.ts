/**
 * Internal dependencies
 */
import { isDashboardSectionLayouts } from './section-layouts';

describe( 'section layouts config', () => {
	it( 'accepts a section-to-layout preference map', () => {
		expect(
			isDashboardSectionLayouts( {
				traffic: [],
				insights: [],
			} )
		).toBe( true );
	} );

	it( 'accepts keys for sections not currently available', () => {
		// Slugs are server-driven, so the map must keep layouts for sections
		// that are temporarily unavailable (e.g. store with WooCommerce off).
		expect(
			isDashboardSectionLayouts( {
				store: [],
				conversions: [],
			} )
		).toBe( true );
	} );

	it( 'rejects non-array layouts', () => {
		expect(
			isDashboardSectionLayouts( {
				traffic: {},
			} )
		).toBe( false );
	} );

	it( 'rejects non-object values', () => {
		expect( isDashboardSectionLayouts( [ [] ] ) ).toBe( false );
		expect( isDashboardSectionLayouts( null ) ).toBe( false );
	} );
} );
