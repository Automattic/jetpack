import { createRegistrySelector } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { EMPTY_ARRAY } from '../constants';
import { PostShareStatus, SocialStoreState } from '../types';

// Stable default reference so useSelect can bail out instead of re-rendering on every store change.
const EMPTY_SHARE_STATUS: PostShareStatus = { shares: EMPTY_ARRAY };

/**
 * Get the post share status.
 */
export const getPostShareStatus = createRegistrySelector(
	select =>
		( state: SocialStoreState, postId?: number ): PostShareStatus => {
			// Default to the current post ID if none is provided.
			const id = postId || select( editorStore ).getCurrentPostId();

			return state.shareStatus?.[ id ] ?? EMPTY_SHARE_STATUS;
		}
);
