import { createRegistrySelector } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { PostShareStatus, SocialStoreState } from '../types';

/**
 * Get the post share status.
 *
 * @param {SocialStoreState} state  - State object.
 * @param {number}           postId - The post ID.
 *
 * @return {PostShareStatus} - The post share status.
 */
export const getPostShareStatus = createRegistrySelector(
	select =>
		( state: SocialStoreState, postId?: number ): PostShareStatus => {
			// Default to the current post ID if none is provided.
			const id = postId || select( editorStore ).getCurrentPostId();

			return state.shareStatus?.[ id ] ?? { shares: [] };
		}
);
