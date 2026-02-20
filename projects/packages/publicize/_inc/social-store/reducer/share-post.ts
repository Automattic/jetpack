import { SET_IS_SHARING_CURRENT_POST, TOGGLE_SHARE_POST_MODAL } from '../actions/constants';
import { setIsSharingCurrentPost, toggleSharePostModal } from '../actions/share-post';
import { SocialStoreState } from '../types';

type Action =
	| ReturnType< typeof toggleSharePostModal | typeof setIsSharingCurrentPost >
	| { type: 'default' };

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
		case TOGGLE_SHARE_POST_MODAL:
			return {
				...state,
				isModalOpen: action.isOpen,
			};

		case SET_IS_SHARING_CURRENT_POST:
			return {
				...state,
				isSharingCurrentPost: action.isSharing,
			};
	}

	return state;
}
