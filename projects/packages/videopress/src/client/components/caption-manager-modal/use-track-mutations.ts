/**
 * External dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import {
	deleteTrackForGuid,
	fetchTrackContentForGuid,
	normalizeVideoTextTrackResponse,
	uploadTrackForGuid,
} from '../../lib/video-tracks';
import { deleteCaptionTrack, saveCaptionTrack } from '../../lib/video-tracks/caption-tracks';
import {
	getDownloadFileName,
	getTrackApiErrorMessage,
	getTrackKey,
	getStoredCaptionTrackKey,
	hasTrackApiError,
} from './track-helpers';
/**
 * Types
 */
import type { CaptionTrack, SavedCaptionTrack } from '../../lib/video-tracks/caption-tracks';
import type { UploadTrackDataProps, VideoTextTrack } from '../../lib/video-tracks/types';
import type { Dispatch, SetStateAction } from 'react';

const debug = debugFactory( 'videopress:caption-manager-modal:mutations' );

type UseTrackMutationsArgs = {
	guid: string;
	isPrivate?: boolean;
	managedTracks: VideoTextTrack[];
	setManagedTracks: Dispatch< SetStateAction< VideoTextTrack[] > >;
	setCaptionTracks: Dispatch< SetStateAction< SavedCaptionTrack[] > >;
	onTracksChange: ( tracks: VideoTextTrack[] ) => void;
	notify: ( content: string ) => void;
};

type UploadAndReconcileArgs = {
	/** Track (kind/language/label/file) to upload. */
	trackToUpload: UploadTrackDataProps;
	/** Managed track the upload updates, or null when it adds a new one. */
	trackToUpdate: VideoTextTrack | null;
	/** Error message used when the API error response carries none. */
	apiErrorFallback: string;
};

type UploadAndReconcileResult = { track: VideoTextTrack; cleanupFailed: boolean } | null;

export type PublishOutcome = 'published' | 'cleanup-failed' | 'save-failed' | 'failed';
export type UploadOutcome = 'uploaded' | 'cleanup-failed' | 'failed';

/**
 * The caption manager's server mutations: uploading, publishing, saving,
 * deleting, and downloading tracks. Owns the busy flags and error notices;
 * success notices belong to the calling flow, which also decides when to
 * leave the editor.
 *
 * @param args                  - Hook arguments.
 * @param args.guid             - VideoPress GUID.
 * @param args.isPrivate        - Whether the video is private, so downloads authenticate up front.
 * @param args.managedTracks    - Current managed track list.
 * @param args.setManagedTracks - Managed track list setter.
 * @param args.setCaptionTracks - Caption track (draft) list setter.
 * @param args.onTracksChange   - Host callback for managed track changes.
 * @param args.notify           - Adds a snackbar notice.
 * @return Mutation callbacks and busy state.
 */
