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
 * Whether a reshare is currently in progress.
 *
 * @param state - State object.
 *
 * @return Whether a reshare is in progress.
 */
export function isResharingPost( state: SocialStoreState ) {
	return state.sharePost?.isResharing ?? false;
}
