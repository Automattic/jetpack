// The mock shape mirrors the actual useResumableUploader return value:
// { onUploadHandler, uploadHandler, resumeHandler, uploadingData, media, error }
//
// We only expose uploadHandler (and a minimal resumeHandler stub) because
// those are the only members used by the adapter. The most recent set of
// callbacks passed to useResumableUploader is captured in `lastCallbacks`
// so individual tests can simulate progress / success / error.

import { renderHook, act } from '@testing-library/react';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { useUpload, __resetUploadStoreForTests } from '../use-upload';

const mockUploadHandler = jest.fn();
let lastCallbacks: {
	onProgress?: ( bytesSent: number, bytesTotal: number ) => void;
	onSuccess?: ( data?: unknown ) => void;
	onError?: ( err: unknown ) => void;
};

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

describe( 'useUpload', () => {
	beforeEach( () => {
		mockUploadHandler.mockClear();
		lastCallbacks = {};
		__resetUploadStoreForTests();
	} );

	it( 'exposes an empty queue initially', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		expect( result.current.uploadQueue ).toEqual( [] );
	} );

	it( 'adds an item to the queue when startUpload is called', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		act( () => {
			result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		expect( result.current.uploadQueue ).toHaveLength( 1 );
		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'pending' );
	} );

	it( 'returns a string id from startUpload', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		let id: string | undefined;
		act( () => {
			id = result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		expect( typeof id ).toBe( 'string' );
		expect( id ).toMatch( /^upload-/ );
	} );

	it( 'delegates to the legacy uploadHandler with the file', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file = new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } );
		act( () => {
			result.current.startUpload( file );
		} );
		expect( mockUploadHandler ).toHaveBeenCalledWith( file );
	} );

	it( 'retryUpload re-delegates to the legacy uploadHandler after a failure', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file = new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } );
		let id: string | undefined;
		act( () => {
			id = result.current.startUpload( file );
		} );
		act( () => {
			lastCallbacks.onError?.( new Error( 'boom' ) );
		} );
		mockUploadHandler.mockClear();
		act( () => {
			result.current.retryUpload( id! );
		} );
		expect( mockUploadHandler ).toHaveBeenCalledWith( file );
		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'pending' );
		expect( result.current.uploadQueue[ 0 ].progress ).toBe( 0 );
	} );

	it( 'retryUpload is a no-op for an unknown id', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		act( () => {
			result.current.retryUpload( 'upload-does-not-exist' );
		} );
		expect( mockUploadHandler ).not.toHaveBeenCalled();
	} );

	it( 'shares the upload queue across separate useUpload instances backed by the same QueryClient', () => {
		const client = createTestQueryClient();
		const wrapper = createTestWrapper( client );
		const { result: producer } = renderHook( () => useUpload(), { wrapper } );
		const { result: observer } = renderHook( () => useUpload(), { wrapper } );

		expect( observer.current.uploadQueue ).toEqual( [] );

		act( () => {
			producer.current.startUpload( new File( [ 'x' ], 'shared.mp4', { type: 'video/mp4' } ) );
		} );

		expect( producer.current.uploadQueue ).toHaveLength( 1 );
		expect( observer.current.uploadQueue ).toHaveLength( 1 );
		expect( observer.current.uploadQueue[ 0 ].file.name ).toBe( 'shared.mp4' );
	} );

	it( 'queues a second startUpload behind the active one instead of overwriting it', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );

		act( () => {
			result.current.startUpload( file1 );
			result.current.startUpload( file2 );
		} );

		// Only the first dispatches to the legacy uploader; the second waits its turn.
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );
		expect( mockUploadHandler ).toHaveBeenLastCalledWith( file1 );
		expect( result.current.uploadQueue.map( u => u.file.name ) ).toEqual( [ 'a.mp4', 'b.mp4' ] );
	} );

	it( 'dispatches the next queued upload after the active one succeeds', () => {
		jest.useFakeTimers();
		try {
			const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
			const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
			const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );

			act( () => {
				result.current.startUpload( file1 );
				result.current.startUpload( file2 );
			} );

			// Before success fires, only file1 has been handed to the legacy uploader.
			expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );
			expect( mockUploadHandler ).toHaveBeenLastCalledWith( file1 );

			// Simulate the legacy uploader finishing the first upload.
			act( () => {
				lastCallbacks.onSuccess?.();
			} );

			// Removing the success'd item is debounced by 2s; flush timers
			// so the success-removal + next-dispatch both run.
			act( () => {
				jest.runOnlyPendingTimers();
			} );

			expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );
			expect( mockUploadHandler ).toHaveBeenLastCalledWith( file2 );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'dispatches the next queued upload after the active one fails', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );

		act( () => {
			result.current.startUpload( file1 );
			result.current.startUpload( file2 );
		} );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );

		act( () => {
			lastCallbacks.onError?.( new Error( 'boom' ) );
		} );

		// A failed upload stays in the queue (so the user can retry it),
		// but the next pending upload should be picked up immediately.
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );
		expect( mockUploadHandler ).toHaveBeenLastCalledWith( file2 );
		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'failed' );
	} );
} );
