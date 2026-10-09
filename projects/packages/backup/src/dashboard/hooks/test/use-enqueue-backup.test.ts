import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { keys } from '../../data/query-client';
import { useBackups } from '../use-backups';
import {
	REQUEST_CEILING_MS,
	useBackupRequested,
	useEnqueueBackup,
	useEnqueueFailure,
} from '../use-enqueue-backup';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

/**
 * Fresh client per test, with retries off so a failure assertion doesn't
 * wait out react-query's backoff.
 *
 * @return A wrapper providing an isolated QueryClient.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { client, wrapper };
}

/**
 * The button's controls, plus the failure the notice outside the header reads.
 *
 * @return Both hooks' results.
 */
function useEnqueueAndFailure() {
	return { ...useEnqueueBackup(), failure: useEnqueueFailure() };
}

beforeEach( () => {
	mockedApiFetch.mockReset();
	window.JP_CONNECTION_INITIAL_STATE = {
		...window.JP_CONNECTION_INITIAL_STATE,
		connectionStatus: { isRegistered: true, hasConnectedOwner: true, isUserConnected: true },
	} as typeof window.JP_CONNECTION_INITIAL_STATE;
} );

describe( 'useEnqueueBackup', () => {
	it( 'reports success when WPCOM accepts the request', async () => {
		mockedApiFetch.mockResolvedValue( { success: true } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useEnqueueBackup(), { wrapper } );
		act( () => result.current.enqueue() );

		await waitFor( () => expect( result.current.state ).toBe( 'enqueued' ) );
		expect( mockedApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: '/jetpack/v4/site/backup/enqueue', method: 'POST' } )
		);
	} );

	// `enqueue_backup()` returns bare `null` for a WPCOM reply it cannot
	// decode, which WordPress serves as HTTP 200 — so the request
	// resolves and nothing throws. The legacy button discards the body,
	// so it still reports "Backup enqueued" and then polls for a backup
	// that was never queued.
	it( 'reports a null body as a failure, not a success', async () => {
		mockedApiFetch.mockResolvedValue( null );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( useEnqueueAndFailure, { wrapper } );
		act( () => result.current.enqueue() );

		await waitFor( () => expect( result.current.state ).toBe( 'error' ) );
		expect( result.current.failure?.message ).toBe( 'Could not start a backup. Please try again.' );
	} );

	it( 'surfaces the reason when WPCOM refuses inside a 200', async () => {
		mockedApiFetch.mockResolvedValue( { success: false, error: 'Backups are not enabled.' } );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( useEnqueueAndFailure, { wrapper } );
		act( () => result.current.enqueue() );

		await waitFor( () => expect( result.current.state ).toBe( 'error' ) );
		expect( result.current.failure?.message ).toBe( 'Backups are not enabled.' );
	} );

	it( 'reports a rejected request as a failure', async () => {
		mockedApiFetch.mockRejectedValue( {
			code: 'rest_forbidden',
			message: 'Sorry, you are not allowed.',
		} );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( useEnqueueAndFailure, { wrapper } );
		act( () => result.current.enqueue() );

		await waitFor( () => expect( result.current.state ).toBe( 'error' ) );
		expect( result.current.failure?.message ).toBe( 'Sorry, you are not allowed.' );
	} );

	it( 'invalidates the backups query so the list starts reflecting the new backup', async () => {
		mockedApiFetch.mockResolvedValue( { success: true } );
		const { client, wrapper } = makeWrapper();
		const invalidate = jest.spyOn( client, 'invalidateQueries' );

		const { result } = renderHook( () => useEnqueueBackup(), { wrapper } );
		act( () => result.current.enqueue() );

		await waitFor( () => expect( result.current.state ).toBe( 'enqueued' ) );
		expect( invalidate ).toHaveBeenCalledWith( { queryKey: [ 'backup', 'backups' ] } );
	} );

	it( 'goes back to idle on reset, so the button can be tried again', async () => {
		mockedApiFetch.mockResolvedValue( null );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( useEnqueueAndFailure, { wrapper } );
		act( () => result.current.enqueue() );
		await waitFor( () => expect( result.current.state ).toBe( 'error' ) );

		act( () => result.current.reset() );

		await waitFor( () => expect( result.current.state ).toBe( 'idle' ) );
		await waitFor( () => expect( result.current.failure ).toBeNull() );
	} );

	// Download and Restore have no button, so a failure kept past it greets the return trip.
	it( 'forgets the failure once the button unmounts', async () => {
		mockedApiFetch.mockResolvedValue( null );
		const { wrapper } = makeWrapper();
		const { result: button, unmount } = renderHook( () => useEnqueueBackup(), { wrapper } );
		const { result: notice } = renderHook( () => useEnqueueFailure(), { wrapper } );

		act( () => button.current.enqueue() );
		await waitFor( () => expect( notice.current ).not.toBeNull() );

		unmount();

		await waitFor( () => expect( notice.current ).toBeNull() );
	} );
} );

