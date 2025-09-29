/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback } from '@wordpress/element';
// TODO: Re-enable when @wordpress/image-cropper is available
// import { useImageCropper } from '@wordpress/image-cropper';

/**
 * Internal dependencies
 */
import { type MediaItemUpdatable } from '../../types';
import { useSaveImage } from '../../hooks/use-save-image';
import { useResetEditedEntity } from '../../hooks/reset-edited-entity';
import { useMediaEditorState } from '../provider/with-media-editor-state-provider';

/**
 * The save button component for the media editor.
 *
 * @param {Object} props        The component props.
 * @param {number} props.postId The ID of the post to save.
 * @return {JSX.Element} The save button component.
 *
 * @example
 * <MediaEditorSaveButton postId={ 1 } postType="attachment" />
 */
export default function MediaEditorSaveButton( { postId }: { postId: number } ) {
	const { post, isDisabled, isEntityRecordDirty, isSaving } = useSelect(
		select => {
			const { hasEditsForEntityRecord, isSavingEntityRecord, getEditedEntityRecord } =
				select( coreStore );

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
	);
	const resetEdits = useResetEditedEntity( { postId } );
	const { setIsImageEditorOpen } = useMediaEditorState();

	// TODO: Re-enable when @wordpress/image-cropper is available
	// const { isDirty: isImageCropperDirty, setResetState } = useImageCropper();
	const isImageCropperDirty = false;
	const setResetState = ( state: any ) => {};

	const handleSaveImage = useCallback(
		( image: { id: number; url: string } ) => {
			setIsImageEditorOpen( false );
			// Navigation removed - WordPress admin handles this differently
			setResetState( null );
		},
		[ setIsImageEditorOpen, setResetState ]
	);
	const { isInProgress, saveEditedImage } = useSaveImage( {
		id: post.id,
		url: post.source_url,
		onSaveImage: handleSaveImage,
		onFinishEditing: resetEdits,
	} );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	// @ts-ignore: invalidateResolution is not typed correctly in core-data.
	const { invalidateResolution, saveEditedEntityRecord } = useDispatch( coreStore );

	const reloadAttachment = useCallback( () => {
		// Force the attachment to be re-fetched so that embedded post
		// (parent / attached to) data is up to date.
		invalidateResolution( 'getEntityRecord', [
			'postType',
			'attachment',
			postId,
			{
				_embed: 'post',
			},
		] );
	}, [ invalidateResolution, postId ] );

	const saveAttachment = useCallback( async () => {
		try {
			const response = await saveEditedEntityRecord( 'postType', 'attachment', postId, {
				throwOnError: true,
				isCached: false,
			} );
			return response;
		} catch {
			createErrorNotice( __( 'Could not save attachment.', 'media-editor' ), {
				id: 'attachment-save-error',
				type: 'snackbar',
			} );
		}
	}, [ saveEditedEntityRecord, postId, createErrorNotice ] );

	const saveEditedData = useCallback( () => {
		if ( isImageCropperDirty ) {
			saveEditedImage();
			reloadAttachment();
			return;
		}

		if ( isEntityRecordDirty ) {
			saveAttachment();
			createSuccessNotice( __( 'Media saved', 'media-editor' ), {
				id: 'attachements-save-success',
				type: 'snackbar',
			} );
			reloadAttachment();
		}
	}, [
		saveAttachment,
		isEntityRecordDirty,
		createSuccessNotice,
		isImageCropperDirty,
		saveEditedImage,
		reloadAttachment,
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
			{ __( 'Save', 'media-editor' ) }
		</Button>
	);
}
