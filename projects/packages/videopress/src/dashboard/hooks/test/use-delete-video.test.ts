import { renderHook, act } from '@testing-library/react';
import { mockApiFetch } from '../../test-utils/mock-api-fetch';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { DeleteVideosError, useDeleteVideo } from '../use-delete-video';
import { useUpload, __resetUploadStoreForTests } from '../use-upload';

// The real queue store is the point of the reconciliation test below, so only
// the tus transport is stubbed out.
const mockUploadHandler = jest.fn();
let lastCallbacks: { onSuccess?: ( data?: unknown ) => void };
jest.mock( '../../../client/hooks/use-resumable-uploader', () => ( {
	__esModule: true,
	default: jest.fn( options => {
		lastCallbacks = options;
		return {
			onUploadHandler: jest.fn(),
			uploadHandler: mockUploadHandler,
			resumeHandler: undefined,
			uploadingData: { bytesSent: 0, bytesTotal: 0, percent: 0, status: 'idle' },
			media: undefined,
			error: null,
		};
	} ),
} ) );

describe( 'useDeleteVideo', () => {
	beforeEach( () => {
		mockUploadHandler.mockClear();
		lastCallbacks = {};
		__resetUploadStoreForTests();
	} );

	it( 'sends DELETE for each id', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path, method } ) => {
			if ( method === 'DELETE' ) {
				paths.push( path ?? '' );
				return { deleted: true };
			}
			throw new Error( 'unexpected' );
		} );

		const client = createTestQueryClient();
		const removeSpy = jest.spyOn( client, 'removeQueries' );
		const wrapper = createTestWrapper( client );
		const { result } = renderHook( () => useDeleteVideo(), { wrapper } );
		await act( async () => {
			await result.current.mutateAsync( [ 1, 2, 3 ] );
		} );

		expect( paths ).toEqual( [
			'/wp/v2/media/1?force=true',
			'/wp/v2/media/2?force=true',
			'/wp/v2/media/3?force=true',
		] );
		// Deleted ids' item-detail queries are dropped so a back-navigation
		// can't render a ghost editor from cache.
		expect( removeSpy ).toHaveBeenCalledTimes( 3 );
		expect( removeSpy ).toHaveBeenCalledWith( {
			queryKey: [ 'jetpack-videopress-library', 'item', '2' ],
		} );
	} );

	it( 'rejects with a DeleteVideosError listing only the failed ids, still attempting every id', async () => {
		const paths: string[] = [];
		mockApiFetch( async ( { path, method } ) => {
			if ( method === 'DELETE' ) {
				paths.push( path ?? '' );
				if ( path === '/wp/v2/media/2?force=true' ) {
					throw new Error( 'boom' );
				}
				return { deleted: true };
			}
			throw new Error( 'unexpected' );
		} );

		const client = createTestQueryClient();
		const removeSpy = jest.spyOn( client, 'removeQueries' );
		const wrapper = createTestWrapper( client );
		const { result } = renderHook( () => useDeleteVideo(), { wrapper } );

		let caught: unknown;
		await act( async () => {
			try {
				await result.current.mutateAsync( [ 1, 2, 3 ] );
			} catch ( error ) {
				caught = error;
			}
		} );

		expect( caught ).toBeInstanceOf( DeleteVideosError );
		expect( ( caught as DeleteVideosError ).failedIds ).toEqual( [ 2 ] );
		// A failure must not short-circuit the rest of the batch.
		expect( paths ).toHaveLength( 3 );
		// Only the SUCCEEDED ids' item queries are dropped — the failed row
		// still exists and its cached details remain valid.
		expect( removeSpy ).toHaveBeenCalledTimes( 2 );
		expect( removeSpy ).toHaveBeenCalledWith( {
			queryKey: [ 'jetpack-videopress-library', 'item', '1' ],
		} );
		expect( removeSpy ).toHaveBeenCalledWith( {
			queryKey: [ 'jetpack-videopress-library', 'item', '3' ],
		} );
	} );

	it( 'invalidates library list queries (not item queries) even when deletions fail', async () => {
		mockApiFetch( async ( { method } ) => {
			if ( method === 'DELETE' ) {
				throw new Error( 'boom' );
			}
			throw new Error( 'unexpected' );
		} );

		const client = createTestQueryClient();
		const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
		const wrapper = createTestWrapper( client );
		const { result } = renderHook( () => useDeleteVideo(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( 1 ).catch( () => {
				// Rejection is expected; the assertion below is about invalidation.
			} );
		} );

		expect( invalidateSpy ).toHaveBeenCalledTimes( 1 );
		const { predicate } = invalidateSpy.mock.calls[ 0 ][ 0 ] as unknown as {
			predicate: ( query: { queryKey: unknown[] } ) => boolean;
		};
		// List queries refetch; the (possibly just-deleted) item query must
		// not — refetching it would 404 and stall the mutation settling.
		expect( predicate( { queryKey: [ 'jetpack-videopress-library', { page: 1 } ] } ) ).toBe( true );
		expect( predicate( { queryKey: [ 'jetpack-videopress-library', 'item', '9' ] } ) ).toBe(
			false
		);
		expect( predicate( { queryKey: [ 'unrelated' ] } ) ).toBe( false );
	} );
} );

