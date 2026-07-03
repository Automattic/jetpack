import { act, renderHook, waitFor } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { JOB_POLL_INTERVAL_MS, useImportJob } from '../use-import-job';
import { LIBRARY_QUERY_KEY } from '../use-library';
import { IMPORT_QUERY_KEY } from '../use-youtube-connection';
import { VIDEOS_QUERY_SEGMENT } from '../use-youtube-videos';

const IMPORT_PATH = '/jetpack/v4/videopress/import/youtube';
const STATUS_PATH = '/jetpack/v4/videopress/import/status/job-1';

const START_RESPONSE = {
	job_id: 'job-1',
	items: [
		{ external_id: 'vid-a', status: 'queued' },
		{ external_id: 'vid-b', status: 'queued' },
	],
};

const DONE_JOB = {
	job_id: 'job-1',
	status: 'done',
	items: [
		{ external_id: 'vid-a', status: 'done', attachment_id: 101, error: null },
		{
			external_id: 'vid-b',
			status: 'failed',
			attachment_id: null,
			error: { code: 'unknown_video', message: 'No video with that ID.' },
		},
	],
};

/**
 * Install an apiFetch handler that answers the import POST with START_RESPONSE
 * and serves status polls from the given queue (repeating the last entry).
 *
 * @param statusResponses - Status payloads returned by successive polls.
 * @return The jest mock for call assertions.
 */
