/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { store as coreStore, useEntityId } from '@wordpress/core-data';
import { useViewportMatch } from '@wordpress/compose';
import { Button } from '@wordpress/components';
import { crop as cropIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaEditorSaveButton from '../save-button/';
import DocumentBar from '../document-bar';
import { getMediaTypeFromMimeType } from '../../utils';
import type { MediaItemUpdatable } from '../../types';
import { useMediaEditorState } from '../provider/with-media-editor-state-provider';
import { MEDIA_EDITOR_SIDEBAR } from '../sidebar';
import { getUnlock } from '../../utils/unlock';

const unlock = getUnlock();
const unlockedAPIs = unlock ? unlock( editorPrivateApis ) : null;
const PinnedItems = unlockedAPIs?.PinnedItems;
const interfaceStore = unlockedAPIs?.interfaceStore;

export default function MediaEditorHeader() {
	const postId = useEntityId( 'postType', 'attachment' );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { isImageEditorOpen, setIsImageEditorOpen } = useMediaEditorState();
	const post = useSelect(
		select => select( coreStore ).getEditedEntityRecord( 'postType', 'attachment', postId ),
		[ postId ]
	) as MediaItemUpdatable;
	const { disableComplementaryArea } = interfaceStore
		? useDispatch( interfaceStore )
		: { disableComplementaryArea: () => {} };

	if ( ! post ) {
		return null;
	}

	const mediaType = getMediaTypeFromMimeType( post?.mime_type || '' );

	return (
		<div className="next-admin-media-details__header-container">
			<div className="next-admin-media-details__header-container-back-button">
				{ /* TODO: Replace with appropriate back button for WordPress admin */ }
				{ /* <Button variant="tertiary" onClick={() => window.history.back()}>Back</Button> */ }
			</div>
			<div className="next-admin-media-details__header-container-toolbar">
				{ isMobileViewport && (
					<Button
						className="next-admin-media-editor__toolbar-button"
						variant="tertiary"
						icon={ cropIcon }
						label={ __( 'Crop', 'media-editor' ) }
						isSmall
						onClick={ () => {
							// If we're not already in the image editor,
							// ensure the sidebar is closed. This makes it easier
							// to focus on the image editing experience.
							if ( ! isImageEditorOpen ) {
								disableComplementaryArea( MEDIA_EDITOR_SIDEBAR );
							}
							setIsImageEditorOpen( ! isImageEditorOpen );
						} }
						aria-expanded={ isImageEditorOpen }
						aria-pressed={ isImageEditorOpen }
						aria-controls="next-admin-media-editor-toolbar"
					/>
				) }
			</div>
			<div className="next-admin-media-details__header-container-center">
				{ ! isImageEditorOpen && ! isMobileViewport && (
					<DocumentBar title={ post?.title } icon={ mediaType.icon } />
				) }
			</div>
			<div className="next-admin-media-details__header-container-actions">
				{ PinnedItems && <PinnedItems.Slot scope="core/edit-media" /> }
				<MediaEditorSaveButton postId={ postId } />
			</div>
		</div>
	);
}
