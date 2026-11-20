/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { storyReportParams } from '../../story-report-params';
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

const DAY_MS = 24 * 60 * 60 * 1000;

const STORY_PARAMS = storyReportParams( { withComparison: true } ) as Record< string, string >;

type ReportWindow = { from: string; to: string };

// The widgets request the comparison period as a window of its own, taken from `compare_from`
// and `compare_to`, so both windows reach the mock in the same shape.
const PRIMARY_WINDOW: ReportWindow = { from: STORY_PARAMS.from, to: STORY_PARAMS.to };
const COMPARISON_WINDOW: ReportWindow = {
	from: STORY_PARAMS.compare_from,
	to: STORY_PARAMS.compare_to,
};

const daysInWindow = ( { from, to }: ReportWindow ) =>
	Math.floor( ( Date.parse( to ) - Date.parse( from ) ) / DAY_MS ) + 1;

const reportPath = ( endpoint: string, params: Record< string, string > ) =>
	`${ REPORTS }/${ endpoint }?${ new URLSearchParams( params ) }`;

const ordersPath = ( reportWindow: ReportWindow ) =>
	reportPath( 'orders/by-date', { ...reportWindow, interval: STORY_PARAMS.interval } );

const productsPath = ( reportWindow: ReportWindow ) =>
	reportPath( 'products', { ...reportWindow, limit: '5' } );

const PRIMARY_ORDERS = ordersPath( PRIMARY_WINDOW );

it( 'buckets the orders report by the requested interval', async () => {
	const daily = await request< OrdersResponse >( PRIMARY_ORDERS );
	const monthly = await request< OrdersResponse >(
		reportPath( 'orders/by-date', { from: '2026-08-01', to: '2026-10-31', interval: 'month' } )
	);

	expect( daily.data ).toHaveLength( daysInWindow( PRIMARY_WINDOW ) );
	expect( monthly.data ).toHaveLength( 3 );
	expect( monthly.data[ 0 ].time_interval ).toBe( '2026-08' );
} );

it( 'serves a different period for the comparison window', async () => {
	const primary = await request< OrdersResponse >( PRIMARY_ORDERS );
	const comparison = await request< OrdersResponse >( ordersPath( COMPARISON_WINDOW ) );

	expect( comparison.summary.total_items ).not.toBe( primary.summary.total_items );
	expect( Number( comparison.summary.total_items ) ).toBeLessThan(
		Number( primary.summary.total_items )
	);
} );

it( 'repeats a window exactly', async () => {
	const first = await request< OrdersResponse >( PRIMARY_ORDERS );
	const second = await request< OrdersResponse >( PRIMARY_ORDERS );

	expect( second ).toEqual( first );
} );

it( 'includes a bucket with no orders', async () => {
	const response = await request< OrdersResponse >( PRIMARY_ORDERS );
	const empty = response.data.find( row => row.orders_no === '0' );

	expect( empty ).toBeDefined();
	expect( empty?.average_order_value ).toBeNull();
	expect( empty?.avg_items ).toBeNull();
} );

it.each( [
	[ { from: '2026-10-01', to: '2026-10-30', interval: 'month' }, 1, 0 ],
	[ { from: '2026-10-01', to: '2026-10-02', interval: 'day' }, 2, 0 ],
	[ { from: '2026-10-01', to: '2026-10-03', interval: 'day' }, 3, 1 ],
] )(
	'empties a bucket of %o only where the window has room for one',
	async ( params, bucketCount, emptyCount ) => {
		const { data } = await request< OrdersResponse >( reportPath( 'orders/by-date', params ) );

		expect( data ).toHaveLength( bucketCount );
		expect( data.filter( row => row.orders_no === '0' ) ).toHaveLength( emptyCount );
	}
);

it( 'returns the report shape as strings', async () => {
	// Every numeric field of `summary` is a string, as the live endpoint sends it:
	// the sanitizers parse them, so a number here hides a parsing bug.
	const { summary, data } = await request< OrdersResponse >( PRIMARY_ORDERS );
	const withOrders = data.find( row => row.orders_no !== '0' );

	for ( const field of ORDERS_NUMERIC_FIELDS ) {
		expect( typeof summary[ field ] ).toBe( 'string' );
		expect( typeof withOrders?.[ field ] ).toBe( 'string' );
	}
} );

it( 'moves the margin and keeps total sales above net sales', async () => {
	const { data } = await request< OrdersResponse >( PRIMARY_ORDERS );
	const withOrders = data.filter( row => row.orders_no !== '0' );
	const margins = new Set( withOrders.map( row => row.profit_margin ) );

	expect( margins.size ).toBeGreaterThan( 1 );
	withOrders.forEach( row =>
		expect( Number( row.total_sales ) ).toBeGreaterThan( Number( row.orders_value_net ) )
	);
} );

it( 'ranks products by net revenue and honours `limit`', async () => {
	const { data } = await request< ProductsResponse >( productsPath( PRIMARY_WINDOW ) );
	const revenues = data.map( row => Number( row.product_net_revenue ) );

	expect( data ).toHaveLength( 5 );
	expect( revenues ).toEqual( [ ...revenues ].sort( ( a, b ) => b - a ) );
	data.forEach( row => expect( typeof row.product_net_revenue ).toBe( 'string' ) );
} );

