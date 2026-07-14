import { flattenEarningsBreakdown, getEarningsStatus } from '../fields';

describe( 'getEarningsStatus', () => {
	it( 'maps known WordAds statuses to labels', () => {
		expect( getEarningsStatus( 0 ).label ).toBe( 'Unpaid' );
		expect( getEarningsStatus( 1 ).label ).toBe( 'Paid' );
		expect( getEarningsStatus( 2 ).label ).toBe( 'a8c-only' );
		expect( getEarningsStatus( 3 ).label ).toBe( 'Pending (Missing Tax Info)' );
		expect( getEarningsStatus( 4 ).label ).toBe( 'Pending (Invalid PayPal)' );
	} );

	it( 'falls back to "?" for unknown statuses', () => {
		expect( getEarningsStatus( 99 ).label ).toBe( '?' );
	} );

	it( 'carries a tooltip for paid/unpaid', () => {
		expect( getEarningsStatus( 0 ).tooltip ).toContain( 'on hold' );
		expect( getEarningsStatus( 2 ).tooltip ).toBeUndefined();
	} );
} );

describe( 'flattenEarningsBreakdown', () => {
	it( 'returns [] for an absent breakdown', () => {
		expect( flattenEarningsBreakdown( undefined ) ).toEqual( [] );
	} );

	it( 'flattens and sorts newest period first', () => {
		const rows = flattenEarningsBreakdown( {
			'2026-05': { amount: 10, pageviews: 100, status: 1 },
			'2026-07': { amount: 30, pageviews: 300, status: 0 },
			'2026-06': { amount: 20, pageviews: 200, status: 1 },
		} );
		expect( rows.map( r => r.period ) ).toEqual( [ '2026-07', '2026-06', '2026-05' ] );
		expect( rows[ 0 ] ).toEqual( {
			id: '2026-07',
			period: '2026-07',
			amount: 30,
			pageviews: 300,
			status: 0,
		} );
	} );
} );
