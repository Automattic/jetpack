// The mock shape mirrors the actual useResumableUploader return value:
// { onUploadHandler, uploadHandler, resumeHandler, uploadingData, media, error }
//
// We only expose uploadHandler (and a minimal resumeHandler stub) because
// those are the only members used by the adapter. The most recent set of
// callbacks passed to useResumableUploader is captured in `lastCallbacks`
// so individual tests can simulate progress / success / error.
//
// resumeHandler is modelled as per-instance state that appears only *after*
// uploadHandler runs, exactly like the real hook (which sets it once the
// upload-JWT round trip resolves). The window before it appears is where the
// cancel mis-attribution bug lived, so `mockDeferResumeHandler` lets a test
// hold the queue inside it, and `mockEmitResumeHandler` closes that window at
// the exact moment the test means to — the handle landing on a session that
// was cancelled while it was still being fetched.

import { renderHook, act } from '@testing-library/react';
import { createTestQueryClient, createTestWrapper } from '../../test-utils/query-client-wrapper';
import { hasPublishedVideo } from '../use-first-run-state';
import {
	isAdoptableUpload,
	removeUploadRowsForMedia,
	setUploadDraft,
	useUpload,
	__resetUploadStoreForTests,
} from '../use-upload';

// Every queued success now writes the first-publish flag, which is persisted:
// leaving it set would make the assertion in the flag's own test vacuous.
beforeEach( () => {
	window.localStorage.clear();
} );

const mockUploadHandler = jest.fn();
const mockAbort = jest.fn();
let mockDeferResumeHandler = false;
let mockEmitResumeHandler: ( () => void ) | undefined;
let lastCallbacks: {
	onProgress?: ( bytesSent: number, bytesTotal: number ) => void;
	onSuccess?: ( data?: unknown ) => void;
	onError?: ( err: unknown ) => void;
};

jest.mock( '../../../client/hooks/use-resumable-uploader', () => {
	const { useCallback, useState } = jest.requireActual( '@wordpress/element' );
	return {
		__esModule: true,
		default: jest.fn( options => {
			lastCallbacks = options;
			const [ resumeHandler, setResumeHandler ] = useState( undefined );
			mockEmitResumeHandler = () => setResumeHandler( { start: jest.fn(), abort: mockAbort } );
			const uploadHandler = useCallback( ( file: File ) => {
				mockUploadHandler( file );
				if ( ! mockDeferResumeHandler ) {
					setResumeHandler( { start: jest.fn(), abort: mockAbort } );
				}
			}, [] );
			return {
				onUploadHandler: jest.fn(),
				uploadHandler,
				resumeHandler,
				uploadingData: { bytesSent: 0, bytesTotal: 0, percent: 0, status: 'idle' },
				media: undefined,
				error: null,
			};
		} ),
	};
} );

const tokenError = () =>
	Object.assign( new Error( 'No token provided' ), {
		code: 'videopress_no_upload_token',
	} );

