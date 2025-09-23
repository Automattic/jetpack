/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { __experimentalVStack as Stack } from '@wordpress/components';
import { store as coreStore, useEntityId } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import { useMediaEditorState } from '../../provider/with-media-editor-state-provider.tsx';
import MediaRenderer from '../media-renderer/index.tsx';

/**
 *
 */
export default function MediaEditorCanvas() {
	const postId = useEntityId( 'postType', 'attachment' );
	const post = useSelect(
		select => ( select( coreStore ) as any ).getEntityRecord( 'postType', 'attachment', postId ),
		[ postId ]
	) as any;
	const { isImageEditorOpen } = useMediaEditorState();
	if ( ! post ) {
		return null;
	}

	return (
		<Stack
			className={ clsx( 'next-admin-media-details__content-container', {
				'next-admin-media-details__content-container--cropper': isImageEditorOpen,
			} ) }
			direction="column"
			justify="center"
			align="center"
			gap={ 2 }
		>
			<MediaRenderer post={ post } />
		</Stack>
	);
}