function mockImportApi( statusResponses: unknown[] ) {
	let pollCount = 0;
	return mockApiFetch( ( { path, method } ) => {
		if ( method === 'POST' && path === IMPORT_PATH ) {
			return START_RESPONSE;
		}
		if ( path === STATUS_PATH ) {
			const index = Math.min( pollCount, statusResponses.length - 1 );
			pollCount += 1;
			return statusResponses[ index ];
		}
		throw new Error( `Unexpected apiFetch call: ${ method ?? 'GET' } ${ path }` );
	} );
}

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'useImportJob', () => {
	it( 'POSTs the selected video ids and resolves with the job id', async () => {
		const mock = mockImportApi( [ DONE_JOB ] );
		const { result } = renderHook( () => useImportJob(), { wrapper: createTestWrapper() } );

		let jobId: string | undefined;
		await act( async () => {
			jobId = await result.current.startImport( [ 'vid-a', 'vid-b' ] );
		} );

		expect( jobId ).toBe( 'job-1' );
		expect( mock ).toHaveBeenCalledWith( {
			path: IMPORT_PATH,
			method: 'POST',
			data: { video_ids: [ 'vid-a', 'vid-b' ] },
		} );
		expect( result.current.jobId ).toBe( 'job-1' );
	} );

	it( 'polls the status endpoint and normalizes the job record', async () => {
		mockImportApi( [ DONE_JOB ] );
		const { result } = renderHook( () => useImportJob(), { wrapper: createTestWrapper() } );

		await act( async () => {
			await result.current.startImport( [ 'vid-a', 'vid-b' ] );
		} );
		await waitFor( () => expect( result.current.job ).toBeDefined() );

		expect( result.current.job ).toEqual( {
			jobId: 'job-1',
			status: 'done',
			items: [
				{ externalId: 'vid-a', status: 'done', attachmentId: 101, error: null },
				{
					externalId: 'vid-b',
					status: 'failed',
					attachmentId: null,
					error: { code: 'unknown_video', message: 'No video with that ID.' },
				},
			],
		} );
		expect( result.current.isImporting ).toBe( false );
	} );

	it( 'keeps polling on the interval while the job is running', async () => {
		jest.useFakeTimers();
		const mock = mockImportApi( [ { job_id: 'job-1', status: 'running', items: [] }, DONE_JOB ] );
		const { result } = renderHook( () => useImportJob(), { wrapper: createTestWrapper() } );

		act( () => {
			result.current.startImport( [ 'vid-a', 'vid-b' ] ).catch( () => {} );
		} );
		// Let the POST resolve and the first status fetch settle (waitFor
		// advances the fake timers between assertion attempts).
		await waitFor( () => expect( result.current.job?.status ).toBe( 'running' ) );
		expect( result.current.isImporting ).toBe( true );

		// One poll interval later the job reports done and polling stops.
		await act( async () => {
			await jest.advanceTimersByTimeAsync( JOB_POLL_INTERVAL_MS );
		} );
		expect( result.current.job?.status ).toBe( 'done' );
		expect( result.current.isImporting ).toBe( false );

		const statusCalls = mock.mock.calls.filter(
			( [ opts ] ) =>
				( opts as { path?: string } )?.path?.startsWith( '/jetpack/v4/videopress/import/status/' )
		);
		expect( statusCalls ).toHaveLength( 2 );

		await act( async () => {
			await jest.advanceTimersByTimeAsync( JOB_POLL_INTERVAL_MS * 3 );
		} );
		const statusCallsAfter = mock.mock.calls.filter(
			( [ opts ] ) =>
				( opts as { path?: string } )?.path?.startsWith( '/jetpack/v4/videopress/import/status/' )
		);
		expect( statusCallsAfter ).toHaveLength( 2 );
	} );

	it( 'invalidates the library and the uploads listing once when the job settles', async () => {
		mockImportApi( [ DONE_JOB ] );
		const client = createTestQueryClient();
		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		const { result } = renderHook( () => useImportJob(), {
			wrapper: createTestWrapper( client ),
		} );

		await act( async () => {
			await result.current.startImport( [ 'vid-a', 'vid-b' ] );
		} );
		await waitFor( () => expect( result.current.job?.status ).toBe( 'done' ) );

		await waitFor( () =>
			expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ LIBRARY_QUERY_KEY ] } )
		);
		expect( invalidateSpy ).toHaveBeenCalledWith( {
			queryKey: [ IMPORT_QUERY_KEY, VIDEOS_QUERY_SEGMENT ],
		} );

		const libraryInvalidations = invalidateSpy.mock.calls.filter(
			( [ arg ] ) =>
				JSON.stringify( ( arg as { queryKey?: unknown } )?.queryKey ) ===
				JSON.stringify( [ LIBRARY_QUERY_KEY ] )
		);
		expect( libraryInvalidations ).toHaveLength( 1 );
	} );

	it( 'rejects startImport and arms nothing when the POST fails', async () => {
		const mock = mockApiFetch( () => {
			throw new Error( 'import rejected' );
		} );
		const { result } = renderHook( () => useImportJob(), { wrapper: createTestWrapper() } );

		await act( async () => {
			await expect( result.current.startImport( [ 'vid-a' ] ) ).rejects.toThrow(
				'import rejected'
			);
		} );

		expect( result.current.jobId ).toBeNull();
		expect( result.current.job ).toBeUndefined();
		await waitFor( () => expect( result.current.startError ).toBeInstanceOf( Error ) );
		// Only the POST went out — no status fetch without a job id.
		expect( mock ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'rejects startImport when the response has no job id', async () => {
		mockApiFetch( () => ( {} ) );
		const { result } = renderHook( () => useImportJob(), { wrapper: createTestWrapper() } );

		await act( async () => {
			await expect( result.current.startImport( [ 'vid-a' ] ) ).rejects.toThrow(
				'did not return a job ID'
			);
		} );
		expect( result.current.jobId ).toBeNull();
	} );

	it( 'surfaces a status-poll failure as jobError', async () => {
		mockApiFetch( ( { method } ) => {
			if ( method === 'POST' ) {
				return START_RESPONSE;
			}
			throw new Error( 'No import job with that ID was found.' );
		} );
		const { result } = renderHook( () => useImportJob(), { wrapper: createTestWrapper() } );

		await act( async () => {
			await result.current.startImport( [ 'vid-a' ] );
		} );

		await waitFor( () => expect( result.current.jobError ).toBeInstanceOf( Error ) );
		expect( result.current.isImporting ).toBe( false );
	} );

	it( 'reset clears the tracked job', async () => {
		mockImportApi( [ DONE_JOB ] );
		const { result } = renderHook( () => useImportJob(), { wrapper: createTestWrapper() } );

		await act( async () => {
			await result.current.startImport( [ 'vid-a', 'vid-b' ] );
		} );
		await waitFor( () => expect( result.current.job ).toBeDefined() );

		act( () => {
			result.current.reset();
		} );

		expect( result.current.jobId ).toBeNull();
		expect( result.current.job ).toBeUndefined();
		expect( result.current.isImporting ).toBe( false );
	} );
} );