it( 'ranks the products differently in an earlier window', async () => {
	const primary = await request< ProductsResponse >( productsPath( PRIMARY_WINDOW ) );
	const comparison = await request< ProductsResponse >( productsPath( COMPARISON_WINDOW ) );
	const ids = ( report: ProductsResponse ) => report.data.map( row => row.product_id );
	const earlier = ids( comparison );
	const later = ids( primary );

	// A leaderboard story needs a previous value to match and one to miss, so the two windows
	// must share some of their top products and differ in the rest.
	expect( later ).not.toEqual( earlier );
	expect( later.filter( id => earlier.includes( id ) ) ).not.toHaveLength( 0 );
	expect( later.filter( id => ! earlier.includes( id ) ) ).not.toHaveLength( 0 );
	expect( Number( comparison.summary.total_revenue ) ).toBeLessThan(
		Number( primary.summary.total_revenue )
	);
} );

it( 'omits one requested product from the details response', async () => {
	// The deleted-product case: fewer products back than ids asked for.
	const products = await request< ProductDetail[] >(
		'/wc/v3/products?include=18%2C19%2C20&per_page=3'
	);

	expect( products ).toHaveLength( 2 );
	// The gap falls in the middle of the ranking, not at the end of the list.
	expect( products.map( product => product.id ) ).toEqual( [ 18, 20 ] );
	expect( products[ 0 ].images[ 0 ].src ).toBe( 'https://picsum.photos/seed/18/96/96' );
	expect( products[ 0 ].permalink ).toMatch( /^https:\/\// );
} );

it( 'answers a single-product request in full', async () => {
	const products = await request< ProductDetail[] >( '/wc/v3/products?include=18&per_page=1' );

	expect( products.map( product => product.id ) ).toEqual( [ 18 ] );
} );

it( 'breaks sessions down by device with a row carrying no device', async () => {
	// One row with `device_type: null`, and `summary.active_sessions` exceeding the rows' sum.
	const { data, summary } = await request< SessionsResponse >(
		reportPath( 'sessions/by-device', PRIMARY_WINDOW )
	);
	const rowTotal = data.reduce( ( total, row ) => total + Number( row.active_sessions ), 0 );

	expect( data.map( row => row.device_type ) ).toEqual( [ 'Mobile', 'Desktop', 'Tablet', null ] );
	expect( Number( summary.active_sessions ) ).toBeGreaterThan( rowTotal );
	data.forEach( row => expect( typeof row.active_sessions ).toBe( 'string' ) );
} );

it( 'states no sessions at all when every device row is zero', async () => {
	const { data, summary } = await request< SessionsResponse >(
		reportPath( 'sessions/by-device', { from: '2026-10-30', to: '2026-10-01' } )
	);

	expect( data.map( row => row.active_sessions ) ).toEqual( [ '0', '0', '0', '0' ] );
	expect( summary.active_sessions ).toBe( '0' );
} );

it( 'falls through for a path it does not own', async () => {
	await expect( request( '/wp/v2/settings' ) ).resolves.toBe( FELL_THROUGH );
	await expect( request( `${ REPORTS }/coupons` ) ).resolves.toBe( FELL_THROUGH );
} );

describe( 'setWooReportMockState', () => {
	afterEach( () => {
		setWooReportMockState( 'orders/by-date', null );
		setWooReportMockState( 'products', null );
	} );

	it( 'rejects with a 403 permission envelope for `error`', async () => {
		setWooReportMockState( 'orders/by-date', 'error' );

		await expect( request( PRIMARY_ORDERS ) ).rejects.toMatchObject( {
			error: 'unauthorized',
			status: 403,
		} );
	} );

	it( 'rejects with the proxy no_connection shape for `error-retryable`', async () => {
		setWooReportMockState( 'orders/by-date', 'error-retryable' );

		await expect( request( PRIMARY_ORDERS ) ).rejects.toMatchObject( {
			code: 'no_connection',
			data: { status: 403 },
		} );
	} );

	it( 'resolves with no rows for `empty`', async () => {
		setWooReportMockState( 'orders/by-date', 'empty' );

		const response = await request< OrdersResponse >( PRIMARY_ORDERS );

		expect( response.data ).toEqual( [] );
		expect( response.summary ).toBeDefined();
	} );

	it( 'resolves with an empty collection for a store endpoint', async () => {
		// A story forcing `products` catches `/wc/v3/products` too, which reads an array.
		setWooReportMockState( 'products', 'empty' );

		await expect( request( '/wc/v3/products?include=18' ) ).resolves.toEqual( [] );
	} );

	it( 'never settles for `loading`', async () => {
		setWooReportMockState( 'orders/by-date', 'loading' );

		const settled = Symbol( 'settled' );

		await expect(
			Promise.race( [ request( PRIMARY_ORDERS ), Promise.resolve( settled ) ] )
		).resolves.toBe( settled );
	} );

	it( 'stops forcing once cleared with null', async () => {
		setWooReportMockState( 'orders/by-date', 'error' );
		await expect( request( PRIMARY_ORDERS ) ).rejects.toMatchObject( { status: 403 } );

		setWooReportMockState( 'orders/by-date', null );

		const response = await request< OrdersResponse >( PRIMARY_ORDERS );
		expect( response.data ).toHaveLength( daysInWindow( PRIMARY_WINDOW ) );
	} );
} );
