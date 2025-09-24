/**
 * External dependencies
 */
// TODO: Implement routing
// import { useNavigate } from '@tanstack/react-router';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
// TODO: Implement image cropping functionality
// import { useImageCropper } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import { useResetEditedEntity } from '../../hooks/reset-edited-entity.ts';
import { useSaveImage } from '../../hooks/use-save-image.ts';
import { useMediaEditorState } from '../../provider/with-media-editor-state-provider.tsx';
import { type MediaItemUpdatable } from '../../types.ts';

/**
 * The save button component for the media editor.
 *
 * @param {object} props        - The component props.
 * @param {number} props.postId - The ID of the post to save.
 * @return {JSX.Element} The save button component.
 *
 * @example
 * <MediaEditorSaveButton postId={ 1 } postType="attachment" />
 */
export default function MediaEditorSaveButton( { postId }: { postId: number } ) {
	const { post, isDisabled, isEntityRecordDirty, isSaving } = useSelect(
		select => {
			const { hasEditsForEntityRecord, isSavingEntityRecord, getEditedEntityRecord } = select(
				coreStore
			) as any;

			const _hasEdits = hasEditsForEntityRecord( 'postType', 'attachment', postId );

			const _isSaving = isSavingEntityRecord( 'postType', 'attachment', postId );

			return {
				isEntityRecordDirty: _hasEdits,
				isSaving: _isSaving,
				isDisabled: _isSaving || ! _hasEdits,
				post: getEditedEntityRecord( 'postType', 'attachment', postId ) as MediaItemUpdatable,
			};
		},
		[ postId ]
	) as any;
	const resetEdits = useResetEditedEntity( { postId } );
	// TODO: Implement routing
	// const navigate = useNavigate();
	const navigate = ( options?: any ) => {};
	const { setIsImageEditorOpen } = useMediaEditorState();
	// TODO: Implement image cropping functionality
	// const { isDirty: isImageCropperDirty, setResetState } = useImageCropper();
	const isDirty = false;
	const isImageCropperDirty = isDirty;
	const setResetState = ( state: any ) => {};

	const handleSaveImage = useCallback(
		( image: { id: number; url: string } ) => {
			setIsImageEditorOpen( false );
			navigate( {
				to: `/types/${ post.type }/edit/${ image.id }`,
				replace: true,
			} );
			setResetState( null );
		},
		[ setIsImageEditorOpen, navigate, post.type, setResetState ]
	);
	const { isInProgress, saveEditedImage } = useSaveImage( {
		id: post.id,
		url: post.source_url,
		onSaveImage: handleSaveImage,
		onFinishEditing: resetEdits,
	} );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const saveAttachment = useCallback( async () => {
		try {
			const response = await saveEditedEntityRecord( 'postType', 'attachment', postId, {
				throwOnError: true,
				isCached: false,
			} );
			return response;
		} catch {
			createErrorNotice( __( 'Could not save attachment.', 'jetpack-media-editor' ), {
				id: 'attachment-save-error',
				type: 'snackbar',
			} );
		}
	}, [ saveEditedEntityRecord, postId, createErrorNotice ] );

	const saveEditedData = useCallback( () => {
		if ( isImageCropperDirty ) {
			saveEditedImage();
			return;
		}

		if ( isEntityRecordDirty ) {
			saveAttachment();
			createSuccessNotice( __( 'Media saved', 'jetpack-media-editor' ), {
				id: 'attachements-save-success',
				type: 'snackbar',
			} );
		}
	}, [
		saveAttachment,
		isEntityRecordDirty,
		createSuccessNotice,
		isImageCropperDirty,
		saveEditedImage,
	] );

	const isButtonDisabled = ( isDisabled && ! isImageCropperDirty ) || isInProgress;

	return (
		<Button
			variant="primary"
			size="compact"
			onClick={ saveEditedData }
			isBusy={ isSaving || isInProgress }
			disabled={ isButtonDisabled }
			accessibleWhenDisabled
		>
			{ __( 'Save', 'jetpack-media-editor' ) }
		</Button>
	);
}
