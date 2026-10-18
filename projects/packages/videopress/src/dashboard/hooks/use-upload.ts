import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { useCallback, useSyncExternalStore } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { UploadTokenError } from '../../client/hooks/use-resumable-uploader';
import getMediaToken from '../../client/lib/get-media-token';
import resumableFileUploader from '../../client/lib/resumable-file-uploader';
import { syncChapters } from '../../client/utils/video-chapters/sync-chapters';
import { LIBRARY_QUERY_KEY, toLibraryItem } from './use-library';
import { patchToApi } from './use-update-video-meta';
import type { ApiMediaItem } from './use-library';
import type { VideoMediaProps } from '../../client/lib/resumable-file-uploader/types';
import type { VideoDetailsPatch } from '../types/library';
import type { QueryClient } from '@tanstack/react-query';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'failed';

export type UploadItem = {
	id: string;
	file: File;
	progress: number;
	status: UploadStatus;
	error?: string;
	errorCode?: string;
	mediaId?: string;
	media?: VideoMediaProps;
	/** The metadata accepted by Save, excluding any subsequent form edits. */
	details?: VideoDetailsPatch;
	isSavingDetails?: boolean;
	detailsError?: boolean;
};

const STORE_KEY = '__jetpackVideopressUploadStore' as const;
const SUCCESS_REMOVAL_DELAY_MS = 2_000;

type UploadSnapshot = {
	queue: UploadItem[];
	completed: Record< string, string >;
};

type UploadStore = {
	snapshot: UploadSnapshot;
	activeId: string | null;
	subscribers: Set< () => void >;
};

declare global {
	interface Window {
		[ STORE_KEY ]?: UploadStore;
	}
}

/**
 * Share the queue and its worker across separately built route bundles.
 *
 * @return The upload store.
 */
function getStore(): UploadStore {
	if ( ! window[ STORE_KEY ] ) {
		window[ STORE_KEY ] = {
			snapshot: { queue: [], completed: {} },
			activeId: null,
			subscribers: new Set(),
		};
	}
	return window[ STORE_KEY ];
}

const readSnapshot = () => getStore().snapshot;
const readItem = ( id: string ) => readSnapshot().queue.find( item => item.id === id );

const subscribeStore = ( notify: () => void ) => {
	const store = getStore();
	store.subscribers.add( notify );
	return () => {
		store.subscribers.delete( notify );
	};
};

const updateSnapshot = ( patch: Partial< UploadSnapshot > ) => {
	const store = getStore();
	store.snapshot = { ...store.snapshot, ...patch };
	store.subscribers.forEach( notify => notify() );
};

const updateItem = ( id: string, patch: Partial< UploadItem > ) => {
	updateSnapshot( {
		queue: readSnapshot().queue.map( item => ( item.id === id ? { ...item, ...patch } : item ) ),
	} );
};

/** Reset the upload store between tests. */
export function __resetUploadStoreForTests(): void {
	delete window[ STORE_KEY ];
}

/**
 * Save deferred edits before handing the temporary route over to its attachment.
 *
 * @param id     - Temporary upload ID.
 * @param client - Shared query client.
 */
async function finishUpload( id: string, client: QueryClient ): Promise< void > {
	const initial = readItem( id );
	if ( ! initial?.media || initial.isSavingDetails ) {
		return;
	}
	updateItem( id, { isSavingDetails: true, detailsError: false } );
	if ( initial.details ) {
		// The free-tier count skips finished uploads, so list this one while its edits save.
		void client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
	}
	try {
		let saved: VideoDetailsPatch | undefined;
		// Save clicks during a request must be applied before the form changes routes.
		while ( readItem( id )?.details !== saved ) {
			const details = readItem( id )?.details;
			await apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: { id: initial.media.id, ...patchToApi( details ) },
			} );
			if ( details.description !== undefined ) {
				const raw = await apiFetch< ApiMediaItem >( {
					path: `/wp/v2/media/${ initial.media.id }`,
				} );
				await syncChapters( toLibraryItem( raw, isSimpleSite() ), details.description, {
					onWarning: message =>
						dispatch( noticesStore ).createWarningNotice( message, { type: 'snackbar' } ),
				} );
			}
			saved = details;
		}
		updateItem( id, { isSavingDetails: false } );
		updateSnapshot( { completed: { ...readSnapshot().completed, [ id ]: initial.mediaId } } );
		await client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		window.setTimeout( () => {
			updateSnapshot( { queue: readSnapshot().queue.filter( item => item.id !== id ) } );
		}, SUCCESS_REMOVAL_DELAY_MS );
	} catch {
		updateItem( id, { isSavingDetails: false, detailsError: true } );
	}
}

