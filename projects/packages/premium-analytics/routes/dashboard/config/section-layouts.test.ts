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

	it( 'rejects unknown section keys', () => {
		expect(
			isDashboardSectionLayouts( {
				unknown: [],
			} )
		).toBe( false );
	} );

	it( 'rejects non-array layouts', () => {
		expect(
			isDashboardSectionLayouts( {
				traffic: {},
			} )
		).toBe( false );
	} );
} );
