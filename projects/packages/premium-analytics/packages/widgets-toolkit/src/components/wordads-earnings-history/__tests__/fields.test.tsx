import { filterSortAndPaginate, type View } from '@jetpack-premium-analytics/externals';
import { flattenEarningsBreakdown, getEarningsStatus, getWordAdsHistoryFields } from '../fields';

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

describe( 'getWordAdsHistoryFields', () => {
	const rows = [
		{ id: '2025-12', period: '2025-12', amount: 10, pageviews: 100, status: 1 },
		{ id: '2026-09', period: '2026-09', amount: 30, pageviews: 300, status: 0 },
	];
	const fields = getWordAdsHistoryFields();
	const view = {
		type: 'table',
		page: 1,
		perPage: 10,
		fields: fields.map( field => field.id ),
	} as View;

	// The report page enables DataViews search, which matches only fields marked
	// `enableGlobalSearch` — with none marked, every query empties the table.
	it.each( [
		[ 'a year', '2026' ],
		[ 'a raw period key', '2026-09' ],
		[ 'a status label', 'Unpaid' ],
	] )( 'searches %s', ( _label, search ) => {
		const { data } = filterSortAndPaginate( rows, { ...view, search }, fields );

		expect( data.map( row => row.period ) ).toEqual( [ '2026-09' ] );
	} );

	it( 'sorts periods chronologically, newest first', () => {
		const { data } = filterSortAndPaginate(
			rows,
			{ ...view, sort: { field: 'period', direction: 'desc' } } as View,
			fields
		);

		expect( data.map( row => row.period ) ).toEqual( [ '2026-09', '2025-12' ] );
	} );
} );
