/**
 * External dependencies
 */
import type apiFetchType from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

type Scheduler = typeof import( '../proxy-scheduler' );
type ProxyFetch = typeof import( '../stats-proxy-fetch' );

const PROXY = '/jetpack-premium-analytics/v1/proxy';

// The scheduler keeps its queue and the missing-route flag at module scope, so each test loads it fresh.
async function load() {
	jest.resetModules();
	const scheduler: Scheduler = await import( '../proxy-scheduler' );
	const proxyFetch: ProxyFetch = await import( '../stats-proxy-fetch' );
	const apiFetch = ( await import( '@wordpress/api-fetch' ) ).default as jest.MockedFunction<
		typeof apiFetchType
	>;
	return { scheduler, proxyFetch, apiFetch };
}

function failedResponse( status: number, body: unknown ) {
	return { status, json: async () => body };
}

function setServer( proxyBatch: boolean | undefined ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: { premium_analytics: { proxy_batch: proxyBatch } },
	} );
}

function batchPaths( apiFetch: jest.MockedFunction< typeof apiFetchType > ) {
	return apiFetch.mock.calls
		.map( ( [ options ] ) => options )
		.filter( options => options.path === `${ PROXY }/batch` )
		.map( options => ( options.data as { requests: string[] } ).requests );
}

describe( 'proxy scheduler', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		setServer( true );
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ true, true ],
		[ false, false ],
		[ undefined, false ],
	] )( 'batches where the server reports proxy_batch %p: %p', async ( proxyBatch, expected ) => {
		const { scheduler } = await load();
		setServer( proxyBatch );

		expect( scheduler.shouldBatchProxyReads() ).toBe( expected );
	} );

	it( 'sends the reads fetchStatsProxy is given in one window as a batch, settling each with its own item', async () => {
		const { proxyFetch, apiFetch } = await load();
		apiFetch.mockResolvedValue( [
			{ status: 200, body: { views: 1 } },
			{ status: 403, body: { code: 'rest_forbidden' } },
		] );

		const visits = proxyFetch.fetchStatsProxy( { version: '1.1', endpoint: 'stats/visits' } );
		const posts = proxyFetch.fetchStatsProxy( { version: '1.1', endpoint: 'stats/top-posts' } );
		jest.runOnlyPendingTimers();

		await expect( visits ).resolves.toEqual( { views: 1 } );
		await expect( posts ).rejects.toEqual( { code: 'rest_forbidden', status: 403 } );
		expect( batchPaths( apiFetch ) ).toEqual( [
			[ '/v1.1/stats/visits', '/v1.1/stats/top-posts' ],
		] );
	} );

	it( "sends a widget's two periods in one batch, even past the batch size", async () => {
		const { scheduler, apiFetch } = await load();
		apiFetch.mockImplementation( ( async ( { data }: { data?: { requests: string[] } } ) =>
			data?.requests.map( () => ( { status: 200, body: 'ok' } ) ) ) as typeof apiFetchType );

		// The pair arrives as the tenth and eleventh reads, so a plain cut at ten would split it.
		Array.from( { length: 9 }, ( _, i ) =>
			scheduler.scheduleProxyGet( `${ PROXY }/v1.1/stats/r${ i }`, `widget-${ i }` )
		);
		scheduler.scheduleProxyGet( `${ PROXY }/v1.1/stats/chart?p=1`, 'chart' );
		const comparison = scheduler.scheduleProxyGet( `${ PROXY }/v1.1/stats/chart?c=1`, 'chart' );
		jest.runOnlyPendingTimers();

		await expect( comparison ).resolves.toBe( 'ok' );
		const [ first ] = batchPaths( apiFetch );
		expect( first ).toHaveLength( 11 );
		expect( first ).toEqual(
			expect.arrayContaining( [ '/v1.1/stats/chart?p=1', '/v1.1/stats/chart?c=1' ] )
		);
	} );

	it( 'falls back to single reads, and sends no more batches, where the batch route is missing', async () => {
		const { scheduler, apiFetch } = await load();
		apiFetch.mockImplementation( ( async ( { path }: { path?: string } ) => {
			if ( path === `${ PROXY }/batch` ) {
				throw failedResponse( 404, { code: 'rest_no_route' } );
			}
			return { path };
		} ) as typeof apiFetchType );

		// More reads than four batches of ten, so some are still queued when the 404 lands.
		const reads = Array.from( { length: 45 }, ( _, i ) =>
			scheduler.scheduleProxyGet( `${ PROXY }/v1.1/stats/r${ i }`, undefined )
		);
		jest.runOnlyPendingTimers();

		await expect( Promise.all( reads ) ).resolves.toHaveLength( 45 );
		expect( batchPaths( apiFetch ) ).toHaveLength( 4 );
		expect( scheduler.shouldBatchProxyReads() ).toBe( false );
	} );

	it( 'drops a read cancelled while it waits for its batch', async () => {
		const { scheduler, apiFetch } = await load();
		apiFetch.mockResolvedValue( 'kept' );
		const controller = new AbortController();

		const cancelled = scheduler.scheduleProxyGet(
			`${ PROXY }/v1.1/stats/old`,
			undefined,
			controller.signal
		);
		const kept = scheduler.scheduleProxyGet( `${ PROXY }/v1.1/stats/new`, undefined );
		controller.abort();
		jest.runOnlyPendingTimers();

		await expect( cancelled ).rejects.toMatchObject( { name: 'AbortError' } );
		await expect( kept ).resolves.toBe( 'kept' );
		// One read left, so it goes out on its own rather than as a batch of one.
		expect( apiFetch.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			path: `${ PROXY }/v1.1/stats/new`,
			method: 'GET',
		} );
	} );
} );