const finished = ( id: number ) => ( {
	id,
	started: '2026-10-06 10:00:00',
	last_updated: '2026-10-06 10:05:00',
	status: 'finished',
	period: 1,
	percent: 100,
	is_backup: 1,
	is_scan: 0,
} );

/**
 * Answer the backups read from a mutable list, and accept every enqueue.
 *
 * @param server         - Holder of the list the next backups read returns.
 * @param server.backups - Raw entries, newest first.
 */
function serve( server: { backups: unknown[] } ) {
	mockedApiFetch.mockImplementation( ( { path }: { path: string } ) =>
		Promise.resolve( path.endsWith( '/backups' ) ? server.backups : { success: true } )
	);
}

/**
 * Hook pair for the click flow.
 *
 * @return The requested flag and the enqueue controls.
 */
function useClickFlow() {
	return { requested: useBackupRequested(), enqueue: useEnqueueBackup() };
}

describe( 'useBackupRequested', () => {
	it( 'is true from the click until reset, and false after a failure', async () => {
		const server = { backups: [ finished( 1 ) ] };
		serve( server );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( useClickFlow, { wrapper } );
		expect( result.current.requested ).toBe( false );

		act( () => result.current.enqueue.enqueue() );
		await waitFor( () => expect( result.current.enqueue.state ).toBe( 'enqueued' ) );
		expect( result.current.requested ).toBe( true );

		act( () => result.current.enqueue.reset() );
		await waitFor( () => expect( result.current.requested ).toBe( false ) );

		mockedApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			path.endsWith( '/backups' )
				? Promise.resolve( server.backups )
				: Promise.reject( new Error( 'nope' ) )
		);
		act( () => result.current.enqueue.enqueue() );
		await waitFor( () => expect( result.current.enqueue.state ).toBe( 'error' ) );
		await waitFor( () => expect( result.current.requested ).toBe( false ) );
	} );

	// A short backup can finish between two polls, so the read goes from one
	// `complete` straight to another and never shows `in-progress`.
	it( 'ends when a newer backup appears, even one that is already finished', async () => {
		const server = { backups: [ finished( 1 ) ] };
		serve( server );
		const { client, wrapper } = makeWrapper();
		const { result } = renderHook( useClickFlow, { wrapper } );

		act( () => result.current.enqueue.enqueue() );
		await waitFor( () => expect( result.current.requested ).toBe( true ) );
		await waitFor( () => expect( result.current.enqueue.state ).toBe( 'enqueued' ) );

		act( () => client.setQueryData( keys.backups(), [ finished( 2 ), finished( 1 ) ] ) );
		await waitFor( () => expect( result.current.requested ).toBe( false ) );
	} );

	// A scheduled backup finished after the cached read. Its record is newer than
	// the stale cache but older than the click, so it must not end the request.
	it( 'is not ended by a backup that finished before the click', async () => {
		const server = { backups: [ finished( 2 ), finished( 1 ) ] };
		serve( server );
		const { client, wrapper } = makeWrapper();
		client.setQueryData( keys.backups(), [ finished( 1 ) ] );
		// `useBackups` is mounted so the post-enqueue invalidation really refetches.
		const { result } = renderHook( () => ( { flow: useClickFlow(), backups: useBackups() } ), {
			wrapper,
		} );

		act( () => result.current.flow.enqueue.enqueue() );
		await waitFor( () => expect( result.current.flow.enqueue.state ).toBe( 'enqueued' ) );
		await waitFor( () => expect( result.current.backups.backups[ 0 ].id ).toBe( '2' ) );
		expect( result.current.flow.requested ).toBe( true );

		act( () =>
			client.setQueryData( keys.backups(), [ finished( 3 ), finished( 2 ), finished( 1 ) ] )
		);
		await waitFor( () => expect( result.current.flow.requested ).toBe( false ) );
	} );

	// With nothing cached the baseline is unknown, and the first read must not
	// be mistaken for a newer backup.
	it( 'is not ended by the first read when the click came before it', async () => {
		const server = { backups: [ finished( 1 ) ] };
		serve( server );
		const { client, wrapper } = makeWrapper();
		const { result } = renderHook( useClickFlow, { wrapper } );

		act( () => result.current.enqueue.enqueue() );
		await waitFor( () => expect( result.current.enqueue.state ).toBe( 'enqueued' ) );
		expect( client.getQueryData( keys.backups() ) ).toEqual( [ finished( 1 ) ] );
		expect( result.current.requested ).toBe( true );
	} );

	// A `null` read (the route's answer to a WPCOM blip) overwrites the cache, so
	// the baseline must come from before it; with no cache the request stays pending.
	it.each( [
		[ 'keeps the cached baseline', [ finished( 1 ) ], true, '1' ],
		[ 'stays pending with no cache', undefined, false, null ],
	] )( 'on a null fresh read %s', async ( _name, cached, ready, id ) => {
		mockedApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve( path.endsWith( '/backups' ) ? null : { success: true } )
		);
		const { client, wrapper } = makeWrapper();
		if ( cached ) {
			client.setQueryData( keys.backups(), cached );
		}
		const { result } = renderHook( useClickFlow, { wrapper } );

		act( () => result.current.enqueue.enqueue() );
		await waitFor( () => expect( result.current.enqueue.state ).toBe( 'enqueued' ) );

		expect( result.current.requested ).toBe( true );
		await waitFor( () =>
			expect( client.getQueryData( keys.enqueueRequested() ) ).toMatchObject( {
				baselineReady: ready,
				baselineId: id,
			} )
		);
	} );

	describe( 'without the button', () => {
		beforeEach( () => jest.useFakeTimers() );
		afterEach( () => jest.useRealTimers() );

		it( 'keeps the backups read polling while the flag is set', async () => {
			serve( { backups: [ finished( 1 ) ] } );
			const { client, wrapper } = makeWrapper();
			client.setQueryData( keys.enqueueRequested(), {
				clickedAt: Date.now(),
				baselineReady: true,
				baselineId: '1',
			} );
			renderHook( () => useBackups(), { wrapper } );
			const reads = () =>
				mockedApiFetch.mock.calls.filter( ( [ { path } ] ) => path.endsWith( '/backups' ) ).length;
			await waitFor( () => expect( reads() ).toBeGreaterThan( 0 ) );
			const before = reads();

			await act( async () => {
				await jest.advanceTimersByTimeAsync( 11_000 );
			} );

			expect( reads() ).toBeGreaterThan( before );
		} );

		it( 'gives up once WPCOM has reported nothing for the ceiling', async () => {
			serve( { backups: [ finished( 1 ) ] } );
			const { client, wrapper } = makeWrapper();
			client.setQueryData( keys.enqueueRequested(), {
				clickedAt: Date.now(),
				baselineReady: true,
				baselineId: '1',
			} );
			const { result } = renderHook( () => useBackupRequested(), { wrapper } );
			expect( result.current ).toBe( true );

			await act( async () => {
				await jest.advanceTimersByTimeAsync( REQUEST_CEILING_MS + 1 );
			} );

			expect( result.current ).toBe( false );
		} );
	} );
} );
