/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';
import { useEntityRecord } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaProvider from '../../provider';
import MediaEditorLayout from '../layout';
import type { MediaItem } from '../../types';

/**
 *
 */
export default function MediaEditor( {
	postType = 'attachment',
	postId,
	children,
	isPreview = false,
}: {
	postType?: string;
	postId: string;
	isPreview?: boolean;
	children?: React.ReactNode;
} ) {
	const { record, isResolving } = useEntityRecord< MediaItem >( 'postType', postType, postId );

	if ( ! isResolving && ! record ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ __(
					"You attempted to edit an item that doesn't exist. Perhaps it was deleted?",
					'no text domain is set in this in this project's eslint.config.mjs or composer.json'
				) }
			</Notice>
		);
	}

	const editLink = `/types/${ postType }/edit/${ postId }`;

	return (
		<MediaProvider post={ record as MediaItem }>
			<MediaEditorLayout isPreview={ isPreview } editLink={ editLink } />
			{ children }
		</MediaProvider>
	);
}
