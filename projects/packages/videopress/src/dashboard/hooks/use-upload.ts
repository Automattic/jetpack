// Adapter: wraps the legacy single-file resumable (tus) uploader from
// `../../client/hooks/use-resumable-uploader` and exposes a multi-item queue
// suitable for the modernised VideoPress dashboard.
//
// Legacy hook shape (as of reading use-resumable-uploader/index.ts):
//   useResumableUploader({ onProgress, onSuccess, onError })
//     onProgress( bytesSent: number, bytesTotal: number ) — raw bytes, no id
//     onSuccess( data: VideoMediaProps )                  — media object, no id
//     onError( err )                                      — error value, no id
//   returns { uploadHandler( file ), resumeHandler: { start, abort } | undefined, … }
//
// The legacy hook is designed around one active upload at a time. It manages
// its own internal state (uploadingData, media, error) and exposes a tus
// `resumeHandler` that is set asynchronously after the first uploadHandler call.
//
// Adapter strategy:
//   - We call useResumableUploader once per useUpload instance.
//   - The upload *queue* lives in a window-attached singleton store (mirrors
//     the QueryClientWrapper pattern) so multiple useUpload() consumers —
//     Library Stage that produces uploads and useFreeTier() that only
//     observes them — see the same items even when they sit in separately
//     code-split route bundles. Subscribers re-render via useSyncExternalStore.
//   - A per-instance `currentIdRef` ref tracks which queue item is being
//     handled by *this* instance's legacy uploader. Only the instance that
//     called startUpload owns the active upload; observer instances stay idle.
//   - startUpload appends to the queue; if the local instance is idle it
//     dispatches immediately, otherwise the item waits and is picked up
//     when the current upload settles (in onSuccess / onError).

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useSyncExternalStore } from '@wordpress/element';
import useResumableUploader from '../../client/hooks/use-resumable-uploader';
import { LIBRARY_QUERY_KEY } from './use-library';
import type { VideoMediaProps } from '../../client/lib/resumable-file-uploader/types';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'failed';

export type UploadItem = {
	id: string;
	file: File;
	progress: number; // 0..1
	status: UploadStatus;
	error?: string;
	/**
	 * The created video, present once `status` is `success`. This is what
	 * lets anything downstream — the upload pill, the upload→edit
	 * transition — link to `/video/:id` for a finished upload.
	 */
	media?: VideoMediaProps;
	/**
	 * Which flow started this upload (e.g. 'onboarding'). The queue outlives
	 * any component — the first upload on a first-run site flips the tab
	 * order mid-flight and remounts the flow that started it — so the flow
	 * re-finds its own items by this tag rather than holding the only
	 * pointer in remountable state.
	 */
	context?: string;
};

const STORE_KEY = '__jetpackVideopressUploadStore' as const;

type UploadStore = {
	queue: UploadItem[];
	subscribers: Set< () => void >;
};

declare global {
	interface Window {
		[ STORE_KEY ]?: UploadStore;
	}
}

/**
 * Return the singleton upload store, creating it on first access. The store
 * lives on `window` so separately-built route bundles share one queue.
 *
 * @return The shared upload store.
 */
function getStore(): UploadStore {
	if ( ! window[ STORE_KEY ] ) {
		window[ STORE_KEY ] = { queue: [], subscribers: new Set() };
	}
	return window[ STORE_KEY ];
}

/**
 * Subscribe to upload-store changes. Returns an unsubscribe callback.
 *
 * @param notify - Called when the queue changes.
 * @return Unsubscribe.
 */
function subscribeStore( notify: () => void ): () => void {
	const store = getStore();
	store.subscribers.add( notify );
	return () => {
		store.subscribers.delete( notify );
	};
}

/**
 * Read the current queue snapshot. Must return a stable reference between
 * mutations so useSyncExternalStore can short-circuit unchanged renders.
 *
 * @return The current upload queue.
 */
function readQueue(): UploadItem[] {
	return getStore().queue;
}

/**
 * Apply a synchronous updater to the queue and notify subscribers.
 *
 * @param updater - Pure function producing the next queue.
 */
function mutateQueue( updater: ( prev: UploadItem[] ) => UploadItem[] ): void {
	const store = getStore();
	store.queue = updater( store.queue );
	store.subscribers.forEach( cb => cb() );
}

