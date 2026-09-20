import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import {
	LIBRARY_QUERY_KEY,
	LIBRARY_POLL_INTERVAL_MS,
	PROCESSING_POLL_MAX_MS,
} from '../use-library';
import {
	useSaveVideoCopy,
	useVideoCopyStatus,
	VIDEO_COPY_QUERY_KEY,
	VideoCopyRejectedError,
} from '../use-save-video-copy';
import { EditsConflictError } from '../use-save-video-edits';
import { EDITS_QUERY_KEY } from '../use-video-edits';
import type { SaveVideoCopyResponse, SaveVideoCopyVars } from '../use-save-video-copy';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const request: SaveVideoCopyVars = {
	guid: 'source12',
	baseRevision: 2,
	operations: [ { type: 'cut', start_ms: 3000, end_ms: 5000 } ],
	requestId: '32457391-3ebf-4c67-ac58-a34dd71399bf',
	title: 'Video copy',
};
const accepted: SaveVideoCopyResponse = {
	source_guid: request.guid,
	request_id: request.requestId,
	guid: null,
	attachment_id: null,
	job: { id: 'copy-job', status: 'processing', target_revision: null, progress: null, error: null },
};

beforeEach( () => {
	jest.mocked( apiFetch ).mockReset();
} );

afterEach( () => {
	jest.useRealTimers();
} );

describe( 'useSaveVideoCopy', () => {
	it.each( [
		[ 'copy_storage_limit', 403 ],
		[ 'copy_source_unavailable', 409 ],
		[ 'copy_authorization_unavailable', 424 ],
		[ 'invalid_title', 400 ],
		[ 'unknown_media', 404 ],
	] )(
		'distinguishes a rejected %s request from an uncertain acceptance',
		async ( code, status ) => {
			jest
				.mocked( apiFetch )
				.mockRejectedValue( { code, message: 'Cannot copy this video.', data: { status } } );
			const { result } = renderHook( useSaveVideoCopy, { wrapper: createTestWrapper() } );
			await act( async () => {
				await expect( result.current.mutateAsync( request ) ).rejects.toEqual(
					new VideoCopyRejectedError( code as string, 'Cannot copy this video.' )
				);
			} );
		}
	);

	it.each( [
		[ 'copy_request_pending', 409 ],
		[ 'copy_request_conflict', 409 ],
		[ 'videopress_edits_request_failed', 502 ],
		[ 'unknown_dependency_failure', 424 ],
	] )( 'retains uncertain acceptance for %s', async ( code, status ) => {
		const failure = { code, data: { status } };
		jest.mocked( apiFetch ).mockRejectedValue( failure );
		const { result } = renderHook( useSaveVideoCopy, { wrapper: createTestWrapper() } );
		await act( async () => {
			await expect( result.current.mutateAsync( request ) ).rejects.toBe( failure );
		} );
	} );

	it( 'submits an idempotent copy request and leaves the source edit cache unchanged', async () => {
		jest.mocked( apiFetch ).mockResolvedValue( accepted );
		const client = createTestQueryClient();
		client.setQueryDefaults( [ EDITS_QUERY_KEY ], { gcTime: Infinity } );
		client.setQueryDefaults( [ VIDEO_COPY_QUERY_KEY ], { gcTime: Infinity } );
		const original = { revision: 2, operations: [], job: { status: 'idle' } };
		client.setQueryData( [ EDITS_QUERY_KEY, request.guid ], original );
		const { result } = renderHook( useSaveVideoCopy, { wrapper: createTestWrapper( client ) } );
		await act( async () => {
			await result.current.mutateAsync( request );
		} );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/source12/edits/copy',
			method: 'POST',
			data: {
				base_revision: 2,
				operations: request.operations,
				request_id: request.requestId,
				title: 'Video copy',
			},
		} );
		expect( client.getQueryData( [ EDITS_QUERY_KEY, request.guid ] ) ).toEqual( original );
		expect(
			client.getQueryData( [ VIDEO_COPY_QUERY_KEY, request.guid, request.requestId ] )
		).toEqual( accepted );
	} );

	it( 'retries an uncertain request with the same identifier and captured operations', async () => {
		const networkError = new Error( 'Connection interrupted' );
		jest.mocked( apiFetch ).mockRejectedValueOnce( networkError ).mockResolvedValueOnce( accepted );
		const { result } = renderHook( useSaveVideoCopy, { wrapper: createTestWrapper() } );
		await act( async () => {
			await expect( result.current.mutateAsync( request ) ).rejects.toBe( networkError );
		} );
		await act( async () => {
			await result.current.mutateAsync( request );
		} );
		expect( jest.mocked( apiFetch ).mock.calls[ 1 ] ).toEqual(
			jest.mocked( apiFetch ).mock.calls[ 0 ]
		);
	} );

	it( 'reports source revision conflicts without accepting a new copy', async () => {
		jest
			.mocked( apiFetch )
			.mockRejectedValue( { code: 'edits_conflict', data: { current_revision: 3 } } );
		const client = createTestQueryClient();
		const { result } = renderHook( useSaveVideoCopy, { wrapper: createTestWrapper( client ) } );
		await act( async () => {
			await expect( result.current.mutateAsync( request ) ).rejects.toBeInstanceOf(
				EditsConflictError
			);
		} );
		expect(
			client.getQueryData( [ VIDEO_COPY_QUERY_KEY, request.guid, request.requestId ] )
		).toBeUndefined();
	} );
} );

