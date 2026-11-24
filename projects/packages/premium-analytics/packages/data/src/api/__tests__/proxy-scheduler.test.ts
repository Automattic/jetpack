/**
 * External dependencies
 */
import type apiFetchType from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch' );

type Scheduler = typeof import( '../proxy-scheduler' );

const PROXY = '/jetpack-premium-analytics/v1/proxy';

// The scheduler keeps its queue and the missing-route flag at module scope, so each test loads it fresh.
async function load() {
	jest.resetModules();
	const scheduler: Scheduler = await import( '../proxy-scheduler' );
	const apiFetch = ( await import( '@wordpress/api-fetch' ) ).default as jest.MockedFunction<
		typeof apiFetchType
	>;
	return { scheduler, apiFetch };
}

function failedResponse( status: number, body: unknown ) {
	return { status, json: async () => body };
}

// jsdom implements no Resource Timing entries.
function setProtocol( nextHopProtocol: string ) {
	Object.defineProperty( performance, 'getEntriesByType', {
		configurable: true,
		value: () => [ { nextHopProtocol } ],
	} );
}

describe( 'proxy scheduler', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete ( performance as Partial< Performance > ).getEntriesByType;
	} );

	it.each( [
		[ 'http/1.1', true ],
		[ 'h2', false ],
		[ '', false ],
	] )( 'batches on a %p page: %p', async ( protocol, expected ) => {
		const { scheduler } = await load();
		setProtocol( protocol );

		expect( scheduler.shouldBatchProxyReads() ).toBe( expected );
	} );

	it( 'sends one window of reads as a batch, primary periods first, and settles each with its own item', async () => {
		const { scheduler, apiFetch } = await load();
		apiFetch.mockResolvedValue( [
			{ status: 200, body: { period: 'primary' } },
			{ status: 403, body: { code: 'rest_forbidden' } },
		] );

		const comparison = scheduler.scheduleProxyGet(
			`${ PROXY }/v1.1/stats/visits?c=1`,
			'comparison'
		);
		const primary = scheduler.scheduleProxyGet( `${ PROXY }/v1.1/stats/visits?p=1`, 'primary' );
		jest.runOnlyPendingTimers();

		await expect( primary ).resolves.toEqual( { period: 'primary' } );
		await expect( comparison ).rejects.toEqual( { code: 'rest_forbidden', status: 403 } );
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( apiFetch.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			path: `${ PROXY }/batch`,
			method: 'POST',
			data: { requests: [ '/v1.1/stats/visits?p=1', '/v1.1/stats/visits?c=1' ] },
		} );
	} );

	it( 'falls back to single reads, and stops batching, where the batch route is missing', async () => {
		const { scheduler, apiFetch } = await load();
		setProtocol( 'http/1.1' );
		apiFetch.mockImplementation( async ( { path }: { path?: string } ) => {
			if ( path === `${ PROXY }/batch` ) {
				throw failedResponse( 404, { code: 'rest_no_route' } );
			}
			return { path };
		} );

		const reads = [ 'a', 'b' ].map( name =>
			scheduler.scheduleProxyGet( `${ PROXY }/v1.1/stats/${ name }`, 'primary' )
		);
		jest.runOnlyPendingTimers();

		await expect( Promise.all( reads ) ).resolves.toEqual( [
			{ path: `${ PROXY }/v1.1/stats/a` },
			{ path: `${ PROXY }/v1.1/stats/b` },
		] );
		expect( scheduler.shouldBatchProxyReads() ).toBe( false );
	} );

	it( 'drops a read cancelled while it waits for its batch', async () => {
		const { scheduler, apiFetch } = await load();
		apiFetch.mockResolvedValue( 'kept' );
		const controller = new AbortController();

		const cancelled = scheduler.scheduleProxyGet(
			`${ PROXY }/v1.1/stats/old`,
			'primary',
			controller.signal
		);
		const kept = scheduler.scheduleProxyGet( `${ PROXY }/v1.1/stats/new`, 'primary' );
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
