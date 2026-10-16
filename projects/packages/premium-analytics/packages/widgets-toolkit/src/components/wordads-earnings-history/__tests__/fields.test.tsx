import { filterSortAndPaginate, type View } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSettings, setSettings } from '@wordpress/date';
import { siteSettingsIn } from '../../../__fixtures__/wp-date-settings';
import {
	EarningsStatusBadge,
	flattenEarningsBreakdown,
	formatEarningsPeriod,
	getEarningsStatus,
	getWordAdsHistoryFields,
} from '../fields';

// Captured before any suite installs its own, since this suite shares a module registry with its group.
const BASE_SETTINGS = getSettings();

describe( 'getEarningsStatus', () => {
	it.each( [ 99, undefined ] )( 'falls back to "?" for the status %s', status => {
		expect( getEarningsStatus( status ) ).toMatchObject( { label: '?', intent: 'none' } );
	} );
} );

describe( 'EarningsStatusBadge', () => {
	it( 'is focusable only when there is a tooltip to reach', () => {
		render( <EarningsStatusBadge status={ 0 } /> );
		expect( screen.getByText( 'Unpaid' ) ).toHaveAttribute( 'tabindex', '0' );

		render( <EarningsStatusBadge status={ 2 } /> );
		expect( screen.getByText( 'a8c-only' ) ).not.toHaveAttribute( 'tabindex' );
	} );

	it( 'puts a pending reason in an info button beside a one-word badge', async () => {
		render( <EarningsStatusBadge status={ 3 } /> );

		expect( screen.getByText( 'Pending' ) ).not.toHaveAttribute( 'tabindex' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Missing tax info' } ) );

		await expect(
			screen.findByText( /You can provide tax information in the settings screen/ )
		).resolves.toBeInTheDocument();
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
		[ 'Paid', [ '2025-12' ] ],
		[ 'Unpaid', [ '2026-09' ] ],
		[ 'Pending', [ '2026-03', '2026-04' ] ],
	] )( 'filters to exactly "%s"', ( value, periods ) => {
		const withPending = [
			...rows,
			{ id: '2026-03', period: '2026-03', amount: 1, pageviews: 1, status: 3 },
			{ id: '2026-04', period: '2026-04', amount: 1, pageviews: 1, status: 4 },
		];
		const { data } = filterSortAndPaginate(
			withPending,
			{ ...view, filters: [ { field: 'status', operator: 'is', value } ] } as View,
			fields
		);

		expect( data.map( row => row.period ) ).toEqual( periods );
	} );

	it( 'offers every status but a8c-only in the Status filter, pending once', () => {
		const status = fields.find( field => field.id === 'status' );

		expect( status?.elements?.map( element => element.value ) ).toEqual( [
			'Unpaid',
			'Paid',
			'Pending',
		] );
	} );

	it( 'sorts Ads Served with rows lacking a count last', () => {
		const withMissing = [
			...rows,
			{ id: '2012-03', period: '2012-03', amount: 1, pageviews: undefined, status: 1 },
		];
		const { data } = filterSortAndPaginate(
			withMissing,
			{ ...view, sort: { field: 'pageviews', direction: 'desc' } } as View,
			fields
		);

		expect( data.map( row => row.period ) ).toEqual( [ '2026-09', '2025-12', '2012-03' ] );
	} );

	it( 'sorts periods chronologically, newest first', () => {
		// April sorts last by its label but between the other two by date.
		const withApril = [
			...rows,
			{ id: '2026-04', period: '2026-04', amount: 1, pageviews: 1, status: 1 },
		];
		const { data } = filterSortAndPaginate(
			withApril,
			{ ...view, sort: { field: 'period', direction: 'desc' } } as View,
			fields
		);

		expect( data.map( row => row.period ) ).toEqual( [ '2026-09', '2026-04', '2025-12' ] );
	} );
} );

describe( 'formatEarningsPeriod', () => {
	afterEach( () => setSettings( BASE_SETTINGS ) );

	it( 'keeps the first of the month in its month on a site west of UTC', () => {
		setSettings( siteSettingsIn( 'America/Los_Angeles' ) );

		expect( formatEarningsPeriod( '2026-09' ) ).toBe( 'September 2026' );
	} );
} );
