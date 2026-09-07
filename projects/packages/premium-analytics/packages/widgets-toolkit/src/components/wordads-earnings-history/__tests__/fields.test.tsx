import { flattenEarningsBreakdown, getEarningsStatus } from '../fields';

describe( 'getEarningsStatus', () => {
	it( 'maps known WordAds statuses to labels', () => {
		expect( getEarningsStatus( 0 ).label ).toBe( 'Unpaid' );
		expect( getEarningsStatus( 1 ).label ).toBe( 'Paid' );
		expect( getEarningsStatus( 2 ).label ).toBe( 'a8c-only' );
		expect( getEarningsStatus( 3 ).label ).toBe( 'Pending (Missing Tax Info)' );
		expect( getEarningsStatus( 4 ).label ).toBe( 'Pending (Invalid PayPal)' );
	} );

	it( 'falls back to "?" for unknown or absent statuses', () => {
		expect( getEarningsStatus( 99 ).label ).toBe( '?' );
		expect( getEarningsStatus( undefined ).label ).toBe( '?' );
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

	// Row order is the view's job, not this function's — the widget test covers
	// the rendered newest-first order.
	it( 'flattens each period into a row keyed by the period', () => {
		const rows = flattenEarningsBreakdown( {
			'2026-05': { amount: 10, pageviews: 100, status: 1 },
			'2026-07': { amount: 30, pageviews: 300, status: 0 },
		} );

		expect( rows ).toEqual( [
			{ id: '2026-05', period: '2026-05', amount: 10, pageviews: 100, status: 1 },
			{ id: '2026-07', period: '2026-07', amount: 30, pageviews: 300, status: 0 },
		] );
	} );

	it( 'preserves an absent status rather than defaulting it', () => {
		const rows = flattenEarningsBreakdown( {
			'2026-07': { amount: 30, pageviews: 300, status: undefined },
		} );

		expect( rows[ 0 ].status ).toBeUndefined();
	} );
} );
