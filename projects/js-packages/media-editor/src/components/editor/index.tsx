/**
 * WordPress dependencies
 */
import { useEntityRecord } from '@wordpress/core-data';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { MediaItem } from '../../types';
import MediaProvider from '../provider';
import MediaEditorLayout from '../layout';
// TODO: Re-enable when Agenttic is available
// import { AgentticChatProvider } from '../agenttic-chat';

export default function MediaEditor( {
	postType = 'attachment',
	postId,
	children,
}: {
	postType?: string;
	postId: string;
	children?: React.ReactNode;
} ) {
	const { record, isResolving } = useEntityRecord< MediaItem >( 'postType', postType, postId );

	if ( ! isResolving && ! record ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ __(
					"You attempted to edit an item that doesn't exist. Perhaps it was deleted?",
					'media-editor'
				) }
			</Notice>
		);
	}

	return (
		<MediaProvider post={ record as MediaItem }>
			<MediaEditorLayout />
			{ children }
		</MediaProvider>
	);
}
