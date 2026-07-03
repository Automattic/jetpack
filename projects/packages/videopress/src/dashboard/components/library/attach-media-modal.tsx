import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { DropZone, ProgressBar } from '@wordpress/components';
import { useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Stack, Text } from '@wordpress/ui';
import { AttachImportMediaError, useAttachImportMedia } from '../../hooks/use-attach-import-media';
import { useUpload } from '../../hooks/use-upload';
import { STUDIO_DIALOG_CLASS } from '../studio-dialog';
import './attach-media-modal.scss';
import type { LibraryItem } from '../../types/library';
import type { ChangeEvent } from 'react';

type Props = {
	/** The import-draft row the file is being attached to. */
	draft: LibraryItem;
	/** Closes the dialog. Ignored while an attach is in flight. */
	onClose: () => void;
};

/**
 * Map an attach failure to the user-facing inline message for the retryable
 * steps (nothing was created yet, so trying again is safe). The post-upload
 * steps are handled separately — see onAttach in the component.
 *
 * @param error - The rejection from useAttachImportMedia's attach().
 * @return A translated message for the dialog's inline error slot.
 */
function toRetryableMessage( error: unknown ): string {
	if ( error instanceof AttachImportMediaError && error.step === 'upload' && error.message ) {
		return sprintf(
			/* translators: %s: reason reported by the upload backend. */
			__( 'The upload failed: %s', 'jetpack-videopress-pkg' ),
			error.message
		);
	}
	return __( 'Failed to attach the video file. Please try again.', 'jetpack-videopress-pkg' );
}

/**
 * Dialog for completing a YouTube import draft: the user picks (or drops)
 * their exported video file, which is uploaded through the shared tus queue;
 * the draft's stored metadata and thumbnail are then applied to the new
 * video and the draft placeholder is removed (all via useAttachImportMedia).
 *
 * Failure handling follows the hook's step semantics: before anything is
 * uploaded (`load_draft` / `upload`) the draft is untouched, so the dialog
 * stays open with an inline error and the user can simply retry. After a
 * successful upload (`metadata` / `delete_draft`) retrying would upload the
 * file again and create a duplicate video, so the dialog closes with an
 * error notice explaining that the video itself made it.
 *
 * Notices fire from the confirm handler's async continuation (an event
 * handler), never from store-subscribed effects.
 *
 * @param props         - Component props.
 * @param props.draft   - The import-draft row the file is being attached to.
 * @param props.onClose - Closes the dialog; ignored while attaching.
 * @return The dialog element.
 */
