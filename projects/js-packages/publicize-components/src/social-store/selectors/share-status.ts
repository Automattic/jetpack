import { PostShareStatus, SocialStoreState } from '../types';

/**
 * Get the post share status.
 *
 * @param {SocialStoreState} state  - State object.
 * @param {number}           postId - The post ID.
 *
 * @return {SocialStoreState[number]} - The post share status.
 */
export function getPostShareStatus( state: SocialStoreState, postId: number ): PostShareStatus {
	return state.shareStatus?.[ postId ] ?? { shares: [] };
}
