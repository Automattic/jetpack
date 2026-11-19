/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { registerWooReportMocks, setWooReportMockState } from '../register-woo-report-mocks';
import type { APIFetchMiddleware } from '@wordpress/api-fetch';

const REPORTS = '/jetpack/v4/woocommerce-stats/proxy/v2/analytics/reports';

const FELL_THROUGH = { fellThrough: true };

const fallThroughMiddleware: APIFetchMiddleware = async () => FELL_THROUGH;

// Registered before the mocks so the mock middleware runs ahead of it: `apiFetch.use` puts the
// newest middleware first.
apiFetch.use( fallThroughMiddleware );
registerWooReportMocks();

type ReportRow = Record< string, string | null >;
type OrdersResponse = { data: ReportRow[]; summary: ReportRow };
type ProductsResponse = { data: ReportRow[]; summary: ReportRow };
type ProductDetail = { id: number; permalink: string; images: { src: string; alt: string }[] };
type SessionsResponse = {
	data: { device_type: string | null; active_sessions: string | null }[];
	summary: ReportRow;
};

const ORDERS_NUMERIC_FIELDS = [
	'average_order_value',
	'avg_items',
	'cogs_amount',
	'coupons',
	'orders_no',
	'orders_value_gross',
	'orders_value_net',
	'paid_orders_count',
	'paid_net_sales',
	'product_net_revenue',
	'profit_margin',
	'refunds',
	'total_items',
	'total_sales',
	'unpaid_orders_count',
	'unpaid_net_sales',
];

const request = async < T >( path: string ): Promise< T > =>
	( await apiFetch( { path, parse: false } ) ) as unknown as T;

const DAILY_OCTOBER = `${ REPORTS }/orders/by-date?from=2026-10-01&to=2026-10-30&interval=day`;

it( 'buckets the orders report by the requested interval', async () => {
	const daily = await request< OrdersResponse >( DAILY_OCTOBER );
	const monthly = await request< OrdersResponse >(
		`${ REPORTS }/orders/by-date?from=2026-08-01&to=2026-10-31&interval=month`
	);

	expect( daily.data ).toHaveLength( 30 );
	expect( monthly.data ).toHaveLength( 3 );
	expect( monthly.data[ 0 ].time_interval ).toBe( '2026-08' );
} );

it( 'serves a different period for the comparison window', async () => {
	const primary = await request< OrdersResponse >( DAILY_OCTOBER );
	const comparison = await request< OrdersResponse >(
		`${ REPORTS }/orders/by-date?from=2026-09-01&to=2026-09-30&interval=day`
	);

	expect( comparison.summary.total_items ).not.toBe( primary.summary.total_items );
	expect( Number( comparison.summary.total_items ) ).toBeLessThan(
		Number( primary.summary.total_items )
	);
} );

it( 'repeats a window exactly', async () => {
	const first = await request< OrdersResponse >( DAILY_OCTOBER );
	const second = await request< OrdersResponse >( DAILY_OCTOBER );

	expect( second ).toEqual( first );
} );

it( 'includes a bucket with no orders', async () => {
	const response = await request< OrdersResponse >( DAILY_OCTOBER );
	const empty = response.data.find( row => row.orders_no === '0' );

	expect( empty ).toBeDefined();
	expect( empty?.average_order_value ).toBeNull();
	expect( empty?.avg_items ).toBeNull();
} );

it( 'returns the report shape as strings', async () => {
	// Every numeric field of `summary` is a string, as the live endpoint sends it:
	// the sanitizers parse them, so a number here hides a parsing bug.
	const { summary, data } = await request< OrdersResponse >( DAILY_OCTOBER );
	const withOrders = data.find( row => row.orders_no !== '0' );

	for ( const field of ORDERS_NUMERIC_FIELDS ) {
		expect( typeof summary[ field ] ).toBe( 'string' );
		expect( typeof withOrders?.[ field ] ).toBe( 'string' );
	}
} );

it( 'ranks products by net revenue and honours `limit`', async () => {
	const { data } = await request< ProductsResponse >(
		`${ REPORTS }/products?from=2026-10-01&to=2026-10-30&limit=5`
	);
	const revenues = data.map( row => Number( row.product_net_revenue ) );

	expect( data ).toHaveLength( 5 );
	expect( revenues ).toEqual( [ ...revenues ].sort( ( a, b ) => b - a ) );
	data.forEach( row => expect( typeof row.product_net_revenue ).toBe( 'string' ) );
} );

