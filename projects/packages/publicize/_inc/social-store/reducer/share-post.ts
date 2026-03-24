import { SET_IS_SHARING_CURRENT_POST } from '../actions/constants';
import { setIsSharingCurrentPost } from '../actions/share-post';
import { SocialStoreState } from '../types';

type Action = ReturnType< typeof setIsSharingCurrentPost > | { type: 'default' };

/**
 * Share post data reducer
 *
 * @param state  - State object.
 * @param action - Action object.
 *
 * @return - The updated state.
 */
export function sharePost(
	state: SocialStoreState[ 'sharePost' ] = {},
	action: Action
): SocialStoreState[ 'sharePost' ] {
	switch ( action.type ) {
		case SET_IS_SHARING_CURRENT_POST:
			return {
				...state,
				isSharingCurrentPost: action.isSharing,
			};
	}

	return state;
}
