import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { LIBRARY_ITEM_QUERY_SEGMENT, LIBRARY_QUERY_KEY, PRIVACY_FROM_IMPORT } from './use-library';
import { useUpdateVideoMeta } from './use-update-video-meta';
import { useUpdateVideoPoster } from './use-update-video-poster';
import { removeUpload, useUpload } from './use-upload';
import { IMPORT_QUERY_KEY } from './use-youtube-connection';
import type { ImportMeta } from './use-library';
import type { UploadedMedia } from './use-upload';
import type { VideoDetailsPatch } from '../types/library';

export type AttachImportMediaVars = {
	/** The draft placeholder's attachment ID. */
	draftId: number | string;
	/** The user's exported media file to upload. */
	file: File;
};

export type AttachImportMediaResult = {
	/** The new VideoPress video's media post ID. */
	mediaId: number;
	/** The new VideoPress video's GUID. */
	guid: string;
	/** Whether the imported thumbnail was applied as the poster. */
	posterApplied: boolean;
};

export type AttachImportMediaStep = 'load_draft' | 'upload' | 'metadata' | 'delete_draft';

/**
 * Thrown when a step of the attach flow fails. `step` says how far the flow
 * got; `mediaId`/`guid` are set for steps after a successful upload, so
 * callers can message "your video is uploaded, but…" instead of implying the
 * file was lost. Steps before `metadata` leave the draft untouched, so the
 * user can simply retry.
 */
export class AttachImportMediaError extends Error {
	step: AttachImportMediaStep;
	mediaId: number | null;
	guid: string | null;

	constructor(
		step: AttachImportMediaStep,
		message: string,
		uploaded?: { mediaId: number; guid: string }
	) {
		super( message );
		this.name = 'AttachImportMediaError';
		this.step = step;
		this.mediaId = uploaded?.mediaId ?? null;
		this.guid = uploaded?.guid ?? null;
	}
}

// Completion endpoint: moves the imported markers onto the new video and
// deletes the draft placeholder (cascading to its sideloaded thumbnail).
const COMPLETE_PATH = '/jetpack/v4/videopress/import/complete';

/**
 * Extract a human-readable message from an unknown thrown value.
 *
 * @param error    - The caught value (Error, WP REST error object, or string).
 * @param fallback - Message to use when nothing usable is found.
 * @return The best available message.
 */
function toMessage( error: unknown, fallback: string ): string {
	if ( error instanceof Error && error.message ) {
		return error.message;
	}
	if ( typeof error === 'string' && error ) {
		return error;
	}
	// WP REST errors arrive from apiFetch as plain objects with a message.
	const message = ( error as { message?: string } | null )?.message;
	return message || fallback;
}

/**
 * Build the meta patch to apply to the freshly uploaded video from the
 * draft's stored import metadata. Only fields with usable values are
 * included, so absent metadata never clobbers upload defaults.
 *
 * @param importMeta - The draft's stored `_videopress_import` blob.
 * @return A patch for the existing meta-update path.
 */
export function importMetaToPatch( importMeta: ImportMeta ): Partial< VideoDetailsPatch > {
	const patch: Partial< VideoDetailsPatch > = {};
	if ( importMeta.title ) {
		patch.title = importMeta.title;
	}
	if ( importMeta.description ) {
		patch.description = importMeta.description;
	}
	const privacy = PRIVACY_FROM_IMPORT[ importMeta.privacy ?? '' ];
	if ( privacy ) {
		patch.privacy = privacy;
	}
	return patch;
}

/**
 * Attach a real media file to a YouTube import draft.
 *
 * Orchestrates the completion flow end to end, reusing the existing
 * machinery for every step:
 *
 * 1. Load the draft's stored import metadata from /wp/v2/media/{id}
 * (server-resolved, so callers only need the draft ID and a File).
 * 2. Upload the file through the shared tus upload queue (use-upload),
 * observing completion via per-item settlers.
 * 3. Apply the stored title/description/privacy via use-update-video-meta.
 * 4. Apply the sideloaded thumbnail as the poster via use-update-video-poster
 * — best effort: VideoPress generates its own poster anyway, so a failure
 * here isn't worth failing an otherwise-complete attach over.
 * 5. Complete the import server-side (POST /import/complete): the endpoint
 * moves the imported markers onto the new video — so the picker keeps
 * flagging this YouTube video as imported instead of offering to import
 * (and attach) it again — then deletes the draft placeholder, cascading
 * to its sideloaded thumbnail.
 *
 * Failures reject with a typed {@link AttachImportMediaError} whose `step`
 * pinpoints the failure; after a successful upload the error also carries the
 * new video's mediaId/guid.
 *
 * @return The attach mutation, the active upload's queue-item ID (for progress display via useUpload's queue), and a reset callback.
 */
