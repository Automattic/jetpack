import type { SocialStoreState } from '../types';

/**
 * Whether the share post modal is open.
 *
 * @param state - State object.
 *
 * @return Whether the share post modal is open.
 */
export function isSharePostModalOpen( state: SocialStoreState ) {
	return state.sharePost?.isModalOpen ?? false;
}

/**
 * Whether the current post is being shared.
 *
 * @param state - State object.
 *
 * @return Whether the current post is being shared.
 */
export function isSharingCurrentPost( state: SocialStoreState ) {
	return state.sharePost?.isSharingCurrentPost ?? false;
}
