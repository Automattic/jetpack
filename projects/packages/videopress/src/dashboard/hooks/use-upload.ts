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
// The legacy hook is designed around one active upload at a time.  It manages
// its own internal state (uploadingData, media, error) and exposes a tus
// `resumeHandler` that is set asynchronously after the first uploadHandler call.
//
// Adapter strategy:
//   - We call useResumableUploader once per useUpload instance.
//   - A `currentIdRef` ref tracks which queue item is "active" so the
//     callback bodies can route progress / success / error updates correctly.
//   - `startUpload` sets currentIdRef then calls uploadHandler(file).
//   - `retryUpload` resets the item's status and calls uploadHandler again;
//     tus automatically resumes from its stored fingerprint when available.
//     (The legacy resumeHandler.start() path is not used here because it
//     operates on the *same* upload object created in the previous call, which
//     may be gone after a page interaction — calling uploadHandler afresh is
//     safer and still benefits from tus fingerprint resumption.)

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from '@wordpress/element';
import useResumableUploader from '../../client/hooks/use-resumable-uploader';
import { LIBRARY_QUERY_KEY } from './use-library';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'failed';

export type UploadItem = {
	id: string;
	file: File;
	progress: number; // 0..1
	status: UploadStatus;
	error?: string;
};

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
 * Wrap the legacy resumable (tus) uploader in a multi-item upload queue.
 *
 * @return An object with the current upload queue and handlers to start or retry uploads.
 */
export function useUpload() {
	const client = useQueryClient();
	const [ queue, setQueue ] = useState< UploadItem[] >( [] );

	// Tracks which queue item is currently active inside the legacy hook's
	// single-upload state machine.  Using a ref avoids stale-closure issues
	// inside the callbacks passed to useResumableUploader.
	const currentIdRef = useRef< string | null >( null );

	const patch = useCallback( ( id: string, next: Partial< UploadItem > ) => {
		setQueue( prev => prev.map( item => ( item.id === id ? { ...item, ...next } : item ) ) );
	}, [] );

	const remove = useCallback( ( id: string ) => {
		setQueue( prev => prev.filter( item => item.id !== id ) );
	}, [] );

	// Adapter callbacks — translate the legacy (bytesSent, bytesTotal) /
	// (data: VideoMediaProps) / (err) signatures to our queue-item updates.
	const { uploadHandler } = useResumableUploader( {
		onProgress: ( bytesSent: number, bytesTotal: number ) => {
			const id = currentIdRef.current;
			if ( ! id ) {
				return;
			}
			const progress = bytesTotal > 0 ? bytesSent / bytesTotal : 0;
			patch( id, { progress, status: 'uploading' } );
		},
		onSuccess: () => {
			const id = currentIdRef.current;
			if ( ! id ) {
				return;
			}
			patch( id, { progress: 1, status: 'success' } );
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
			window.setTimeout( () => {
				remove( id );
				// Clear the ref only after the removal timeout so that any
				// late-arriving callbacks still resolve to the right item.
				if ( currentIdRef.current === id ) {
					currentIdRef.current = null;
				}
			}, 2_000 );
		},
		onError: ( err: unknown ) => {
			const id = currentIdRef.current;
			if ( ! id ) {
				return;
			}
			let message = 'Upload failed';
			if ( err instanceof Error ) {
				message = err.message;
			} else if ( typeof err === 'string' ) {
				message = err;
			}
			patch( id, { status: 'failed', error: message } );
			currentIdRef.current = null;
		},
	} );

	const startUpload = useCallback(
		( file: File ): string => {
			const id = makeId( file );
			currentIdRef.current = id;
			setQueue( prev => [ ...prev, { id, file, progress: 0, status: 'pending' } ] );
			// uploadHandler is async (fetches a JWT before starting tus) but we
			// don't await it here — progress flows via the callbacks above.
			uploadHandler( file );
			return id;
		},
		[ uploadHandler ]
	);

	const retryUpload = useCallback(
		( id: string ) => {
			const item = queue.find( q => q.id === id );
			if ( ! item ) {
				return;
			}
			currentIdRef.current = id;
			patch( id, { status: 'pending', progress: 0, error: undefined } );
			// Re-invoke uploadHandler; tus will find the stored fingerprint and
			// resume from where the previous attempt left off.
			uploadHandler( item.file );
		},
		[ queue, patch, uploadHandler ]
	);

	return {
		uploadQueue: queue,
		startUpload,
		retryUpload,
	};
}