export function useAttachImportMedia() {
	const client = useQueryClient();
	const { startUpload } = useUpload();
	const updateMeta = useUpdateVideoMeta();
	const updatePoster = useUpdateVideoPoster();

	// The shared upload queue's item ID for the in-flight attach upload, so
	// the UI can read progress from useUpload().uploadQueue.
	const [ uploadItemId, setUploadItemId ] = useState< string | null >( null );

	const mutation = useMutation< AttachImportMediaResult, Error, AttachImportMediaVars >( {
		mutationFn: async ( { draftId, file } ) => {
			// 1. Load the draft's stored import metadata.
			let importMeta: ImportMeta | undefined;
			try {
				const raw = await apiFetch< { jetpack_videopress_import?: ImportMeta } >( {
					path: `/wp/v2/media/${ draftId }`,
				} );
				importMeta = raw?.jetpack_videopress_import;
			} catch ( error ) {
				throw new AttachImportMediaError(
					'load_draft',
					toMessage( error, __( 'Failed to load the import draft.', 'jetpack-videopress-pkg' ) )
				);
			}
			if ( importMeta?.status !== 'awaiting_media' ) {
				throw new AttachImportMediaError(
					'load_draft',
					__( 'The selected item is not an import draft awaiting media.', 'jetpack-videopress-pkg' )
				);
			}

			// 2. Upload the file through the shared tus queue. The item is
			// tagged origin 'attach' so the library listing never splices it
			// in as a row of its own, and withdrawn from the queue on failure
			// — a lingering failed item would offer the listing's plain
			// Retry, which re-uploads the file without this orchestration.
			const media = await new Promise< UploadedMedia >( ( resolve, reject ) => {
				let id = '';
				const fail = ( message: string ) => {
					removeUpload( id );
					reject( new AttachImportMediaError( 'upload', message ) );
				};
				id = startUpload(
					file,
					{
						onSuccess: uploaded => {
							if ( uploaded?.guid && uploaded.id !== undefined ) {
								resolve( uploaded );
							} else {
								fail(
									__(
										'The upload finished but did not report the new video.',
										'jetpack-videopress-pkg'
									)
								);
							}
						},
						onError: fail,
					},
					{ origin: 'attach' }
				);
				setUploadItemId( id );
			} );
			const mediaId = Number( media.id );
			const guid = media.guid;

			// 3. Apply the stored metadata via the existing meta-update path.
			try {
				const patch = importMetaToPatch( importMeta );
				if ( Object.keys( patch ).length > 0 ) {
					await updateMeta.mutateAsync( { id: mediaId, patch } );
				}
			} catch ( error ) {
				throw new AttachImportMediaError(
					'metadata',
					toMessage(
						error,
						__( 'Failed to apply the imported metadata.', 'jetpack-videopress-pkg' )
					),
					{ mediaId, guid }
				);
			}

			// 4. Poster from the sideloaded thumbnail — best effort.
			let posterApplied = false;
			const thumbnailAttachmentId = importMeta.thumbnail_attachment_id ?? 0;
			if ( thumbnailAttachmentId > 0 ) {
				try {
					const { poster } = await updatePoster.mutateAsync( {
						id: String( mediaId ),
						guid,
						source: 'attachment',
						attachmentId: thumbnailAttachmentId,
					} );
					posterApplied = Boolean( poster );
				} catch {
					posterApplied = false;
				}
			}

			// 5. Complete the import server-side: mark the new video as this
			// YouTube source's import and delete the draft placeholder. The
			// video is complete either way, but a lingering draft would keep
			// offering "attach media" for a video that already exists —
			// surface it.
			try {
				await apiFetch( {
					path: COMPLETE_PATH,
					method: 'POST',
					data: { draft_id: Number( draftId ), media_id: mediaId },
				} );
			} catch ( error ) {
				throw new AttachImportMediaError(
					'delete_draft',
					toMessage( error, __( 'Failed to remove the import draft.', 'jetpack-videopress-pkg' ) ),
					{ mediaId, guid }
				);
			}

			return { mediaId, guid, posterApplied };
		},
		onSuccess: ( _result, { draftId } ) => {
			// Drop the deleted draft's item-detail query outright — a refetch
			// would 404 and TanStack would retain the stale data (same
			// reasoning as use-delete-video) — then refresh the library and
			// the import branch (the completion flips the listing's
			// already_imported flags onto the new video).
			client.removeQueries( {
				queryKey: [ LIBRARY_QUERY_KEY, LIBRARY_ITEM_QUERY_SEGMENT, String( draftId ) ],
			} );
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
			client.invalidateQueries( { queryKey: [ IMPORT_QUERY_KEY ] } );
		},
	} );

	const resetMutation = mutation.reset;
	const reset = useCallback( () => {
		resetMutation();
		setUploadItemId( null );
	}, [ resetMutation ] );

	return {
		attach: mutation.mutateAsync,
		isAttaching: mutation.isPending,
		error: mutation.error,
		result: mutation.data,
		uploadItemId,
		reset,
	};
}
