import { getReportLocationsTabs, resolveSection } from './tabs';

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
} );
