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

/**
 * Whether the share status modal is open.
 *
 * @param {SocialStoreState} state - State object.
 *
 * @return {boolean} Whether the share status modal is open.
 */
export function isShareStatusModalOpen( state: SocialStoreState ) {
	return state.shareStatus?.isModalOpen ?? false;
}