it( 'ranks the products differently in an earlier window', async () => {
	const october = await request< ProductsResponse >(
		`${ REPORTS }/products?from=2026-10-01&to=2026-10-30&limit=5`
	);
	const september = await request< ProductsResponse >(
		`${ REPORTS }/products?from=2026-09-01&to=2026-09-30&limit=5`
	);
	const ids = ( report: ProductsResponse ) => report.data.map( row => row.product_id );
	const earlier = ids( september );
	const later = ids( october );

	// A leaderboard story needs a previous value to match and one to miss, so the two windows
	// must share some of their top products and differ in the rest.
	expect( later ).not.toEqual( earlier );
	expect( later.filter( id => earlier.includes( id ) ) ).not.toHaveLength( 0 );
	expect( later.filter( id => ! earlier.includes( id ) ) ).not.toHaveLength( 0 );
	expect( Number( september.summary.total_revenue ) ).toBeLessThan(
		Number( october.summary.total_revenue )
	);
} );

it( 'omits one requested product from the details response', async () => {
	// The deleted-product case: fewer products back than ids asked for.
	const products = await request< ProductDetail[] >(
		'/wc/v3/products?include=18%2C19%2C20&per_page=3'
	);

	expect( products ).toHaveLength( 2 );
	expect( products.map( product => product.id ) ).toEqual( [ 18, 19 ] );
	expect( products[ 0 ].images[ 0 ].src ).toBe( 'https://picsum.photos/seed/18/96/96' );
	expect( products[ 0 ].permalink ).toMatch( /^https:\/\// );
} );

it( 'breaks sessions down by device with a row carrying no device', async () => {
	// One row with `device_type: null`, and `summary.active_sessions` exceeding the rows' sum.
	const { data, summary } = await request< SessionsResponse >(
		`${ REPORTS }/sessions/by-device?from=2026-10-01&to=2026-10-30`
	);
	const rowTotal = data.reduce( ( total, row ) => total + Number( row.active_sessions ), 0 );

	expect( data.map( row => row.device_type ) ).toEqual( [ 'Mobile', 'Desktop', 'Tablet', null ] );
	expect( Number( summary.active_sessions ) ).toBeGreaterThan( rowTotal );
	data.forEach( row => expect( typeof row.active_sessions ).toBe( 'string' ) );
} );

it( 'falls through for a path it does not own', async () => {
	await expect( request( '/wp/v2/settings' ) ).resolves.toBe( FELL_THROUGH );
	await expect( request( `${ REPORTS }/coupons` ) ).resolves.toBe( FELL_THROUGH );
} );

describe( 'setWooReportMockState', () => {
	afterEach( () => {
		setWooReportMockState( 'orders/by-date', null );
	} );

	it( 'rejects with a 403 permission envelope for `error`', async () => {
		setWooReportMockState( 'orders/by-date', 'error' );

		await expect( request( DAILY_OCTOBER ) ).rejects.toMatchObject( {
			error: 'unauthorized',
			status: 403,
		} );
	} );

	it( 'rejects with the proxy no_connection shape for `error-retryable`', async () => {
		setWooReportMockState( 'orders/by-date', 'error-retryable' );

		await expect( request( DAILY_OCTOBER ) ).rejects.toMatchObject( {
			code: 'no_connection',
			data: { status: 403 },
		} );
	} );

	it( 'resolves with no rows for `empty`', async () => {
		setWooReportMockState( 'orders/by-date', 'empty' );

		const response = await request< OrdersResponse >( DAILY_OCTOBER );

		expect( response.data ).toEqual( [] );
		expect( response.summary ).toBeDefined();
	} );

	it( 'never settles for `loading`', async () => {
		setWooReportMockState( 'orders/by-date', 'loading' );

		const settled = Symbol( 'settled' );

		await expect(
			Promise.race( [ request( DAILY_OCTOBER ), Promise.resolve( settled ) ] )
		).resolves.toBe( settled );
	} );

	it( 'stops forcing once cleared with null', async () => {
		setWooReportMockState( 'orders/by-date', 'error' );
		await expect( request( DAILY_OCTOBER ) ).rejects.toMatchObject( { status: 403 } );

		setWooReportMockState( 'orders/by-date', null );

		const response = await request< OrdersResponse >( DAILY_OCTOBER );
		expect( response.data ).toHaveLength( 30 );
	} );
} );