describe( 'useUpload', () => {
	beforeEach( () => {
		mockUploadHandler.mockClear();
		mockDeferResumeHandler = false;
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
		// Dispatched in the same tick, so the row is already claimed: a row
		// left 'pending' after dispatch is one another instance will dispatch
		// a second time.
		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'uploading' );
	} );

	it( 'stamps enqueuedAt once, at enqueue', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		act( () => {
			result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		const stamped = result.current.uploadQueue[ 0 ].enqueuedAt;
		expect( Date.parse( stamped ) ).not.toBeNaN();

		act( () => {
			lastCallbacks.onProgress?.( 50, 100 );
		} );
		expect( result.current.uploadQueue[ 0 ].enqueuedAt ).toBe( stamped );
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
		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'uploading' );
		expect( result.current.uploadQueue[ 0 ].error ).toBeUndefined();
		expect( result.current.uploadQueue[ 0 ].progress ).toBe( 0 );
	} );

	it( 'keeps the failed error message and its code on the queue item', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		act( () => {
			result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		act( () => {
			lastCallbacks.onError?.( tokenError() );
		} );

		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'failed' );
		expect( result.current.uploadQueue[ 0 ].error ).toBe( 'No token provided' );
		expect( result.current.uploadQueue[ 0 ].errorCode ).toBe( 'videopress_no_upload_token' );
	} );

	it( 'leaves errorCode unset for a failure that carried no code', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		act( () => {
			result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		act( () => {
			lastCallbacks.onError?.( new Error( 'boom' ) );
		} );

		expect( result.current.uploadQueue[ 0 ].error ).toBe( 'boom' );
		expect( result.current.uploadQueue[ 0 ].errorCode ).toBeUndefined();
	} );

	it( 'clears the previous failure when an item is retried', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		let id: string | undefined;
		act( () => {
			id = result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		act( () => {
			lastCallbacks.onError?.( tokenError() );
		} );
		act( () => {
			result.current.retryUpload( id! );
		} );

		expect( result.current.uploadQueue[ 0 ].error ).toBeUndefined();
		expect( result.current.uploadQueue[ 0 ].errorCode ).toBeUndefined();
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

	// Regression: the row used to stay 'pending' after being handed to the
	// legacy uploader, so any *other* instance settling its own upload found it
	// still waiting and dispatched the same file a second time.
	it( 'never hands one item to the legacy uploader twice across instances', () => {
		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result: producer } = renderHook( () => useUpload(), { wrapper } );
		const { result: observer } = renderHook( () => useUpload(), { wrapper } );
		// The observer's adapter callbacks, captured while it is the most
		// recently rendered instance. The closures only read refs and stable
		// callables, so this snapshot stays live.
		const observerCallbacks = lastCallbacks;

		const fileA = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const fileB = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );

		act( () => {
			producer.current.startUpload( fileA );
			observer.current.startUpload( fileB );
		} );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );

		// The observer settles its own upload and looks for more work.
		act( () => {
			observerCallbacks.onSuccess?.( { id: 78, guid: 'g78', src: 'https://v.example/78' } );
		} );

		expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );
		expect( mockUploadHandler.mock.calls.filter( ( [ f ] ) => f === fileA ) ).toHaveLength( 1 );
	} );

	// tus reports some failures as a bare string. Falling through to the generic
	// message threw away the only description of what actually went wrong.
	it( 'surfaces a string-shaped error as the row message', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		act( () => {
			result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );

		act( () => {
			lastCallbacks.onError?.( 'tus: failed because the request was aborted' );
		} );

		expect( result.current.uploadQueue[ 0 ].error ).toBe(
			'tus: failed because the request was aborted'
		);
	} );

	// The legacy callbacks carry no identity, so every instance receives its
	// own set and an idle one has no row to resolve them to. Acting on them
	// anyway hands this instance the queue's next pending item — dispatched a
	// second time, into a second set of callbacks, while it is already running.
	it( 'ignores callbacks that reach an instance holding no active upload', () => {
		const wrapper = createTestWrapper( createTestQueryClient() );
		const { result: producer } = renderHook( () => useUpload(), { wrapper } );
		const { result: observer } = renderHook( () => useUpload(), { wrapper } );
		// The observer's own callbacks. Its closures read its own refs, so this
		// snapshot stays live even once the producer renders last.
		const observerCallbacks = lastCallbacks;

		act( () => {
			producer.current.startUpload( new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } ) );
			producer.current.startUpload( new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } ) );
		} );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );

		act( () => {
			observerCallbacks.onProgress?.( 50, 100 );
			observerCallbacks.onSuccess?.( { id: 42, guid: 'g42', src: 'https://v.example/42' } );
			observerCallbacks.onError?.( new Error( 'boom' ) );
		} );

		expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );
		expect( observer.current.uploadQueue.map( u => u.status ) ).toEqual( [
			'uploading',
			'pending',
		] );
		expect( observer.current.uploadQueue.some( u => u.media || u.error ) ).toBe( false );
	} );

	it( 'marks the first publish as soon as a queued upload succeeds', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		expect( hasPublishedVideo() ).toBe( false );

		act( () => {
			result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		act( () => {
			lastCallbacks.onSuccess?.( { id: 42, guid: 'g', src: 'https://v.example/x' } );
		} );

		// Owned by the queue, not by the edit step: a multi-drop batch and a
		// Library upload both reach here, and neither goes through that step.
		expect( hasPublishedVideo() ).toBe( true );
	} );
} );

