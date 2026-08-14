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
//   - The store also holds a per-id session map and a tombstone set. The
//     legacy callbacks carry no identity, so those two are the only way to
//     tell a live session's events from an orphaned one's — see
//     `cancelUpload` and the resume-handle binding effect.

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useSyncExternalStore } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useResumableUploader from '../../client/hooks/use-resumable-uploader';
import { markFirstPublish } from './use-first-run-state';
import { LIBRARY_QUERY_KEY } from './use-library';
import type { VideoMediaProps } from '../../client/lib/resumable-file-uploader/types';
import type { VideoDetailsFormValues } from '../components/video-details/use-video-details-form';

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
	/**
	 * ISO timestamp stamped once at enqueue. Anything that needs a date for a
	 * row that has no server record yet — the Library's optimistic splice, a
	 * pill row — reads this, so the date doesn't move on every re-render.
	 */
	enqueuedAt: string;
	/**
	 * Dirty-field diff written through from the edit session, hydrated by
	 * `/video/:id` on arrival. Form state lives inside the editor, which the
	 * upload step cannot read at navigate time, so the draft travels on the
	 * row rather than being stashed at the handoff.
	 */
	draft?: Partial< VideoDetailsFormValues >;
};

const STORE_KEY = '__jetpackVideopressUploadStore' as const;

type UploadSession = {
	/** Bound once tus hands the handle over — absent during the JWT round trip. */
	abort?: () => void;
	/**
	 * Shut the session down and let the owning instance dispatch its next
	 * item. Closed over the owner's refs, so any instance can call it: a
	 * cancel from a mount that holds no legacy uploader still unblocks the
	 * queue instead of parking the owner on a dead session.
	 */
	release: () => void;
};

type UploadStore = {
	queue: UploadItem[];
	subscribers: Set< () => void >;
	/** Dispatched queue id → its tus session. Absent means "never dispatched". */
	sessions: Map< string, UploadSession >;
	/**
	 * Ids whose row is gone but whose tus session may still emit. The owning
	 * instance checks this before attributing any callback, so an orphan's
	 * late progress/success can never land on the row dispatched after it.
	 */
	tombstones: Set< string >;
	/** The installed beforeunload guard, while any row is in flight. */
	unloadGuard?: ( event: BeforeUnloadEvent ) => void;
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
		window[ STORE_KEY ] = {
			queue: [],
			subscribers: new Set(),
			sessions: new Map(),
			tombstones: new Set(),
		};
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
 * Install or remove the reload guard. The queue and its File objects are
 * window-scoped and unrecoverable after a reload, so an in-flight upload lost
 * to a stray refresh cannot be resumed — only warned about.
 *
 * @param store - The shared upload store.
 */
function syncUnloadGuard( store: UploadStore ): void {
	const hasInFlight = store.queue.some(
		item => item.status === 'pending' || item.status === 'uploading'
	);
	if ( hasInFlight && ! store.unloadGuard ) {
		const guard = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			// Chrome still requires returnValue to be set.
			event.returnValue = '';
		};
		store.unloadGuard = guard;
		window.addEventListener( 'beforeunload', guard );
	} else if ( ! hasInFlight && store.unloadGuard ) {
		window.removeEventListener( 'beforeunload', store.unloadGuard );
		store.unloadGuard = undefined;
	}
}

/**
 * Apply a synchronous updater to the queue and notify subscribers.
 *
 * A no-op update is dropped rather than published: every mutation helper here
 * builds a fresh array, and publishing an equivalent one would re-render every
 * subscriber on writes that changed nothing (a delete that matched no row, a
 * draft write of unchanged values).
 *
 * @param updater - Pure function producing the next queue.
 */
function mutateQueue( updater: ( prev: UploadItem[] ) => UploadItem[] ): void {
	const store = getStore();
	const prev = store.queue;
	const next = updater( prev );
	if ( next.length === prev.length && next.every( ( item, index ) => item === prev[ index ] ) ) {
		return;
	}
	store.queue = next;
	syncUnloadGuard( store );
	store.subscribers.forEach( cb => cb() );
}

/**
 * Reset the shared upload store. Intended for tests; production code should
 * not call this.
 */