/**
 * Reset the shared upload store. Intended for tests; production code should
 * not call this.
 */
export function __resetUploadStoreForTests(): void {
	if ( window[ STORE_KEY ] ) {
		window[ STORE_KEY ].queue = [];
	}
}

/**
 * Generate a unique id for a new upload queue item.
 *
 * @param file - The file being uploaded.
 * @return A unique string id prefixed with "upload-".
 */
function makeId( file: File ): string {
	return `upload-${ Date.now() }-${ Math.random().toString( 36 ).slice( 2, 7 ) }-${ file.name }`;
}

/**
 * Subscribe to the shared upload queue via useSyncExternalStore so the
 * queue is a single source of truth across every useUpload() instance.
 *
 * @return The current upload queue.
 */
function useUploadQueue(): UploadItem[] {
	return useSyncExternalStore( subscribeStore, readQueue, readQueue );
}

/**
 * Wrap the legacy resumable (tus) uploader in a multi-item upload queue
 * backed by a window-attached singleton store.
 *
 * @return An object with the current upload queue and handlers to start or retry uploads.
 */
export function useUpload() {
	const client = useQueryClient();
	const queue = useUploadQueue();

	// Tracks which queue item is being handled by *this* instance's
	// legacy uploader. Only the instance that called startUpload (and
	// thus invoked uploadHandler) sets this; observer instances leave it
	// null because their legacy uploader is idle.
	const currentIdRef = useRef< string | null >( null );

	// uploadHandler is captured in a ref so callbacks can dispatch the
	// next pending upload without depending on the render-by-render
	// identity of `useResumableUploader`'s return value.
	const uploadHandlerRef = useRef< ( ( file: File ) => void ) | null >( null );

	// The legacy uploader's tus handle, captured per render like
	// uploadHandler. It appears asynchronously (after the upload-JWT round
	// trip), so a cancel that lands before it exists has nothing to abort —
	// the item is still dropped from the queue either way.
	const resumeHandlerRef = useRef< { start: () => void; abort: () => void } | undefined >(
		undefined
	);

	const startNextPending = useCallback( () => {
		const next = readQueue().find( item => item.status === 'pending' );
		if ( next && uploadHandlerRef.current ) {
			currentIdRef.current = next.id;
			uploadHandlerRef.current( next.file );
		} else {
			currentIdRef.current = null;
		}
	}, [] );

	// Adapter callbacks — translate the legacy (bytesSent, bytesTotal) /
	// (data: VideoMediaProps) / (err) signatures to queue-item updates.
	//
	// Each callback first checks the current item against the queue: while an
	// item is this instance's active upload, only an external cancel (see
	// cancelUpload) can remove it or flip it to 'failed' — this instance's own
	// onError immediately moves currentIdRef along. Detecting that here is
	// what lets a non-owning instance cancel an upload it holds no tus handle
	// for: the owner aborts its session on the next callback and moves on.
	const { uploadHandler, resumeHandler } = useResumableUploader( {
		onProgress: ( bytesSent: number, bytesTotal: number ) => {
			const id = currentIdRef.current;
			if ( ! id ) {
				return;
			}
			const current = readQueue().find( item => item.id === id );
			if ( ! current || current.status === 'failed' ) {
				// Canceled externally — stop the tus session instead of
				// resurrecting the row with fresh progress.
				resumeHandlerRef.current?.abort();
				startNextPending();
				return;
			}
			const progress = bytesTotal > 0 ? bytesSent / bytesTotal : 0;
			mutateQueue( prev =>
				prev.map( item => ( item.id === id ? { ...item, progress, status: 'uploading' } : item ) )
			);
		},
		onSuccess: ( data: VideoMediaProps ) => {
			const id = currentIdRef.current;
			if ( ! id ) {
				return;
			}
			const current = readQueue().find( item => item.id === id );
			if ( current && current.status !== 'failed' ) {
				// Succeeded items stay in the queue, carrying their media result,
				// until a consumer acknowledges them — the upload pill links to
				// the finished video, and the upload→edit transition needs the id.
				// (They used to self-delete after 2s, which threw the id away.)
				mutateQueue( prev =>
					prev.map( item =>
						item.id === id ? { ...item, progress: 1, status: 'success', media: data } : item
					)
				);
			}
			// A cancel that loses the race with the last byte keeps its
			// canceled row, but the attachment now exists — refetch the
			// library either way so it lists.
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
			startNextPending();
		},
		onError: ( err: unknown ) => {
			const id = currentIdRef.current;
			if ( ! id ) {
				return;
			}
			const current = readQueue().find( item => item.id === id );
			if ( ! current || current.status === 'failed' ) {
				// An abort can surface as an error; keep the canceled state
				// rather than overwriting it with the transport's message.
				startNextPending();
				return;
			}
			let message = 'Upload failed';
			if ( err instanceof Error ) {
				message = err.message;
			} else if ( typeof err === 'string' ) {
				message = err;
			}
			mutateQueue( prev =>
				prev.map( item =>
					item.id === id ? { ...item, status: 'failed', error: message } : item
				)
			);
			// Failed items stay in the queue so the user can retry. Move
			// on to the next pending item rather than blocking the queue.
			startNextPending();
		},
	} );

	uploadHandlerRef.current = uploadHandler;
	resumeHandlerRef.current = resumeHandler;

	const startUpload = useCallback(
		( file: File, context?: string ): string => {
			const id = makeId( file );
			mutateQueue( prev => [ ...prev, { id, file, progress: 0, status: 'pending', context } ] );
			// Only dispatch immediately when this instance's legacy
			// uploader is idle. Otherwise the item waits in the queue
			// and is picked up by startNextPending when the active
			// upload settles.
			if ( ! currentIdRef.current ) {
				currentIdRef.current = id;
				uploadHandler( file );
			}
			return id;
		},
		[ uploadHandler ]
	);

	/**
	 * Remove a settled (succeeded or failed) item from the queue once its
	 * outcome has been surfaced to the user. In-flight items are left alone —
	 * cancellation is a different operation from acknowledgement.
	 */
	const acknowledgeUpload = useCallback( ( id: string ) => {
		mutateQueue( prev =>
			prev.filter(
				item => item.id !== id || ( item.status !== 'success' && item.status !== 'failed' )
			)
		);
	}, [] );

	// Cancel an upload. Semantics by state:
	// - pending: removed outright — no tus session exists yet.
	// - active in THIS instance: the tus session aborts via the legacy
	//   uploader's resumeHandler, the item is removed, and the next pending
	//   item dispatches.
	// - active in ANOTHER instance: only the owning instance holds the tus
	//   handle, so the item is marked failed ("Upload canceled") rather than
	//   left zombied; the owner's next adapter callback finds its current
	//   item failed, aborts its session, and moves on (see the callbacks
	//   above). The row then behaves like any failure — visible until
	//   acknowledged, retryable.
	// - settled: no-op — acknowledge/retry own those states.
	const cancelUpload = useCallback(
		( id: string ) => {
			const item = readQueue().find( q => q.id === id );
			if ( ! item ) {
				return;
			}
			if ( currentIdRef.current === id ) {
				resumeHandlerRef.current?.abort();
				mutateQueue( prev => prev.filter( q => q.id !== id ) );
				startNextPending();
				return;
			}
			if ( item.status === 'pending' ) {
				mutateQueue( prev => prev.filter( q => q.id !== id ) );
				return;
			}
			if ( item.status === 'uploading' ) {
				mutateQueue( prev =>
					prev.map( q =>
						q.id === id ? { ...q, status: 'failed', error: 'Upload canceled' } : q
					)
				);
			}
		},
		[ startNextPending ]
	);

	const retryUpload = useCallback(
		( id: string ) => {
			const item = readQueue().find( q => q.id === id );
			if ( ! item ) {
				return;
			}
			mutateQueue( prev =>
				prev.map( q =>
					q.id === id ? { ...q, status: 'pending', progress: 0, error: undefined } : q
				)
			);
			// Dispatch immediately if idle; otherwise wait for the
			// active upload to settle and startNextPending to pick this
			// up.
			if ( ! currentIdRef.current ) {
				currentIdRef.current = id;
				uploadHandler( item.file );
			}
		},
		[ uploadHandler ]
	);

	return {
		uploadQueue: queue,
		startUpload,
		retryUpload,
		cancelUpload,
		acknowledgeUpload,
	};
}
