import { filterSortAndPaginate, type View } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import {
	EarningsStatusBadge,
	flattenEarningsBreakdown,
	getEarningsStatus,
	getWordAdsHistoryFields,
} from '../fields';

describe( 'getEarningsStatus', () => {
	it( 'maps known WordAds statuses to labels', () => {
		expect( getEarningsStatus( 0 ).label ).toBe( 'Unpaid' );
		expect( getEarningsStatus( 1 ).label ).toBe( 'Paid' );
		expect( getEarningsStatus( 2 ).label ).toBe( 'a8c-only' );
		expect( getEarningsStatus( 3 ).label ).toBe( 'Pending' );
		expect( getEarningsStatus( 4 ).label ).toBe( 'Pending' );
	} );

	it( 'keeps the pending reason beside the label, not in it', () => {
		expect( getEarningsStatus( 3 ).detail ).toBe( 'Missing tax info' );
		expect( getEarningsStatus( 4 ).detail ).toBe( 'Invalid PayPal' );
		expect( getEarningsStatus( 0 ).detail ).toBeUndefined();
	} );

	it( 'falls back to "?" for unknown or absent statuses', () => {
		expect( getEarningsStatus( 99 ).label ).toBe( '?' );
		expect( getEarningsStatus( undefined ).label ).toBe( '?' );
	} );

	it( 'carries a tooltip for paid/unpaid', () => {
		expect( getEarningsStatus( 0 ).tooltip ).toContain( 'on hold' );
		expect( getEarningsStatus( 2 ).tooltip ).toBeUndefined();
	} );

	it.each( [
		[ 0, 'high' ],
		[ 1, 'stable' ],
		[ 2, 'draft' ],
		[ 3, 'medium' ],
		[ 4, 'medium' ],
		[ 99, 'none' ],
		[ undefined, 'none' ],
	] )( 'gives status %s the %s badge intent', ( status, intent ) => {
		expect( getEarningsStatus( status ).intent ).toBe( intent );
	} );
} );

describe( 'EarningsStatusBadge', () => {
	it( 'is focusable only when there is a tooltip to reach', () => {
		render( <EarningsStatusBadge status={ 0 } /> );
		expect( screen.getByText( 'Unpaid' ) ).toHaveAttribute( 'tabindex', '0' );

		render( <EarningsStatusBadge status={ 2 } /> );
		expect( screen.getByText( 'a8c-only' ) ).not.toHaveAttribute( 'tabindex' );
	} );

	it( 'puts a pending reason in an info button beside a one-word badge', () => {
		render( <EarningsStatusBadge status={ 3 } /> );

		expect( screen.getByText( 'Pending' ) ).not.toHaveAttribute( 'tabindex' );
		expect( screen.getByRole( 'button', { name: 'Missing tax info' } ) ).toBeInTheDocument();
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
	] )( 'searches %s', ( _label, search ) => {
		const { data } = filterSortAndPaginate( rows, { ...view, search }, fields );

		expect( data.map( row => row.period ) ).toEqual( [ '2026-09' ] );
	} );

	it( 'does not search status labels', () => {
		const { data } = filterSortAndPaginate( rows, { ...view, search: 'Paid' }, fields );

		expect( data ).toEqual( [] );
	} );

	it.each( [
		[ 'Paid', '2025-12' ],
		[ 'Unpaid', '2026-09' ],
	] )( 'filters to exactly "%s"', ( value, period ) => {
		const { data } = filterSortAndPaginate(
			rows,
			{ ...view, filters: [ { field: 'status', operator: 'is', value } ] } as View,
			fields
		);

		expect( data.map( row => row.period ) ).toEqual( [ period ] );
	} );

	it( 'offers every status but a8c-only in the Status filter, pending once', () => {
		const status = fields.find( field => field.id === 'status' );

		expect( status?.elements?.map( element => element.value ) ).toEqual( [
			'Unpaid',
			'Paid',
			'Pending',
		] );
	} );

	it( 'filters "Pending" to both pending codes', () => {
		const pending = [
			...rows,
			{ id: '2026-03', period: '2026-03', amount: 1, pageviews: 1, status: 3 },
			{ id: '2026-04', period: '2026-04', amount: 1, pageviews: 1, status: 4 },
		];
		const { data } = filterSortAndPaginate(
			pending,
			{ ...view, filters: [ { field: 'status', operator: 'is', value: 'Pending' } ] } as View,
			fields
		);

		expect( data.map( row => row.period ) ).toEqual( [ '2026-03', '2026-04' ] );
	} );

	it.each( [
		[ 'asc', [ '2025-12', '2026-09', '2012-03' ] ],
		[ 'desc', [ '2026-09', '2025-12', '2012-03' ] ],
	] as const )( 'sorts Ads Served %s with rows lacking a count last', ( direction, periods ) => {
		const withMissing = [
			...rows,
			{ id: '2012-03', period: '2012-03', amount: 1, pageviews: undefined, status: 1 },
		];
		const { data } = filterSortAndPaginate(
			withMissing,
			{ ...view, sort: { field: 'pageviews', direction } } as View,
			fields
		);

		expect( data.map( row => row.period ) ).toEqual( periods );
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