describe( 'useUpload — reload guard', () => {
	beforeEach( () => {
		mockUploadHandler.mockClear();
		mockDeferResumeHandler = false;
		lastCallbacks = {};
		__resetUploadStoreForTests();
	} );

	const unloadEvent = () => {
		const event = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( event );
		return event;
	};

	it( 'warns before unloading while an upload is in flight, and stops once it settles', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		expect( unloadEvent().defaultPrevented ).toBe( false );

		act( () => {
			result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		// The queue and its File objects are window-scoped: a reload loses the
		// upload with no way to resume it.
		expect( unloadEvent().defaultPrevented ).toBe( true );

		act( () => {
			lastCallbacks.onSuccess?.( { id: 42, guid: 'g', src: 'https://v.example/x' } );
		} );
		expect( unloadEvent().defaultPrevented ).toBe( false );
	} );
} );

describe( 'useUpload — success retention and acknowledgement', () => {
	beforeEach( () => {
		mockUploadHandler.mockClear();
		mockDeferResumeHandler = false;
		lastCallbacks = {};
		__resetUploadStoreForTests();
	} );

	const start = ( result: { current: ReturnType< typeof useUpload > } ) => {
		let id = '';
		act( () => {
			id = result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		return id;
	};

	it( 'keeps a succeeded item in the queue with its media result', () => {
		jest.useFakeTimers();
		try {
			const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
			start( result );
			act( () => {
				lastCallbacks.onSuccess?.( { id: 42, guid: 'abcd1234', src: 'https://v.example/x' } );
			} );

			// The old behavior deleted success rows after 2s — the id was
			// thrown away before anything could link to the finished video.
			act( () => {
				jest.advanceTimersByTime( 10_000 );
			} );

			expect( result.current.uploadQueue ).toHaveLength( 1 );
			expect( result.current.uploadQueue[ 0 ].status ).toBe( 'success' );
			expect( result.current.uploadQueue[ 0 ].media ).toEqual( {
				id: 42,
				guid: 'abcd1234',
				src: 'https://v.example/x',
			} );
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'acknowledgeUpload removes settled items', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const id = start( result );
		act( () => {
			lastCallbacks.onSuccess?.( { id: 42, guid: 'abcd1234', src: 'https://v.example/x' } );
		} );

		act( () => {
			result.current.acknowledgeUpload( id );
		} );

		expect( result.current.uploadQueue ).toHaveLength( 0 );
	} );

	it( 'acknowledgeUpload leaves in-flight items alone', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const id = start( result );
		act( () => {
			lastCallbacks.onProgress?.( 50, 100 );
		} );

		act( () => {
			result.current.acknowledgeUpload( id );
		} );

		expect( result.current.uploadQueue ).toHaveLength( 1 );
		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'uploading' );
	} );
} );

describe( 'useUpload — cancellation', () => {
	beforeEach( () => {
		mockUploadHandler.mockClear();
		mockDeferResumeHandler = false;
		mockEmitResumeHandler = undefined;
		mockAbort.mockClear();
		lastCallbacks = {};
		__resetUploadStoreForTests();
	} );

	it( 'removes a queued pending item without touching the active upload', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );
		let id2 = '';
		act( () => {
			result.current.startUpload( file1 );
			id2 = result.current.startUpload( file2 );
		} );

		act( () => {
			result.current.cancelUpload( id2 );
		} );

		expect( result.current.uploadQueue.map( u => u.file.name ) ).toEqual( [ 'a.mp4' ] );
		expect( mockAbort ).not.toHaveBeenCalled();
	} );

	it( 'aborts the active item via the tus handle, removes it, and dispatches the next pending', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );
		let id1 = '';
		act( () => {
			id1 = result.current.startUpload( file1 );
			result.current.startUpload( file2 );
		} );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );

		act( () => {
			result.current.cancelUpload( id1 );
		} );

		expect( mockAbort ).toHaveBeenCalledTimes( 1 );
		expect( result.current.uploadQueue.map( u => u.file.name ) ).toEqual( [ 'b.mp4' ] );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );
		expect( mockUploadHandler ).toHaveBeenLastCalledWith( file2 );
	} );

	it( 'is a no-op for settled items', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		let id = '';
		act( () => {
			id = result.current.startUpload( new File( [ 'x' ], 't.mp4', { type: 'video/mp4' } ) );
		} );
		act( () => {
			lastCallbacks.onSuccess?.( { id: 42, guid: 'abcd1234', src: 'https://v.example/x' } );
		} );

		act( () => {
			result.current.cancelUpload( id );
		} );

		expect( result.current.uploadQueue ).toHaveLength( 1 );
		expect( result.current.uploadQueue[ 0 ].status ).toBe( 'success' );
		expect( mockAbort ).not.toHaveBeenCalled();
	} );

	// A cancel is not a failure. The row used to be marked
	// `failed: 'Upload canceled'` whenever the cancelling instance held no tus
	// handle — untranslated debris that then offered the user Retry for
	// something they had just chosen to stop.
	it( 'removes the row and aborts the session when a non-owning instance cancels', () => {
		const client = createTestQueryClient();
		const wrapper = createTestWrapper( client );
		const { result: producer } = renderHook( () => useUpload(), { wrapper } );
		// The producer's adapter callbacks, captured before the observer
		// renders (each render overwrites lastCallbacks). The closures only
		// read refs and stable callables, so this snapshot stays live.
		const producerCallbacks = lastCallbacks;
		const { result: observer } = renderHook( () => useUpload(), { wrapper } );
		const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );
		let id1 = '';
		act( () => {
			id1 = producer.current.startUpload( file1 );
			producer.current.startUpload( file2 );
			producerCallbacks.onProgress?.( 10, 100 );
		} );

		act( () => {
			observer.current.cancelUpload( id1 );
		} );

		// The session map is store-level, so the observer aborts the owner's
		// session directly and hands the owner's slot back — the queue moves on
		// without waiting for a callback that an aborted session may never
		// send.
		expect( mockAbort ).toHaveBeenCalledTimes( 1 );
		expect( observer.current.uploadQueue.map( u => u.file.name ) ).toEqual( [ 'b.mp4' ] );
		expect( observer.current.uploadQueue.some( u => u.status === 'failed' ) ).toBe( false );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );
		expect( mockUploadHandler ).toHaveBeenLastCalledWith( file2 );
	} );

	// The mis-attribution case: cancelling during the upload-JWT round trip
	// leaves a tus session nobody can abort yet. Advancing the queue there
	// pointed the owner's callbacks at the NEXT row, so the orphan's media
	// landed on a file that had not finished uploading.
	it( 'does not attribute an orphaned session to the next item when cancelled before the handle exists', () => {
		mockDeferResumeHandler = true;
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );
		let id1 = '';
		act( () => {
			id1 = result.current.startUpload( file1 );
			result.current.startUpload( file2 );
		} );

		act( () => {
			result.current.cancelUpload( id1 );
		} );

		// Nothing to abort yet, so the queue deliberately parks rather than
		// dispatching file2 into the orphan's callbacks.
		expect( mockAbort ).not.toHaveBeenCalled();
		expect( result.current.uploadQueue.map( u => u.file.name ) ).toEqual( [ 'b.mp4' ] );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );

		// The orphaned session finishes anyway: its media must not land on b.mp4.
		act( () => {
			lastCallbacks.onSuccess?.( { id: 42, guid: 'gA', src: 'https://v.example/a' } );
		} );

		const remaining = result.current.uploadQueue[ 0 ];
		expect( remaining.file.name ).toBe( 'b.mp4' );
		expect( remaining.status ).toBe( 'uploading' );
		expect( remaining.media ).toBeUndefined();
		// …and the orphan's exit is what releases the queue.
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );
		expect( mockUploadHandler ).toHaveBeenLastCalledWith( file2 );
	} );

	// The other end of that same window. A cancel with nothing to abort can
	// only tombstone and wait, so the handle arriving afterwards is the first
	// moment the orphan can actually be stopped — and the last moment before
	// the owner would otherwise dispatch the next row into its callbacks.
	it( 'aborts a tombstoned session as soon as its tus handle arrives', () => {
		mockDeferResumeHandler = true;
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );
		let id1 = '';
		act( () => {
			id1 = result.current.startUpload( file1 );
			result.current.startUpload( file2 );
		} );

		act( () => {
			result.current.cancelUpload( id1 );
		} );
		expect( mockAbort ).not.toHaveBeenCalled();
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );

		// The upload-JWT round trip finally returns and tus hands over the
		// handle for the session the user already cancelled.
		act( () => {
			mockEmitResumeHandler?.();
		} );

		expect( mockAbort ).toHaveBeenCalledTimes( 1 );
		expect( result.current.uploadQueue.map( u => u.file.name ) ).toEqual( [ 'b.mp4' ] );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );
		expect( mockUploadHandler ).toHaveBeenLastCalledWith( file2 );
	} );

	// The handle FIFO is the only binding between a dispatch and the handle it
	// produced, so an id that never got one has to be skipped rather than
	// consume the next item's: bound one row out of step, a later cancel holds
	// an abort for a session that has already finished, and the row the user
	// actually stopped keeps uploading.
	it( 'binds a late handle past an id whose session ended before tus existed', () => {
		mockDeferResumeHandler = true;
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );
		let id2 = '';
		act( () => {
			result.current.startUpload( file1 );
			id2 = result.current.startUpload( file2 );
		} );

		// a.mp4's upload-JWT round trip fails: the session ends without ever
		// producing a handle, and b.mp4 is dispatched in its place.
		act( () => {
			lastCallbacks.onError?.( new Error( 'jwt' ) );
		} );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );

		// So the handle that lands now belongs to b.mp4, not to the dead a.mp4.
		act( () => {
			mockEmitResumeHandler?.();
		} );
		act( () => {
			result.current.cancelUpload( id2 );
		} );

		expect( mockAbort ).toHaveBeenCalledTimes( 1 );
		expect( result.current.uploadQueue.map( u => u.file.name ) ).toEqual( [ 'a.mp4' ] );
	} );

	// And with nothing dispatched behind it the FIFO simply runs dry, so the
	// late handle has no item to bind to and must disturb nothing.
	it( 'drops a late handle once every awaiting session has ended', () => {
		mockDeferResumeHandler = true;
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		act( () => {
			result.current.startUpload( new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } ) );
		} );
		act( () => {
			lastCallbacks.onError?.( new Error( 'jwt' ) );
		} );

		act( () => {
			mockEmitResumeHandler?.();
		} );

		expect( mockAbort ).not.toHaveBeenCalled();
		expect( result.current.uploadQueue.map( u => u.status ) ).toEqual( [ 'failed' ] );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );
	} );

	// Progress is the callback that arrives most often and the one with no
	// natural end: an orphan's bytes attributed to the live row move a bar the
	// user is watching, and nothing after it ever releases the queue.
	it( 'does not attribute an orphaned session progress to the next item', () => {
		mockDeferResumeHandler = true;
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );
		let id1 = '';
		act( () => {
			id1 = result.current.startUpload( file1 );
			result.current.startUpload( file2 );
		} );

		act( () => {
			result.current.cancelUpload( id1 );
		} );
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 1 );

		act( () => {
			lastCallbacks.onProgress?.( 50, 100 );
		} );

		const remaining = result.current.uploadQueue[ 0 ];
		expect( remaining.file.name ).toBe( 'b.mp4' );
		expect( remaining.progress ).toBe( 0 );
		// …and the orphan's first callback is what releases the queue.
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );
		expect( mockUploadHandler ).toHaveBeenLastCalledWith( file2 );
	} );

	// The failure counterpart of the success case above: a cancelled row must
	// not leave its error — and a Retry button — on the row dispatched after it.
	it( 'does not attribute an orphaned session failure to the next item', () => {
		mockDeferResumeHandler = true;
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const file1 = new File( [ 'x' ], 'a.mp4', { type: 'video/mp4' } );
		const file2 = new File( [ 'y' ], 'b.mp4', { type: 'video/mp4' } );
		let id1 = '';
		act( () => {
			id1 = result.current.startUpload( file1 );
			result.current.startUpload( file2 );
		} );

		act( () => {
			result.current.cancelUpload( id1 );
		} );

		act( () => {
			lastCallbacks.onError?.( new Error( 'boom' ) );
		} );

		const remaining = result.current.uploadQueue[ 0 ];
		expect( remaining.file.name ).toBe( 'b.mp4' );
		expect( remaining.status ).toBe( 'uploading' );
		expect( remaining.error ).toBeUndefined();
		expect( mockUploadHandler ).toHaveBeenCalledTimes( 2 );
		expect( mockUploadHandler ).toHaveBeenLastCalledWith( file2 );
	} );
} );

