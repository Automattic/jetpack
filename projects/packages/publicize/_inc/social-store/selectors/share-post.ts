import type { SocialStoreState } from '../types';

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