describe( 'useDeleteVideo — upload-queue reconciliation', () => {
	beforeEach( () => {
		mockUploadHandler.mockClear();
		lastCallbacks = {};
		__resetUploadStoreForTests();
		window.localStorage.clear();
	} );

	// Nothing used to drop a success row whose video had been deleted: the
	// pill kept offering "Add details" for a 404, and /upload re-adopted the
	// dead row into a permanently "processing" edit step.
	it( 'drops queue rows bound to the deleted videos, keeping the survivors', async () => {
		mockApiFetch( async ( { method } ) => {
			if ( method === 'DELETE' ) {
				return { deleted: true };
			}
			throw new Error( 'unexpected' );
		} );

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => ( { upload: useUpload(), remove: useDeleteVideo() } ), {
			wrapper,
		} );

		act( () => {
			result.current.upload.startUpload( new File( [ 'x' ], 'gone.mp4' ) );
		} );
		act( () => {
			lastCallbacks.onSuccess?.( { id: 77, guid: 'g77', src: 'https://v.example/77' } );
		} );
		act( () => {
			result.current.upload.startUpload( new File( [ 'y' ], 'kept.mp4' ) );
		} );
		act( () => {
			lastCallbacks.onSuccess?.( { id: 78, guid: 'g78', src: 'https://v.example/78' } );
		} );
		expect( result.current.upload.uploadQueue ).toHaveLength( 2 );

		await act( async () => {
			await result.current.remove.mutateAsync( 77 );
		} );

		expect( result.current.upload.uploadQueue.map( u => u.media?.id ) ).toEqual( [ 78 ] );
	} );

	it( 'keeps the row of a video whose delete failed', async () => {
		mockApiFetch( async ( { method } ) => {
			if ( method === 'DELETE' ) {
				throw new Error( 'boom' );
			}
			throw new Error( 'unexpected' );
		} );

		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result } = renderHook( () => ( { upload: useUpload(), remove: useDeleteVideo() } ), {
			wrapper,
		} );

		act( () => {
			result.current.upload.startUpload( new File( [ 'x' ], 'stays.mp4' ) );
		} );
		act( () => {
			lastCallbacks.onSuccess?.( { id: 77, guid: 'g77', src: 'https://v.example/77' } );
		} );

		await act( async () => {
			await result.current.remove.mutateAsync( 77 ).catch( () => {
				// Rejection is expected; the assertion is about the queue row.
			} );
		} );

		expect( result.current.upload.uploadQueue ).toHaveLength( 1 );
	} );
} );
