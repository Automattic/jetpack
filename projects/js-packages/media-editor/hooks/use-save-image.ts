/**
 * WordPress dependencies
 */
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo, useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
// TODO: Implement image cropping functionality
// import { useImageCropper, normalizeRotation } from '@wordpress/image-cropper';
// TODO: Replace with available alternative
// import { unlock } from '@wordpress/admin-toolkit';

/**
 * Internal dependencies
 */
import { useMediaEditorState } from '../provider/with-media-editor-state-provider.tsx';

/**
 *
 */
export function useSaveImage( props?: {
	url?: string;
	id?: number;
	onSaveImage?: ( image: { id: number; url: string } ) => void;
	onFinishEditing?: () => void;
} ) {
	const { url = '', id = 0, onSaveImage, onFinishEditing } = props || {};
	const [ pendingMediaId, setPendingMediaId ] = useState< number | null >( null );

	const { setIsEditInProgress, isEditInProgress } = useMediaEditorState();
	// TODO: Implement image cropping functionality
	// const { getCropperState } = useImageCropper();
	const getCropperState = () => null;
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );
	const { edits: attachmentEdits } = useEntityRecord( 'postType', 'attachment', id );
	// TODO: Replace with available alternative
	// const { editMediaEntity } = unlock( useDispatch( coreStore ) );
	const editMediaEntity = null;

	/*
	 * The save is "completed" when the new post record is loaded.
	 * We need to track the state of the pending edit to prevent displaying the original image,
	 * before the new post record is loaded in context.
	 */
	useEffect( () => {
		if ( !! pendingMediaId && pendingMediaId === id ) {
			setPendingMediaId( null );
			setIsEditInProgress( false );
		}
	}, [ pendingMediaId, id, setPendingMediaId, setIsEditInProgress ] );

	const saveEditedImage = useCallback( async () => {
		const state = getCropperState();
		if ( ! state || ! editMediaEntity ) {
			onFinishEditing?.();
			return;
		}

		// TODO: Implement image cropping functionality
		// const modifiedState = {
		//	...state,
		//	rotation: normalizeRotation( state.rotation || 0 ),
		// };
		const modifiedState = state;

		setIsEditInProgress( true );

		const modifiers = [];

		if ( modifiedState?.flip && ( modifiedState.flip.horizontal || modifiedState.flip.vertical ) ) {
			modifiers.push( {
				type: 'flip',
				args: {
					flip: {
						horizontal: Number( modifiedState.flip.horizontal ),
						vertical: Number( modifiedState.flip.vertical ),
					},
				},
			} );
		}

		if ( modifiedState?.rotation && modifiedState.rotation > 0 ) {
			modifiers.push( {
				type: 'rotate',
				args: {
					angle: modifiedState.rotation,
				},
			} );
		}
		// The crop script may return some very small, sub-pixel values when the image was not cropped.
		// Crop only when the new size has changed by more than 0.1%.
		if (
			modifiedState?.crop?.width &&
			modifiedState?.crop?.height &&
			( modifiedState.crop.width < 99.9 || modifiedState.crop.height < 99.9 )
		) {
			modifiers.push( {
				type: 'crop',
				args: {
					left: modifiedState.crop.x, // Horizontal position from the left to begin the crop as a percentage of the image width.
					top: modifiedState.crop.y, // Vertical position from the top to begin the crop as a percentage of the image height.
					width: modifiedState.crop.width, // Width of the crop as a percentage of the image width.
					height: modifiedState.crop.height, // Height of the crop as a percentage of the image height.
				},
			} );
		}

		if ( modifiers.length === 0 ) {
			// No changes to apply.
			setIsEditInProgress( false );
			onFinishEditing?.();
			return;
		}

		try {
			const response = await editMediaEntity(
				id,
				{
					src: url,
					modifiers,
					...attachmentEdits,
				},
				{ throwOnError: true }
			);

			if ( response && response.id ) {
				setPendingMediaId( response.id );
				onSaveImage?.( {
					id: response.id,
					url: response.source_url,
				} );
				createSuccessNotice( __( 'Image edited and saved.', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ), {
					type: 'snackbar',
					id: 'image-editing-success-notice',
				} );
			}
		} catch ( error ) {
			const errorMessage = error instanceof Error ? error.message : String( error );
			createErrorNotice(
				sprintf(
					/* translators: %s: Error message. */
					__( 'Could not edit image. %s', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ),
					stripHTML( errorMessage )
				),
				{
					id: 'image-editing-error-notice',
					type: 'snackbar',
				}
			);
		} finally {
			onFinishEditing?.();
		}
	}, [
		getCropperState,
		editMediaEntity,
		setIsEditInProgress,
		onFinishEditing,
		id,
		url,
		attachmentEdits,
		onSaveImage,
		createSuccessNotice,
		createErrorNotice,
	] );

	return useMemo(
		() => ( {
			isInProgress: isEditInProgress,
			saveEditedImage,
		} ),
		[ isEditInProgress, saveEditedImage ]
	);
}
