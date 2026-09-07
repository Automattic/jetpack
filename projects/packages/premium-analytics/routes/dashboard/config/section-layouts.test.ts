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

	it( 'accepts any string key, since slugs are server-driven', () => {
		expect(
			isDashboardSectionLayouts( {
				store: [],
				conversions: [],
			} )
		).toBe( true );
	} );

	it( 'rejects non-object values', () => {
		expect( isDashboardSectionLayouts( [] ) ).toBe( false );
		expect( isDashboardSectionLayouts( null ) ).toBe( false );
	} );

	it( 'rejects non-array layouts', () => {
		expect(
			isDashboardSectionLayouts( {
				traffic: {},
			} )
		).toBe( false );
	} );
} );
