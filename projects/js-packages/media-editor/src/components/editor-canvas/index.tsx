/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Flex } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityId } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import MediaRenderer from '../media-renderer';
import { useMediaEditorState } from '../provider/with-media-editor-state-provider';

export default function MediaEditorCanvas() {
	const postId = useEntityId( 'postType', 'attachment' );
	const post = useSelect(
		select =>
			select( coreStore ).getEntityRecord( 'postType', 'attachment', postId, { _embed: 'post' } ),
		[ postId ]
	);
	const { isImageEditorOpen } = useMediaEditorState();
	if ( ! post ) {
		return null;
	}

	return (
		<Flex
			className={ clsx( 'next-admin-media-details__content-container', {
				'next-admin-media-details__content-container--cropper': isImageEditorOpen,
			} ) }
			direction="column"
			justify="center"
			align="center"
			gap={ 2 }
		>
			<MediaRenderer post={ post } />
		</Flex>
	);
}
