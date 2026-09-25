import { getReportLocationsTabs, resolveSection, supportsCountryFilter } from './tabs';
import type { ReportLocationsTabId } from './tabs';

describe( 'Locations report tabs', () => {
	it( 'matches the widget granularity order and defaults to Countries', () => {
		expect( getReportLocationsTabs() ).toEqual( [
			{ id: 'countries', label: 'Countries' },
			{ id: 'regions', label: 'Regions' },
			{ id: 'cities', label: 'Cities' },
		] );
		expect( resolveSection( undefined ) ).toBe( 'countries' );
		expect( resolveSection( 'missing' ) ).toBe( 'countries' );
	} );

	// The Countries tab is already the whole country list, so scoping it to one
	// country would leave a single row.
	it.each( [
		[ 'countries', false ],
		[ 'regions', true ],
		[ 'cities', true ],
	] as const )( 'reports country-filter support for %s as %s', ( tab, expected ) => {
		expect( supportsCountryFilter( tab as ReportLocationsTabId ) ).toBe( expected );
	} );
} );
