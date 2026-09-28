import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { PROCESSING_POLL_MAX_MS } from '../use-library';
import { useVideoEdits, EDITS_QUERY_KEY, EDITS_POLL_INTERVAL_MS } from '../use-video-edits';
import type { VideoEdits } from '../../types/edits';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

/**
 * Build an edit response with the requested processing status.
 *
 * @param status   - The job status for the response.
 * @param revision - The committed revision (defaults to 0).
 * @return A complete VideoEdits object.
 */
function makeEdits( status: VideoEdits[ 'job' ][ 'status' ], revision = 0 ): VideoEdits {
	const processing = status === 'processing';
	return {
		guid: 'abc123',
		revision,
		original_duration_ms: 60000,
		output_duration_ms: 60000,
		operations: [],
		can_restore_original: revision > 0,
		job: {
			id: status === 'idle' ? null : 'mock-job-1-1000',
			status,
			target_revision: status === 'idle' ? null : revision + 1,
			progress: processing ? 0.5 : null,
			error: null,
		},
		updated: '2026-07-02T00:00:00+00:00',
	};
}

/**
 * Create an isolated query client and render wrapper.
 *
 * @return An object containing the client and wrapper component.
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
 * Advance polling and flush deferred query notifications.
 *
 * @param ms - Milliseconds to advance the fake timers by.
 */
async function advanceTimers( ms: number ) {
	await act( async () => {
		await jest.advanceTimersByTimeAsync( ms );
	} );
	await act( async () => {
		await jest.advanceTimersByTimeAsync( 0 );
	} );
}

afterEach( () => {
	jest.useRealTimers();
	mockedApiFetch.mockReset();
} );

describe( 'useVideoEdits — fetch and cache', () => {
	it( 'GETs the guid-scoped edits endpoint and caches under the edits key', async () => {
		const edits = makeEdits( 'idle' );
		mockedApiFetch.mockResolvedValueOnce( edits );
		const { client, wrapper } = makeWrapper();

		const { result } = renderHook( () => useVideoEdits( 'abc123' ), { wrapper } );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/abc123/edits',
		} );
		expect( result.current.edits ).toEqual( edits );
		expect( client.getQueryData( [ EDITS_QUERY_KEY, 'abc123' ] ) ).toEqual( edits );
	} );

	it( 'does not fetch when the guid is empty', () => {
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useVideoEdits( '' ), { wrapper } );

		expect( mockedApiFetch ).not.toHaveBeenCalled();
		expect( result.current.edits ).toBeUndefined();
	} );

	it( 'surfaces API errors', async () => {
		const restError = { code: 'edits_video_not_found', message: 'nope' };
		mockedApiFetch.mockRejectedValueOnce( restError );
		const { wrapper } = makeWrapper();

		const { result } = renderHook( () => useVideoEdits( 'abc123' ), { wrapper } );

		await waitFor( () => expect( result.current.isError ).toBe( true ) );
		expect( result.current.error ).toEqual( restError );
	} );
} );

describe( 'useVideoEdits — polling while a job is processing', () => {
	it( 'refetches every 5s while job.status is processing, then stops on complete', async () => {
		jest.useFakeTimers();

		mockedApiFetch
			.mockResolvedValueOnce( makeEdits( 'processing' ) ) // initial fetch
			.mockResolvedValueOnce( makeEdits( 'processing' ) ) // poll 1: still going
			.mockResolvedValueOnce( makeEdits( 'complete', 1 ) ); // poll 2: done

		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useVideoEdits( 'abc123' ), { wrapper } );

		await advanceTimers( 0 );
		expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( result.current.edits?.job.status ).toBe( 'processing' );

		await advanceTimers( EDITS_POLL_INTERVAL_MS );
		expect( mockedApiFetch ).toHaveBeenCalledTimes( 2 );

		await advanceTimers( EDITS_POLL_INTERVAL_MS );
		expect( mockedApiFetch ).toHaveBeenCalledTimes( 3 );
		await waitFor( () => expect( result.current.edits?.job.status ).toBe( 'complete' ) );
		expect( result.current.edits?.revision ).toBe( 1 );

		await advanceTimers( EDITS_POLL_INTERVAL_MS * 3 );
		expect( mockedApiFetch ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'caps a stuck job and gives a new job its own polling budget', async () => {
		jest.useFakeTimers();
		mockedApiFetch.mockResolvedValue( makeEdits( 'processing' ) );
		const { client, wrapper } = makeWrapper();
		renderHook( () => useVideoEdits( 'abc123' ), { wrapper } );
		await advanceTimers( 0 );
		await advanceTimers( PROCESSING_POLL_MAX_MS + EDITS_POLL_INTERVAL_MS );
		const callsAtLimit = mockedApiFetch.mock.calls.length;

		await advanceTimers( EDITS_POLL_INTERVAL_MS * 3 );
		expect( mockedApiFetch ).toHaveBeenCalledTimes( callsAtLimit );

		const nextJob = makeEdits( 'processing', 1 );
		nextJob.job.id = 'new-job';
		mockedApiFetch.mockResolvedValue( nextJob );
		act( () => {
			client.setQueryData( [ EDITS_QUERY_KEY, 'abc123' ], nextJob );
		} );
		await advanceTimers( EDITS_POLL_INTERVAL_MS );
		expect( mockedApiFetch ).toHaveBeenCalledTimes( callsAtLimit + 1 );
	} );

	it( 'does not poll when the job is idle', async () => {
		jest.useFakeTimers();

		mockedApiFetch.mockResolvedValueOnce( makeEdits( 'idle' ) );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useVideoEdits( 'abc123' ), { wrapper } );

		await advanceTimers( 0 );
		expect( result.current.edits?.job.status ).toBe( 'idle' );

		await advanceTimers( EDITS_POLL_INTERVAL_MS * 3 );
		expect( mockedApiFetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
