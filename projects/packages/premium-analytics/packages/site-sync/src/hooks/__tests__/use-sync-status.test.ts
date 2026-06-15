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
	// Default: milestone not set.
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
			premium_analytics: { initial_full_sync_finished: 1_700_000_000 },
		} as ReturnType< typeof getScriptData > );

		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () => expect( result.current.isComplete ).toBe( true ) );
		expect( mockFetch ).not.toHaveBeenCalled();
	} );

	it( 'updates the milestone live from the sync-status poll', async () => {
		// Milestone unset at page load; the backend then exposes it on the poll.
		mockFetch.mockResolvedValue( rawStatus( { initial_full_sync_finished: 1_700_000_500 } ) );

		const { result } = renderHook( () => useSyncStatus() );

		await waitFor( () =>
			expect( result.current.data?.initialFullSyncFinished ).toBe( 1_700_000_500 )
		);
		// Milestone > 0 ⇒ complete even though analytics progress is only at 50%.
		expect( result.current.isComplete ).toBe( true );
		expect( result.current.data?.percentage ).toBe( 50 );
	} );
} );