describe( 'useVideoCopyStatus', () => {
	it( 'waits for a request before querying', () => {
		renderHook( () => useVideoCopyStatus( request.guid, null ), { wrapper: createTestWrapper() } );
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'refreshes the library when the destination appears and finishes, then stops polling', async () => {
		jest.useFakeTimers();
		jest
			.mocked( apiFetch )
			.mockResolvedValueOnce( accepted )
			.mockResolvedValueOnce( { ...accepted, guid: 'copy1234', attachment_id: 17 } )
			.mockResolvedValue( {
				...accepted,
				guid: 'copy1234',
				attachment_id: 17,
				job: { ...accepted.job, status: 'complete' },
			} );
		const client = createTestQueryClient();
		const invalidate = jest.spyOn( client, 'invalidateQueries' );
		const { result } = renderHook( () => useVideoCopyStatus( request.guid, request.requestId ), {
			wrapper: createTestWrapper( client ),
		} );
		await waitFor( () => expect( result.current.data?.job.status ).toBe( 'processing' ) );
		expect( invalidate ).not.toHaveBeenCalled();
		await act( async () => jest.advanceTimersByTime( LIBRARY_POLL_INTERVAL_MS ) );
		await waitFor( () => expect( result.current.data?.attachment_id ).toBe( 17 ) );
		expect( invalidate ).toHaveBeenCalledWith( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		await act( async () => jest.advanceTimersByTime( LIBRARY_POLL_INTERVAL_MS ) );
		await waitFor( () => expect( result.current.data?.job.status ).toBe( 'complete' ) );
		expect( invalidate ).toHaveBeenCalledTimes( 2 );
		await act( async () => jest.advanceTimersByTime( LIBRARY_POLL_INTERVAL_MS * 3 ) );
		expect( apiFetch ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'caps automatic processing polls while retaining manual status checks', async () => {
		jest.useFakeTimers();
		jest.mocked( apiFetch ).mockResolvedValue( accepted );
		const { result } = renderHook( () => useVideoCopyStatus( request.guid, request.requestId ), {
			wrapper: createTestWrapper(),
		} );
		await waitFor( () => expect( result.current.data?.job.status ).toBe( 'processing' ) );
		jest.setSystemTime( Date.now() + PROCESSING_POLL_MAX_MS + 1 );
		await act( async () => jest.advanceTimersByTime( LIBRARY_POLL_INTERVAL_MS ) );
		const calls = jest.mocked( apiFetch ).mock.calls.length;
		await act( async () => jest.advanceTimersByTime( LIBRARY_POLL_INTERVAL_MS * 3 ) );
		expect( apiFetch ).toHaveBeenCalledTimes( calls );
		await act( async () => {
			await result.current.refetch();
		} );
		expect( apiFetch ).toHaveBeenCalledTimes( calls + 1 );
	} );
} );
