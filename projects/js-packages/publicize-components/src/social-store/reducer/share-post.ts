import { TOGGLE_SHARE_POST_MODAL, SET_IS_RESHARING } from '../actions/constants';
import { toggleSharePostModal, setIsResharing } from '../actions/share-post';
import { SocialStoreState } from '../types';

type Action =
	| ReturnType< typeof toggleSharePostModal >
	| ReturnType< typeof setIsResharing >
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
		case SET_IS_RESHARING:
			return {
				...state,
				isResharing: action.isResharing,
			};
	}

	return state;
}
