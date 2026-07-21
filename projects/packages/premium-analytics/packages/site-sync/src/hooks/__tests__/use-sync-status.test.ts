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
		premium_analytics: { initial_full_sync_finished: 0, has_store_data: true },
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

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
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

		await waitFor( () => expect( result.current.isStalled ).toBe( true ) );
		expect( result.current.error ).toBeInstanceOf( Error );
	} );

	it( 'surfaces fetch errors and never rejects triggerSync', async () => {
		mockFetch.mockRejectedValueOnce( new Error( 'boom' ) );
		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.error ).toBeInstanceOf( Error ) );
		expect( result.current.error?.message ).toBe( 'boom' );

		// triggerSync resolves even if the trigger call fails.
		mockTrigger.mockRejectedValueOnce( new Error( 'nope' ) );
		await act( async () => {
			await result.current.triggerSync();
		} );
		expect( result.current.error?.message ).toBe( 'nope' );
	} );

	it( 'starts complete and skips polling when the milestone is set', async () => {
		mockScriptData.mockReturnValue( {
			premium_analytics: { initial_full_sync_finished: 1_700_000_000, has_store_data: true },
		} as ReturnType< typeof getScriptData > );

		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.isComplete ).toBe( true ) );
		expect( mockFetch ).not.toHaveBeenCalled();
	} );

	it( 'without an analytics backend, gates on the generic full sync', async () => {
		// has_store_data = false: no woocommerce_analytics bucket; progress is
		// summed across the generic full sync's modules instead.
		mockScriptData.mockReturnValue( {
			premium_analytics: { initial_full_sync_finished: 0, has_store_data: false },
		} as ReturnType< typeof getScriptData > );
		mockFetch.mockResolvedValue( {
			started: true,
			finished: false,
			progress: { options: { sent: 1, total: 2 }, posts: { sent: 1, total: 2 } },
		} );

		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
		expect( result.current.data?.hasStoreData ).toBe( false );
		expect( result.current.data?.isRunning ).toBe( true );
		expect( result.current.data?.percentage ).toBe( 50 );
		expect( result.current.isComplete ).toBe( false );
	} );

	it( 'without an analytics backend, completes when the generic full sync milestone is set', async () => {
		mockScriptData.mockReturnValue( {
			premium_analytics: { initial_full_sync_finished: 0, has_store_data: false },
		} as ReturnType< typeof getScriptData > );
		mockFetch.mockResolvedValue( {
			started: true,
			finished: true,
			progress: { options: { sent: 2, total: 2 } },
			initial_full_sync_finished: 1_700_000_000,
		} );

		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.isComplete ).toBe( true ) );
	} );

	it( 'keeps polling on each interval while the sync is still running', async () => {
		mockFetch.mockResolvedValue( rawStatus() ); // 50%, never completes.
		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
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

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );
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
		await waitFor( () => expect( result.current.isStalled ).toBe( true ) );

		// Backend is healthy again on the next trigger.
		mockFetch.mockResolvedValue( rawStatus() );
		const before = mockFetch.mock.calls.length;

		await act( async () => {
			await result.current.triggerSync();
		} );

		expect( mockTrigger ).toHaveBeenCalledTimes( 1 );
		expect( mockFetch.mock.calls.length ).toBeGreaterThan( before ); // Immediate poll().
		expect( result.current.error ).toBeNull();
		expect( result.current.isStalled ).toBe( false );

		const afterTrigger = mockFetch.mock.calls.length;
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL );
		} );
		expect( mockFetch.mock.calls.length ).toBeGreaterThan( afterTrigger ); // Polling resumed.
	} );

	it( 'keeps polling through a transient fetch error and self-heals on the next success', async () => {
		mockFetch.mockRejectedValueOnce( new Error( 'blip' ) );
		const { result } = renderHook( () => useSyncStatus() );

		// The error surfaces, but polling is not torn down.
		await waitFor( () => expect( result.current.error?.message ).toBe( 'blip' ) );

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

		await waitFor( () => expect( result.current.error?.message ).toBe( 'down' ) );

		// Drive past the failure cap, then confirm polling has stopped.
		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL * ( MAX_POLL_FAILURES + 1 ) );
		} );
		const callsAfterGivingUp = mockFetch.mock.calls.length;

		await act( async () => {
			jest.advanceTimersByTime( POLL_INTERVAL * 5 );
		} );
		expect( mockFetch ).toHaveBeenCalledTimes( callsAfterGivingUp );
		expect( result.current.error?.message ).toBe( 'down' );
	} );

	it( 'updates the milestone live from the sync-status poll', async () => {
		// Milestone unset at page load; the backend then exposes it on the poll.
		mockFetch.mockResolvedValue( rawStatus( { initial_full_sync_finished: 1_700_000_500 } ) );

		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () =>
			expect( result.current.data?.initialFullSyncFinished ).toBe( 1_700_000_500 )
		);
		// Milestone is live, but analytics progress is only 50% ⇒ not complete (AND).
		expect( result.current.isComplete ).toBe( false );
		expect( result.current.data?.percentage ).toBe( 50 );
	} );
} );