export function __resetUploadStoreForTests(): void {
	const store = window[ STORE_KEY ];
	if ( ! store ) {
		return;
	}
	store.queue = [];
	store.sessions.clear();
	store.tombstones.clear();
	syncUnloadGuard( store );
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
 * Write (or clear) the edit session's dirty-field diff on a queue row.
 *
 * Store-level rather than part of the hook: the edit session writes through on
 * every keystroke, and the row must carry the draft across the handoff to
 * `/video/:id` and across the remounts the tab order causes mid-flow.
 *
 * @param id    - Queue item id.
 * @param draft - The dirty-field diff, or undefined to clear it.
 */
export function setUploadDraft(
	id: string,
	draft: Partial< VideoDetailsFormValues > | undefined
): void {
	mutateQueue( prev => prev.map( item => ( item.id === id ? { ...item, draft } : item ) ) );
}

/**
 * Drop every queue row bound to one of the given attachment ids.
 *
 * A deleted video leaves its success row behind otherwise: the pill keeps
 * offering "Add details" for a 404, and the upload flow re-adopts the dead row
 * into an eternal "processing" state.
 *
 * @param mediaIds - Attachment ids that no longer exist.
 */
export function removeUploadRowsForMedia( mediaIds: Array< number | string > ): void {
	const gone = new Set( mediaIds.map( String ) );
	mutateQueue( prev =>
		prev.filter( item => item.media === undefined || ! gone.has( String( item.media.id ) ) )
	);
}

/**
 * Whether a surface remounting mid-flow should re-adopt this row.
 *
 * Only rows that still have something to say: an upload in flight, or a
 * failure the user has not seen the end of. A settled success is the flow's
 * exit*, and adopting it resurrects a finished edit session — the "haunting"
 * this predicate exists to stop.
 *
 * @param item - The queue item.
 * @return True when the item is worth adopting.
 */
export function isAdoptableUpload( item: UploadItem ): boolean {
	return item.status === 'pending' || item.status === 'uploading' || item.status === 'failed';
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

	// Queue ids dispatched but not yet handed a tus handle, oldest first. The
	// legacy uploader publishes `resumeHandler` through state one round trip
	// after the dispatch that produced it, and publishes exactly one per
	// dispatch — so FIFO is the binding, and reading `currentIdRef` at
	// binding time would mis-bind a handle that arrived after its own item
	// settled.
	const awaitingHandleRef = useRef< string[] >( [] );

	// `abandonSession` is defined below (it needs startNextPending, which needs
	// the dispatcher) but has to be reachable from a session registered at
	// dispatch time. The ref is the only knot that unties that cycle.
	const abandonSessionRef = useRef< ( id: string ) => void >( () => {} );

	/**
	 * Claim a queue item for this instance and hand it to the legacy uploader.
	 *
	 * The status flips to 'uploading' in the same mutation that claims the
	 * item, before the handler runs: another instance's startNextPending scans
	 * for 'pending' rows, and a row left pending after dispatch gets handed to
	 * the legacy uploader a second time.
	 */
	const dispatchItem = useCallback( ( id: string, file: File ) => {
		currentIdRef.current = id;
		getStore().sessions.set( id, { release: () => abandonSessionRef.current( id ) } );
		awaitingHandleRef.current.push( id );
		mutateQueue( prev =>
			prev.map( item => ( item.id === id ? { ...item, status: 'uploading' } : item ) )
		);
		uploadHandlerRef.current?.( file );
	}, [] );

	const startNextPending = useCallback( () => {
		const next = readQueue().find( item => item.status === 'pending' );
		if ( next && uploadHandlerRef.current ) {
			dispatchItem( next.id, next.file );
		} else {
			currentIdRef.current = null;
		}
	}, [ dispatchItem ] );

	/**
	 * Whether the callback now firing still belongs to a live row. False for a
	 * canceled session (row removed, id tombstoned) and for a row deleted out
	 * from under an active upload.
	 */
	const isLiveCurrent = useCallback( ( id: string ): boolean => {
		return ! getStore().tombstones.has( id ) && readQueue().some( item => item.id === id );
	}, [] );

	/**
	 * Forget a session that has run its course, and dispatch this instance's
	 * next pending item if `id` was the one it was holding.
	 */
	const finishSession = useCallback(
		( id: string ) => {
			const store = getStore();
			store.sessions.delete( id );
			store.tombstones.delete( id );
			if ( currentIdRef.current === id ) {
				currentIdRef.current = null;
				startNextPending();
			}
		},
		[ startNextPending ]
	);

	/** Stop a session that should not run to completion, then forget it. */
	const abandonSession = useCallback(
		( id: string ) => {
			getStore().sessions.get( id )?.abort?.();
			finishSession( id );
		},
		[ finishSession ]
	);
	abandonSessionRef.current = abandonSession;

	// Adapter callbacks — translate the legacy (bytesSent, bytesTotal) /
	// (data: VideoMediaProps) / (err) signatures to queue-item updates.
	//
	// Every callback resolves its row through isLiveCurrent first. The legacy
	// callbacks carry no identity, so an orphaned session (canceled while its
	// JWT round trip was still in flight, when there was nothing to abort)
	// would otherwise be attributed to whatever this instance dispatched next —
	// cross-attributed media and progress cross-talk.
	const { uploadHandler, resumeHandler } = useResumableUploader( {
		onProgress: ( bytesSent: number, bytesTotal: number ) => {
			const id = currentIdRef.current;
			if ( ! id ) {
				return;
			}
			if ( ! isLiveCurrent( id ) ) {
				abandonSession( id );
				return;
			}
			const progress = bytesTotal > 0 ? bytesSent / bytesTotal : 0;
			mutateQueue( prev =>
				prev.map( item => ( item.id === id ? { ...item, progress, status: 'uploading' } : item ) )
			);
		},
		onSuccess: ( data: VideoMediaProps ) => {
			const id = currentIdRef.current;
			// The attachment exists on the server whichever row this belongs
			// to — a cancel that lost the race with the last byte still leaves
			// a video — so refetch the library either way.
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
			if ( ! id ) {
				return;
			}
			if ( ! isLiveCurrent( id ) ) {
				abandonSession( id );
				return;
			}
			// Succeeded items stay in the queue, carrying their media result,
			// until a consumer acknowledges them — the upload pill links to
			// the finished video, and the upload→edit transition needs the id.
			// (They used to self-delete after 2s, which threw the id away.)
			mutateQueue( prev =>
				prev.map( item =>
					item.id === id ? { ...item, progress: 1, status: 'success', media: data } : item
				)
			);
			// First run ends the moment a video reaches the backend, whatever
			// started it. Owning this here rather than in the edit step is what
			// makes it true for every row of a multi-drop batch and for uploads
			// begun from the Library, which never touch that step.
			markFirstPublish();
			finishSession( id );
		},
		onError: ( err: unknown ) => {
			const id = currentIdRef.current;
			if ( ! id ) {
				return;
			}
			if ( ! isLiveCurrent( id ) ) {
				abandonSession( id );
				return;
			}
			let message: string = __( 'Upload failed.', 'jetpack-videopress-pkg' );
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
			finishSession( id );
		},
	} );

	uploadHandlerRef.current = uploadHandler;

	// Bind the tus handle to the item it was dispatched for. Until this runs
	// the session has no abort — cancelling in that window can only tombstone
	// and wait, which is why a tombstoned id is aborted here the moment its
	// handle arrives instead of dispatching the next item into its callbacks.
	useEffect( () => {
		if ( ! resumeHandler ) {
			return;
		}
		const store = getStore();
		// Skip ids whose session already ended without ever producing a handle
		// (a failed upload-JWT round trip errors before tus exists), so the
		// FIFO never drifts out of step with the handles it is binding.
		let id = awaitingHandleRef.current.shift();
		while ( id && ! store.sessions.has( id ) ) {
			id = awaitingHandleRef.current.shift();
		}
		if ( ! id ) {
			return;
		}
		const session = store.sessions.get( id );
		if ( session ) {
			session.abort = resumeHandler.abort;
		}
		if ( store.tombstones.has( id ) ) {
			abandonSession( id );
		}
	}, [ resumeHandler, abandonSession ] );

	const startUpload = useCallback(
		( file: File, context?: string ): string => {
			const id = makeId( file );
			mutateQueue( prev => [
				...prev,
				{
					id,
					file,
					progress: 0,
					status: 'pending',
					context,
					enqueuedAt: new Date().toISOString(),
				},
			] );
			// Only dispatch immediately when this instance's legacy
			// uploader is idle. Otherwise the item waits in the queue
			// and is picked up by startNextPending when the active
			// upload settles.
			if ( ! currentIdRef.current ) {
				dispatchItem( id, file );
			}
			return id;
		},
		[ dispatchItem ]
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

	// Cancel an upload: the row goes, from any instance. There is no 'canceled'
	// status — a user-initiated cancel is not a failure, and leaving debris
	// that offers Retry misreads the intent entirely.
	//
	// Aborting the tus session is the part that cannot always happen here. The
	// session map is store-level, so a non-owning instance aborts just as
	// directly as the owner. But the handle only materializes after the
	// upload-JWT round trip, so a cancel landing inside that window has nothing
	// to abort: it tombstones the id and leaves the owner parked on it, which
	// is what stops the next item being dispatched into the orphan's
	// callbacks. The owner aborts and advances as soon as the handle lands (or
	// on the orphan's first callback, whichever comes first).
	//
	// Settled rows are a no-op — acknowledge/retry own those states.
	const cancelUpload = useCallback( ( id: string ) => {
		const item = readQueue().find( q => q.id === id );
		if ( ! item || item.status === 'success' || item.status === 'failed' ) {
			return;
		}
		const store = getStore();
		const session = store.sessions.get( id );
		if ( ! session ) {
			// Never dispatched: no session to abort, no owner to notify.
			mutateQueue( prev => prev.filter( q => q.id !== id ) );
			return;
		}
		store.tombstones.add( id );
		mutateQueue( prev => prev.filter( q => q.id !== id ) );
		if ( session.abort ) {
			session.release();
		}
	}, [] );

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
				dispatchItem( id, item.file );
			}
		},
		[ dispatchItem ]
	);

	return {
		uploadQueue: queue,
		startUpload,
		retryUpload,
		cancelUpload,
		acknowledgeUpload,
	};
}