describe( 'upload store contract', () => {
	beforeEach( () => {
		mockUploadHandler.mockClear();
		mockDeferResumeHandler = false;
		lastCallbacks = {};
		__resetUploadStoreForTests();
	} );

	const startAndSucceed = (
		result: { current: ReturnType< typeof useUpload > },
		mediaId: number
	) => {
		let id = '';
		act( () => {
			id = result.current.startUpload( new File( [ 'x' ], `v${ mediaId }.mp4` ) );
		} );
		act( () => {
			lastCallbacks.onSuccess?.( {
				id: mediaId,
				guid: `g${ mediaId }`,
				src: `https://v.example/${ mediaId }`,
			} );
		} );
		return id;
	};

	it( 'setUploadDraft writes the edit session diff through to the row, and clears it', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		const id = startAndSucceed( result, 42 );

		act( () => {
			setUploadDraft( id, { title: 'Half-typed' } );
		} );
		expect( result.current.uploadQueue[ 0 ].draft ).toEqual( { title: 'Half-typed' } );

		act( () => {
			setUploadDraft( id, undefined );
		} );
		expect( result.current.uploadQueue[ 0 ].draft ).toBeUndefined();
	} );

	it( 'removeUploadRowsForMedia drops rows whose video is gone, matching across id types', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		startAndSucceed( result, 77 );
		startAndSucceed( result, 78 );
		expect( result.current.uploadQueue ).toHaveLength( 2 );

		act( () => {
			removeUploadRowsForMedia( [ '77' ] );
		} );

		expect( result.current.uploadQueue.map( u => u.media?.id ) ).toEqual( [ 78 ] );
	} );

	it( 'removeUploadRowsForMedia leaves rows that never bound to an attachment', () => {
		const { result } = renderHook( () => useUpload(), { wrapper: createTestWrapper() } );
		act( () => {
			result.current.startUpload( new File( [ 'x' ], 'inflight.mp4' ) );
		} );

		act( () => {
			removeUploadRowsForMedia( [ 77 ] );
		} );

		expect( result.current.uploadQueue ).toHaveLength( 1 );
	} );

	// A settled success is the flow's exit. Adopting it is what resurrected
	// finished edit sessions and left "processing" ghosts behind a delete.
	it( 'isAdoptableUpload covers in-flight and failed rows only', () => {
		const base = {
			id: 'u-1',
			file: new File( [ 'x' ], 't.mp4' ),
			progress: 0,
			enqueuedAt: '2026-08-13T10:00:00.000Z',
		};
		expect( isAdoptableUpload( { ...base, status: 'pending' } ) ).toBe( true );
		expect( isAdoptableUpload( { ...base, status: 'uploading' } ) ).toBe( true );
		expect( isAdoptableUpload( { ...base, status: 'failed' } ) ).toBe( true );
		expect( isAdoptableUpload( { ...base, status: 'success' } ) ).toBe( false );
	} );
} );
