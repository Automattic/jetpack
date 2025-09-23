/**
 * WordPress dependencies
 */
import { store as coreStore, useEntityId } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
// TODO: Replace with available alternative
// import { SiteIconBackButton, unlock } from '@wordpress/admin-toolkit';

/**
 * Internal dependencies
 */
import { getMediaTypeFromMimeType } from '../../utils.ts';
import DocumentBar from '../document-bar/index.tsx';
import MediaEditorSaveButton from '../save-button/index.tsx';
import type { MediaItemUpdatable } from '../../types.tsx';

// TODO: Replace with available alternative
// const { PinnedItems } = unlock( editorPrivateApis );
const PinnedItems = {
	Slot: ( { scope }: any ) => null,
};

/**
 *
 */
export default function MediaEditorHeader() {
	const postId = useEntityId( 'postType', 'attachment' );
	const post = useSelect(
		select =>
			( select( coreStore ) as any ).getEditedEntityRecord( 'postType', 'attachment', postId ),
		[ postId ]
	) as MediaItemUpdatable;

	if ( ! post ) {
		return null;
	}

	const mediaType = getMediaTypeFromMimeType( post?.mime_type || '' );

	return (
		<div className="next-admin-media-details__header-container">
			<div className="next-admin-media-details__header-container-back-button">
				{ /* TODO: Replace with available alternative */ }
				{ /* <SiteIconBackButton to="/types/attachment/list" /> */ }
			</div>
			<div className="next-admin-media-details__header-container-toolbar">
				{ /* @TODO: Add editing top tool bar. */ }
			</div>
			<div className="next-admin-media-details__header-container-center">
				<DocumentBar title={ post?.title } icon={ mediaType.icon } />
			</div>
			<div className="next-admin-media-details__header-container-actions">
				<PinnedItems.Slot scope="core/edit-media" />
				<MediaEditorSaveButton postId={ postId } />
			</div>
		</div>
	);
}
