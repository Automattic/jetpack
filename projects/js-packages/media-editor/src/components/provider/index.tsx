/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { EntityProvider } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import type { MediaItem } from '../../types';
import withMediaEditorStateProvider from './with-media-editor-state-provider';

/*
 * withMediaEditorStateProvider is a higher-order component that wraps the
 * MediaEditorProvider to provide the media editor state to child components.
 * When a fully-fledged store/state management solution is implemented,
 * withMediaEditorStateProvider can be removed.
 */
const MediaEditorProvider = withMediaEditorStateProvider(
	( { post, children }: { post: MediaItem; children: ReactNode } ) => {
		if ( ! post ) {
			return null;
		}

		return (
			<EntityProvider kind="postType" type="attachment" id={ post.id }>
				{ children }
			</EntityProvider>
		);
	}
);

export default MediaEditorProvider;