export default function AttachMediaModal( { draft, onClose }: Props ) {
	const [ file, setFile ] = useState< File | null >( null );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );
	const { attach, isAttaching, uploadItemId } = useAttachImportMedia();
	const { uploadQueue } = useUpload();
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const filePickerRef = useRef< HTMLInputElement >( null );

	// Progress comes from the shared upload queue: attach() rides the normal
	// tus queue and exposes its queue-item id. Before the upload starts (the
	// draft pre-read) there's no item for this attempt yet; after it succeeds
	// the item flips to 'success' (and is pruned shortly after) while
	// metadata/poster/draft cleanup still run.
	const uploadItem = uploadItemId ? uploadQueue.find( item => item.id === uploadItemId ) : null;
	const isUploading = Boolean(
		uploadItem && ( uploadItem.status === 'pending' || uploadItem.status === 'uploading' )
	);
	// Post-upload phase: the item settled successfully (or was already pruned
	// from the queue) but the mutation is still applying metadata/poster and
	// removing the draft. A 'failed' item here is a previous attempt's — the
	// current one is still in its pre-read, which reads as "Preparing…".
	const isFinishing = uploadItem ? uploadItem.status === 'success' : Boolean( uploadItemId );
	const progressPercent = uploadItem ? Math.round( uploadItem.progress * 100 ) : 0;

	const setPickedFile = ( picked: File ) => {
		setFile( picked );
		setErrorMessage( null );
	};

	const onFilePicked = ( event: ChangeEvent< HTMLInputElement > ) => {
		const picked = event.target.files?.[ 0 ];
		if ( picked ) {
			setPickedFile( picked );
		}
		event.target.value = '';
	};

	const onFilesDrop = ( files: File[] ) => {
		if ( isAttaching ) {
			return;
		}
		// Mirror the library drop zone's video-only rule; YouTube exports are
		// always videos, so anything else is a stray drop.
		const video = files.find( dropped => dropped.type.startsWith( 'video/' ) );
		if ( video ) {
			setPickedFile( video );
		} else {
			setErrorMessage( __( 'Only video files can be attached.', 'jetpack-videopress-pkg' ) );
		}
	};

	const onAttach = async () => {
		if ( ! file || isAttaching ) {
			return;
		}
		setErrorMessage( null );
		try {
			await attach( { draftId: draft.id, file } );
			createSuccessNotice(
				sprintf(
					/* translators: %s: video title. */
					__( '"%s" is now a VideoPress video.', 'jetpack-videopress-pkg' ),
					draft.title
				)
			);
			onClose();
		} catch ( error ) {
			const step = error instanceof AttachImportMediaError ? error.step : null;
			if ( step === 'metadata' || step === 'delete_draft' ) {
				// The upload itself succeeded — retrying would create a
				// duplicate video. Close and explain what's left to do.
				createErrorNotice(
					step === 'metadata'
						? __(
								'The video was uploaded, but its imported details could not be applied. Edit the video manually, then delete the draft.',
								'jetpack-videopress-pkg'
						  )
						: __(
								'The video was uploaded, but the import draft could not be removed. You can delete it from the library.',
								'jetpack-videopress-pkg'
						  )
				);
				onClose();
				return;
			}
			// load_draft / upload / unknown: nothing was created, retry is safe.
			setErrorMessage( toRetryableMessage( error ) );
		}
	};

	return (
		<Dialog.Root
			open
			onOpenChange={ open => {
				// `open` is controlled, so ignoring the change while an attach
				// is in flight keeps the dialog (and its progress) on screen.
				if ( ! open && ! isAttaching ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup className={ STUDIO_DIALOG_CLASS } size="small">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Attach video file', 'jetpack-videopress-pkg' ) }</Dialog.Title>
					<Dialog.CloseIcon label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				{ /*
				 * Dialog.Popup is an unpadded flex column; body padding comes
				 * from the Dialog.Content region, which also owns scrolling
				 * when the body outgrows the popup.
				 */ }
				<Dialog.Content>
					<Stack direction="column" gap="md">
						<Text variant="body-sm">
							{ sprintf(
								/* translators: %s: draft title imported from YouTube. */
								__(
									'Upload your exported video file for "%s". The imported YouTube details and thumbnail will be applied, and the draft will be replaced by the video.',
									'jetpack-videopress-pkg'
								),
								draft.title
							) }
						</Text>
						<div className="vp-attach-media__drop-target">
							<DropZone
								label={ __( 'Drop a video file to attach', 'jetpack-videopress-pkg' ) }
								onFilesDrop={ onFilesDrop }
							/>
							<Stack direction="column" gap="sm" align="center">
								<Text variant="body-sm" className="vp-attach-media__file-name">
									{ file
										? file.name
										: __( 'Drag and drop a video file here, or', 'jetpack-videopress-pkg' ) }
								</Text>
								<Button
									variant="outline"
									onClick={ () => filePickerRef.current?.click() }
									disabled={ isAttaching }
								>
									{ file
										? __( 'Choose a different file', 'jetpack-videopress-pkg' )
										: __( 'Select video file', 'jetpack-videopress-pkg' ) }
								</Button>
							</Stack>
							<input
								ref={ filePickerRef }
								type="file"
								accept="video/*"
								style={ { display: 'none' } }
								onChange={ onFilePicked }
								aria-label={ __( 'Video file', 'jetpack-videopress-pkg' ) }
							/>
						</div>
						{ isAttaching && (
							<Stack direction="column" gap="sm" className="vp-attach-media__progress">
								<Text variant="body-sm">
									{ isUploading &&
										sprintf(
											/* translators: %d: upload progress percentage. */
											__( 'Uploading… %d%%', 'jetpack-videopress-pkg' ),
											progressPercent
										) }
									{ ! isUploading &&
										( isFinishing
											? __( 'Finishing up…', 'jetpack-videopress-pkg' )
											: __( 'Preparing…', 'jetpack-videopress-pkg' ) ) }
								</Text>
								<ProgressBar value={ isUploading ? progressPercent : undefined } />
							</Stack>
						) }
						{ errorMessage && (
							<Text variant="body-sm" className="vp-attach-media__error">
								{ errorMessage }
							</Text>
						) }
					</Stack>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" onClick={ onClose } disabled={ isAttaching }>
						{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
					</Button>
					<Button onClick={ onAttach } disabled={ ! file || isAttaching }>
						{ isAttaching
							? __( 'Attaching…', 'jetpack-videopress-pkg' )
							: __( 'Attach video file', 'jetpack-videopress-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