/**
 * Run one transport at a time, independently of the route that enqueued it.
 *
 * @param client - Shared query client.
 */
async function startNextPending( client: QueryClient ): Promise< void > {
	const store = getStore();
	if ( store.activeId ) {
		return;
	}
	const next = readSnapshot().queue.find( item => item.status === 'pending' );
	if ( ! next ) {
		return;
	}
	const { id, file } = next;
	store.activeId = id;
	let settled = false;
	const settle = () => {
		settled = true;
		store.activeId = null;
		void startNextPending( client );
	};
	const onError = ( error: unknown ) => {
		if ( settled || store.activeId !== id ) {
			return;
		}
		updateItem( id, {
			status: 'failed',
			error: error instanceof Error ? error.message : String( error ),
			errorCode:
				typeof ( error as { code?: unknown } )?.code === 'string'
					? ( error as { code: string } ).code
					: undefined,
		} );
		settle();
	};
	try {
		const tokenData = await getMediaToken( 'upload-jwt' );
		if ( ! tokenData?.token ) {
			throw new UploadTokenError();
		}
		resumableFileUploader( {
			file,
			tokenData,
			onProgress: ( sent, total ) => {
				if ( ! settled && store.activeId === id ) {
					updateItem( id, { progress: total > 0 ? sent / total : 0, status: 'uploading' } );
				}
			},
			onSuccess: media => {
				if ( settled || store.activeId !== id ) {
					return;
				}
				updateItem( id, { progress: 1, status: 'success', mediaId: String( media.id ), media } );
				settle();
				void finishUpload( id, client );
			},
			onError,
		} );
	} catch ( error ) {
		onError( error );
	}
}

/**
 * Observe uploads and edit their drafts without tying the worker to a React mount.
 *
 * @return Upload state and handlers.
 */
export function useUpload() {
	const client = useQueryClient();
	const { queue, completed } = useSyncExternalStore( subscribeStore, readSnapshot, readSnapshot );

	const startUpload = useCallback(
		( file: File ): string => {
			const id = `upload-${ Date.now() }-${ Math.random().toString( 36 ).slice( 2, 10 ) }`;
			updateSnapshot( {
				queue: [ ...readSnapshot().queue, { id, file, progress: 0, status: 'pending' } ],
			} );
			void startNextPending( client );
			return id;
		},
		[ client ]
	);

	const retryUpload = useCallback(
		( id: string ) => {
			if ( readItem( id )?.detailsError ) {
				void finishUpload( id, client );
				return;
			}
			if ( readItem( id )?.status !== 'failed' ) {
				return;
			}
			updateItem( id, { status: 'pending', progress: 0, error: undefined, errorCode: undefined } );
			void startNextPending( client );
		},
		[ client ]
	);

	const saveUploadDetails = useCallback(
		( id: string, patch: VideoDetailsPatch ) => {
			const item = readItem( id );
			if ( item && ! readSnapshot().completed[ id ] ) {
				updateItem( id, { details: { ...item.details, ...patch } } );
				void finishUpload( id, client );
			}
		},
		[ client ]
	);

	const retryUploadDetails = useCallback(
		( id: string ) => {
			void finishUpload( id, client );
		},
		[ client ]
	);

	return {
		uploadQueue: queue,
		completedUploads: completed,
		startUpload,
		retryUpload,
		saveUploadDetails,
		retryUploadDetails,
	};
}
