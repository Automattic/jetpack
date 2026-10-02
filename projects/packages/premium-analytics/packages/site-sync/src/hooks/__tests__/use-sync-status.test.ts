/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { renderHook, act, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { fetchSyncStatus } from '../../api/fetch-sync-status';
import { triggerFullSync } from '../../api/trigger-full-sync';
import { POLL_INTERVAL, MAX_POLL_FAILURES } from '../../constants';
import { useSyncStatus } from '../use-sync-status';
import type { SyncStatusApiResponse } from '../../types';

jest.mock( '../../api/fetch-sync-status' );
jest.mock( '../../api/trigger-full-sync' );
jest.mock( '@automattic/jetpack-script-data' );

const mockFetch = fetchSyncStatus as jest.MockedFunction< typeof fetchSyncStatus >;
const mockTrigger = triggerFullSync as jest.MockedFunction< typeof triggerFullSync >;
const mockScriptData = getScriptData as jest.MockedFunction< typeof getScriptData >;

/**
 * Build a raw sync-status API response for tests.
 *
 * @param overrides - Fields to override on the default running-analytics response.
 * @return A raw sync-status API response.
 */
function rawStatus( overrides: Partial< SyncStatusApiResponse > = {} ): SyncStatusApiResponse {
	return {
		started: true,
		finished: false,
		progress: { woocommerce_analytics: { sent: 1, total: 2 } },
		...overrides,
	};
}

beforeEach( () => {
	jest.useFakeTimers();
	// Default: store site (WooCommerce active), milestone not set.
	mockScriptData.mockReturnValue( {
		premium_analytics: { initial_full_sync_finished: 0 },
	} as ReturnType< typeof getScriptData > );
	mockFetch.mockResolvedValue( rawStatus() );
	mockTrigger.mockResolvedValue( undefined );
} );

afterEach( () => {
	jest.clearAllTimers();
	jest.useRealTimers();
	jest.clearAllMocks();
} );

describe( 'useSyncStatus', () => {
	it( 'exposes normalized progress after the first poll', async () => {
		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.data ).toBeDefined() );
		expect( result.current.data?.percentage ).toBe( 50 );
		expect( result.current.data?.isRunning ).toBe( true );
		expect( result.current.error ).toBeNull();
	} );

	it( 'reports complete and stops polling when analytics reaches 100', async () => {
		mockFetch.mockResolvedValue(
			rawStatus( {
				finished: true,
				progress: { woocommerce_analytics: { sent: 2, total: 2 } },
				initial_full_sync_finished: 1_700_000_000,
			} )
		);
		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.isComplete ).toBe( true ) );
		const callsAfterComplete = mockFetch.mock.calls.length;

		await act( async () => {
			jest.advanceTimersByTime( 10_000 );
		} );
		expect( mockFetch.mock.calls ).toHaveLength( callsAfterComplete );
	} );

	it( 'flags a stalled sync with an error', async () => {
		mockFetch.mockResolvedValue(
			rawStatus( {
				started: true,
				finished: true,
				progress: { woocommerce_analytics: { sent: 1, total: 2 } },
			} )
		);
		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () =>
			expect( result.current.error?.message ).toBe( 'Sync has stalled. Please try again.' )
		);
	} );

	it( 'resumes polling after a trigger error, and clears it once the sync shows up', async () => {
		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.data ).toBeDefined() );
		mockTrigger.mockRejectedValueOnce( new Error( 'nope' ) );
		await act( async () => {
			await result.current.triggerSync();
		} );
		expect( result.current.error?.message ).toBe( 'nope' );
		const callsAfterFailure = mockFetch.mock.calls.length;
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL );
		} );
		expect( mockFetch.mock.calls.length ).toBeGreaterThan( callsAfterFailure );
		// The default poll reports the analytics module in progress: the request
		// reached the server after all, so the failure it reported is moot.
		await waitFor( () => expect( result.current.error ).toBeNull() );
	} );

	it( 'keeps a failed start reported while the sync stays unstarted', async () => {
		// Nothing in the analytics bucket, and nothing running: whatever the failed
		// trigger did, it did not start a sync.
		mockFetch.mockResolvedValue( rawStatus( { started: false, progress: {} } ) );
		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.data ).toBeDefined() );
		mockTrigger.mockRejectedValueOnce( new Error( 'nope' ) );
		await act( async () => {
			await result.current.triggerSync();
		} );
		expect( result.current.error?.message ).toBe( 'nope' );

		// Successful polls keep arriving, and none of them disproves the failure —
		// clearing it here would drop the retry and leave no way to start the sync.
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL * 3 );
		} );
		expect( result.current.error?.message ).toBe( 'nope' );

		// Only a retry that lands clears it.
		mockFetch.mockResolvedValue( rawStatus() );
		await act( async () => {
			await result.current.triggerSync();
		} );
		await waitFor( () => expect( result.current.error ).toBeNull() );
	} );

	it( 'starts complete and skips polling when the milestone is set', async () => {
		mockScriptData.mockReturnValue( {
			premium_analytics: { initial_full_sync_finished: 1_700_000_000 },
		} as ReturnType< typeof getScriptData > );

		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.isComplete ).toBe( true ) );
		expect( mockFetch ).not.toHaveBeenCalled();
	} );

	it( 'neither polls nor starts a sync when disabled', async () => {
		renderHook( () => useSyncStatus( { enabled: false, autoStart: true } ) );

		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL * 3 );
		} );
		expect( mockFetch ).not.toHaveBeenCalled();
		expect( mockTrigger ).not.toHaveBeenCalled();
	} );

	it( 'starts the sync once when autoStart is set and none is running', async () => {
		mockFetch.mockResolvedValue( rawStatus( { started: false, progress: {} } ) );
		const { result } = renderHook( () => useSyncStatus( { autoStart: true } ) );

		await waitFor( () => expect( mockTrigger ).toHaveBeenCalledTimes( 1 ) );

		// A later poll still reporting nothing started must not start a second one.
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL * 2 );
		} );
		expect( mockTrigger ).toHaveBeenCalledTimes( 1 );
		expect( result.current.isComplete ).toBe( false );
	} );

	it( 'does not autoStart while another full sync is running', async () => {
		mockFetch.mockResolvedValue( rawStatus( { progress: {} } ) );
		const { result } = renderHook( () => useSyncStatus( { autoStart: true } ) );

		await waitFor( () => expect( result.current.data?.isRunning ).toBe( true ) );
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL * 2 );
		} );
		expect( mockTrigger ).not.toHaveBeenCalled();
	} );

	it( 'leaves a stalled analytics sync stopped until the user retries it', async () => {
		mockFetch.mockResolvedValue( rawStatus( { finished: true } ) );
		const { result } = renderHook( () => useSyncStatus( { autoStart: true } ) );

		await waitFor( () => expect( result.current.error ).toBeInstanceOf( Error ) );
		expect( result.current.data?.isStarted ).toBe( true );
		expect( result.current.data?.isRunning ).toBe( false );
		expect( mockTrigger ).not.toHaveBeenCalled();
	} );

	it( 'does not autoStart a sync that already finished', async () => {
		mockScriptData.mockReturnValue( {
			premium_analytics: { initial_full_sync_finished: 1_700_000_000 },
		} as ReturnType< typeof getScriptData > );

		const { result } = renderHook( () => useSyncStatus( { autoStart: true } ) );

		await waitFor( () => expect( result.current.isComplete ).toBe( true ) );
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL * 2 );
		} );
		expect( mockTrigger ).not.toHaveBeenCalled();
	} );

	it( 'keeps polling on each interval while the sync is still running', async () => {
		mockFetch.mockResolvedValue( rawStatus() ); // 50%, never completes.
		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.data ).toBeDefined() );
		expect( mockFetch ).toHaveBeenCalledTimes( 1 );

		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL );
		} );
		expect( mockFetch ).toHaveBeenCalledTimes( 2 );

		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL );
		} );
		expect( mockFetch ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'stops polling after the hook unmounts', async () => {
		const { result, unmount } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.data ).toBeDefined() );
		const callsAtUnmount = mockFetch.mock.calls.length;

		unmount();
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL * 3 );
		} );
		expect( mockFetch ).toHaveBeenCalledTimes( callsAtUnmount );
	} );

	it( 'resumes polling and re-fetches after a successful triggerSync', async () => {
		// Start stalled so the initial poll tears down the interval.
		mockFetch.mockResolvedValue( rawStatus( { started: true, finished: true } ) );
		const { result } = renderHook( () => useSyncStatus() );
		await waitFor( () => expect( result.current.error ).toBeInstanceOf( Error ) );

		// Backend is healthy again on the next trigger.
		mockFetch.mockResolvedValue( rawStatus() );
		const before = mockFetch.mock.calls.length;

		await act( async () => {
			await result.current.triggerSync();
		} );

		expect( mockTrigger ).toHaveBeenCalledTimes( 1 );
		expect( mockFetch.mock.calls.length ).toBeGreaterThan( before ); // Immediate poll().
		expect( result.current.error ).toBeNull();

		const afterTrigger = mockFetch.mock.calls.length;
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL );
		} );
		expect( mockFetch.mock.calls.length ).toBeGreaterThan( afterTrigger ); // Polling resumed.
	} );

	it( 'keeps polling through a transient fetch error and self-heals on the next success', async () => {
		mockFetch.mockRejectedValueOnce( new Error( 'blip' ) );
		const { result } = renderHook( () => useSyncStatus() );

		// A recoverable error does not ask the user to retry while polling continues.
		await waitFor( () => expect( mockFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( result.current.error ).toBeNull();

		// The next tick succeeds and clears the error.
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL );
		} );
		await waitFor( () => expect( result.current.error ).toBeNull() );
		expect( result.current.data?.percentage ).toBe( 50 );
	} );

	it( 'gives up polling after MAX_POLL_FAILURES consecutive fetch errors', async () => {
		mockFetch.mockRejectedValue( new Error( 'down' ) );
		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( mockFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( result.current.error ).toBeNull();

		// Reach the failure cap, then confirm polling has stopped.
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL * ( MAX_POLL_FAILURES - 1 ) );
		} );
		await waitFor( () => expect( result.current.error?.message ).toBe( 'down' ) );
		const callsAfterGivingUp = mockFetch.mock.calls.length;

		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL * 5 );
		} );
		expect( mockFetch ).toHaveBeenCalledTimes( callsAfterGivingUp );
		expect( result.current.error?.message ).toBe( 'down' );
	} );

	it( 'completes when the sync-status poll reports the milestone', async () => {
		// Milestone unset at page load; the backend then exposes it on the poll.
		mockFetch.mockResolvedValue( rawStatus( { initial_full_sync_finished: 1_700_000_500 } ) );

		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () =>
			expect( result.current.data?.initialFullSyncFinished ).toBe( 1_700_000_500 )
		);
		// The milestone is written only after the analytics sync ends, so it is the
		// authoritative completion signal even if the progress payload lags behind.
		expect( result.current.isComplete ).toBe( true );
		expect( result.current.data?.percentage ).toBe( 50 );
	} );
} );
