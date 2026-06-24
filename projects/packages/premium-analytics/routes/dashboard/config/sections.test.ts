import { __ } from '@wordpress/i18n';
import {
	DASHBOARD_SECTION_IDS,
	DEFAULT_SECTION_ID,
	getDashboardSections,
	resolveSectionId,
} from './sections';

jest.mock( '@wordpress/i18n', () => ( {
	__: jest.fn( ( text: string ) => text ),
} ) );

describe( 'dashboard sections', () => {
	it( 'builds the ordered section definitions', () => {
		expect( getDashboardSections() ).toEqual( [
			{ id: 'traffic', label: 'Traffic' },
			{ id: 'insights', label: 'Insights' },
			{ id: 'subscribers', label: 'Subscribers' },
			{ id: 'store', label: 'Store' },
		] );

		expect( __ ).toHaveBeenCalledWith( 'Traffic', 'jetpack-premium-analytics' );
	} );

	it( 'keeps the default section first', () => {
		expect( DEFAULT_SECTION_ID ).toBe( 'traffic' );
		expect( DASHBOARD_SECTION_IDS[ 0 ] ).toBe( DEFAULT_SECTION_ID );
	} );

	it( 'resolves unknown section search values to the default section', () => {
		expect( resolveSectionId( 'insights' ) ).toBe( 'insights' );
		expect( resolveSectionId( 'missing' ) ).toBe( DEFAULT_SECTION_ID );
		expect( resolveSectionId( undefined ) ).toBe( DEFAULT_SECTION_ID );
	} );
} );
