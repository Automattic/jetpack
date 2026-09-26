import { EARNINGS_BUCKETS, EARNINGS_TAB_IDS, getEarningsReportTabs, resolveSection } from './tabs';

describe( 'Earnings report tabs', () => {
	it( 'lists the three earnings buckets and defaults to WordAds', () => {
		expect( getEarningsReportTabs() ).toEqual( [
			{ id: 'wordads', label: 'Earnings history' },
			{ id: 'sponsored', label: 'Sponsored content history' },
			{ id: 'adjustments', label: 'Adjustments history' },
		] );
		expect( resolveSection( undefined ) ).toBe( 'wordads' );
		expect( resolveSection( 'missing' ) ).toBe( 'wordads' );
		expect( resolveSection( 'adjustments' ) ).toBe( 'adjustments' );
	} );

	it( 'maps every tab to a payload bucket', () => {
		expect( EARNINGS_TAB_IDS.map( id => EARNINGS_BUCKETS[ id ] ) ).toEqual( [
			'wordads',
			'sponsored',
			'adjustment',
		] );
	} );
} );