export function useTrackMutations( {
	guid,
	isPrivate = false,
	managedTracks,
	setManagedTracks,
	setCaptionTracks,
	onTracksChange,
	notify,
}: UseTrackMutationsArgs ) {
	const [ isSavingUpload, setIsSavingUpload ] = useState( false );
	const [ isSavingCaptionTrack, setIsSavingCaptionTrack ] = useState( false );
	const [ isPublishing, setIsPublishing ] = useState( false );
	const [ deletingTrackKey, setDeletingTrackKey ] = useState< string | null >( null );
	const [ downloadingTrackKey, setDownloadingTrackKey ] = useState< string | null >( null );

	const applyTracksChange = useCallback(
		( updatedTracks: VideoTextTrack[] ) => {
			setManagedTracks( updatedTracks );
			onTracksChange( updatedTracks );
		},
		[ onTracksChange, setManagedTracks ]
	);

	/*
	 * The shared upload core used by both the file-upload form and manual
	 * publishing: upload the file, reject API error envelopes, remove the
	 * updated track's old record when its kind or language changed (the server
	 * only replaces same-kind-and-language tracks), and reconcile the managed
	 * track list. Throws on transport errors, so each flow can word its own
	 * failure; API error responses set a notice here and resolve to null.
	 */
	const uploadAndReconcileTrack = useCallback(
		async ( {
			trackToUpload,
			trackToUpdate,
			apiErrorFallback,
		}: UploadAndReconcileArgs ): Promise< UploadAndReconcileResult > => {
			const trackUpdatePayload = {
				...trackToUpdate,
				kind: trackToUpload.kind,
				srcLang: trackToUpload.srcLang,
				label: trackToUpload.label,
			};

			const response = await uploadTrackForGuid( trackToUpload, guid );

			if ( hasTrackApiError( response ) ) {
				notify(
					sprintf(
						/* translators: %s: VideoPress API error. */
						__( 'Track error: %s', 'jetpack-videopress-pkg' ),
						getTrackApiErrorMessage( response, apiErrorFallback )
					)
				);
				return null;
			}

			/*
			 * If the updated track's old record survives under a different kind or
			 * language, remove it. If that cleanup fails the old track lingers, so
			 * report it rather than clean success.
			 */
			let cleanupFailed = false;
			if (
				trackToUpdate &&
				( trackToUpdate.kind !== trackToUpload.kind ||
					trackToUpdate.srcLang !== trackToUpload.srcLang )
			) {
				try {
					await deleteTrackForGuid(
						{ kind: trackToUpdate.kind, srcLang: trackToUpdate.srcLang },
						guid
					);
				} catch ( deleteError ) {
					debug( 'remove replaced track error', deleteError );
					cleanupFailed = true;
				}
			}

			// The upload succeeded, so fall back to the known track values if the response has nothing track-like.
			const uploadedTrack = normalizeVideoTextTrackResponse( response, trackUpdatePayload ) ?? {
				...trackUpdatePayload,
				src: trackUpdatePayload.src ?? '',
			};

			const updatedIndex = trackToUpdate
				? managedTracks.findIndex( track => getTrackKey( track ) === getTrackKey( trackToUpdate ) )
				: -1;
			const updatedTracks = [ ...managedTracks ];
			if ( updatedIndex > -1 ) {
				updatedTracks[ updatedIndex ] = uploadedTrack;
			} else {
				updatedTracks.push( uploadedTrack );
			}

			applyTracksChange( updatedTracks );
			return { track: uploadedTrack, cleanupFailed };
		},
		[ applyTracksChange, guid, managedTracks, notify ]
	);

	/**
	 * Save a caption track (CPT) record and reflect it in the drafts cache.
	 *
	 * @param payload          - Caption track payload.
	 * @param options          - Save options.
	 * @param options.announce - Whether this save owns the success/error notice.
	 * @return The saved track, or null on failure.
	 */
	const saveCaptionTrackRecord = useCallback(
		async (
			payload: CaptionTrack,
			{ announce = true }: { announce?: boolean } = {}
		): Promise< SavedCaptionTrack | null > => {
			setIsSavingCaptionTrack( true );

			try {
				const savedCaptionTrack = await saveCaptionTrack( payload );
				setCaptionTracks( current => {
					const existingIndex = current.findIndex(
						captionTrack => captionTrack.id === savedCaptionTrack.id
					);
					if ( existingIndex === -1 ) {
						return [ savedCaptionTrack, ...current ];
					}
					const next = [ ...current ];
					next[ existingIndex ] = savedCaptionTrack;
					return next;
				} );
				if ( announce ) {
					notify(
						payload.status === 'publish'
							? __( 'Subtitle track published.', 'jetpack-videopress-pkg' )
							: __( 'Subtitle track draft saved.', 'jetpack-videopress-pkg' )
					);
				}
				return savedCaptionTrack;
			} catch ( error ) {
				debug( 'save caption track error', error );
				if ( announce ) {
					notify( __( 'Unable to save subtitle track.', 'jetpack-videopress-pkg' ) );
				}
				return null;
			} finally {
				setIsSavingCaptionTrack( false );
			}
		},
		[ notify, setCaptionTracks ]
	);

	/**
	 * Upload a subtitle file from the upload form.
	 *
	 * @param args - Upload arguments (see {@link UploadAndReconcileArgs}).
	 * @return The outcome; error notices are already set on 'failed'.
	 */
	const uploadSubtitleFile = useCallback(
		async (
			args: Omit< UploadAndReconcileArgs, 'apiErrorFallback' >
		): Promise< UploadOutcome > => {
			setIsSavingUpload( true );

			try {
				const result = await uploadAndReconcileTrack( {
					...args,
					apiErrorFallback: __( 'Unable to upload track.', 'jetpack-videopress-pkg' ),
				} );
				if ( ! result ) {
					return 'failed';
				}
				return result.cleanupFailed ? 'cleanup-failed' : 'uploaded';
			} catch ( uploadError ) {
				debug( 'upload track error', uploadError );
				notify(
					sprintf(
						/* translators: %s: VideoPress API error. */
						__( 'Track error: %s', 'jetpack-videopress-pkg' ),
						getTrackApiErrorMessage(
							uploadError,
							__( 'Unable to upload track.', 'jetpack-videopress-pkg' )
						)
					)
				);
				return 'failed';
			} finally {
				setIsSavingUpload( false );
			}
		},
		[ notify, uploadAndReconcileTrack ]
	);

	/**
	 * Publish manual subtitles: upload the serialized WebVTT to VideoPress,
	 * then persist the editable caption track copy.
	 *
	 * @param args                     - Publish arguments.
	 * @param args.trackToUpload       - WebVTT track to upload.
	 * @param args.trackToUpdate       - Managed track being updated, if any.
	 * @param args.captionTrackPayload - Caption track (CPT) payload to save after upload.
	 * @return The outcome; error notices are already set on failures.
	 */
	const publishManualTrack = useCallback(
		async ( {
			trackToUpload,
			trackToUpdate,
			captionTrackPayload,
		}: Omit< UploadAndReconcileArgs, 'apiErrorFallback' > & {
			captionTrackPayload: CaptionTrack;
		} ): Promise< PublishOutcome > => {
			setIsPublishing( true );

			try {
				const result = await uploadAndReconcileTrack( {
					trackToUpload,
					trackToUpdate,
					apiErrorFallback: __( 'Unable to publish subtitles.', 'jetpack-videopress-pkg' ),
				} );
				if ( ! result ) {
					return 'failed';
				}

				// The VTT is live at this point, even if saving the editable copy fails below.
				const savedCaptionTrack = await saveCaptionTrackRecord( captionTrackPayload, {
					announce: false,
				} );
				if ( ! savedCaptionTrack ) {
					/*
					 * The VTT is already live on the video; only the local editable copy
					 * failed to save. Say so instead of implying nothing was published.
					 */
					notify(
						__(
							'Subtitles were published to the video, but saving the editable copy failed. Reopen the track to keep editing.',
							'jetpack-videopress-pkg'
						)
					);
					return 'save-failed';
				}

				return result.cleanupFailed ? 'cleanup-failed' : 'published';
			} catch ( error ) {
				debug( 'publish manual caption track error', error );
				notify( __( 'Unable to publish subtitles.', 'jetpack-videopress-pkg' ) );
				return 'failed';
			} finally {
				setIsPublishing( false );
			}
		},
		[ notify, saveCaptionTrackRecord, uploadAndReconcileTrack ]
	);

	/**
	 * Delete a managed VideoPress track. The caller confirms first.
	 *
	 * @param track - Track to delete.
	 */
	const deleteManagedTrack = useCallback(
		async ( track: VideoTextTrack ) => {
			const key = getTrackKey( track );
			setDeletingTrackKey( key );

			// API error envelopes and thrown transport errors get the same notice.
			const notifyDeleteError = ( source: unknown ) =>
				notify(
					sprintf(
						/* translators: %s: VideoPress API error. */
						__( 'Track error: %s', 'jetpack-videopress-pkg' ),
						getTrackApiErrorMessage(
							source,
							__( 'Unable to delete track.', 'jetpack-videopress-pkg' )
						)
					)
				);

			try {
				const response = await deleteTrackForGuid( track, guid );
				if ( hasTrackApiError( response ) ) {
					notifyDeleteError( response );
					return;
				}

				applyTracksChange( managedTracks.filter( current => getTrackKey( current ) !== key ) );
			} catch ( deleteError ) {
				debug( 'delete track error', deleteError );
				notifyDeleteError( deleteError );
			} finally {
				setDeletingTrackKey( null );
			}
		},
		[ applyTracksChange, guid, managedTracks, notify ]
	);

	/**
	 * Delete a saved caption track draft. The caller confirms first.
	 *
	 * @param captionTrack - Draft to delete.
	 */
	const deleteDraftTrack = useCallback(
		async ( captionTrack: SavedCaptionTrack ) => {
			setDeletingTrackKey( getStoredCaptionTrackKey( captionTrack ) );

			try {
				await deleteCaptionTrack( captionTrack.id );
				setCaptionTracks( current => current.filter( item => item.id !== captionTrack.id ) );
			} catch ( deleteError ) {
				debug( 'delete caption draft error', deleteError );
				notify( __( 'Unable to delete the subtitle draft.', 'jetpack-videopress-pkg' ) );
			} finally {
				setDeletingTrackKey( null );
			}
		},
		[ notify, setCaptionTracks ]
	);

	/**
	 * Download a managed track's content as a `.vtt` file.
	 *
	 * @param track - Track to download.
	 */
	const downloadTrack = useCallback(
		async ( track: VideoTextTrack ) => {
			const key = getTrackKey( track );
			setDownloadingTrackKey( key );

			try {
				const content = await fetchTrackContentForGuid( track, guid, isPrivate );
				if ( ! content ) {
					notify( __( 'Unable to download track content.', 'jetpack-videopress-pkg' ) );
					return;
				}

				const url = window.URL.createObjectURL( new Blob( [ content ], { type: 'text/vtt' } ) );
				const link = document.createElement( 'a' );
				link.href = url;
				link.download = getDownloadFileName( track );
				document.body.appendChild( link );
				link.click();
				link.remove();
				/*
				 * Revoke on the next tick: some browsers abort an in-flight download
				 * when the object URL is revoked in the same tick as the click.
				 */
				setTimeout( () => window.URL.revokeObjectURL( url ), 0 );
			} catch ( downloadError ) {
				debug( 'download track error', downloadError );
				notify( __( 'Unable to download track content.', 'jetpack-videopress-pkg' ) );
			} finally {
				setDownloadingTrackKey( null );
			}
		},
		[ guid, isPrivate, notify ]
	);

	return {
		isSavingUpload,
		isSavingCaptionTrack,
		isPublishing,
		deletingTrackKey,
		downloadingTrackKey,
		uploadSubtitleFile,
		publishManualTrack,
		saveCaptionTrackRecord,
		deleteManagedTrack,
		deleteDraftTrack,
		downloadTrack,
	};
}
