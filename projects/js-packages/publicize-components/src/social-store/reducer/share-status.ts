import {
	FETCH_POST_SHARE_STATUS,
	POLLING_FOR_POST_SHARE_STATUS,
	RECEIVE_POST_SHARE_STATUS,
	TOGGLE_SHARE_STATUS_MODAL,
} from '../actions/constants';
import {
	fetchPostShareStatus,
	pollingForPostShareStatus,
	receivePostShareStaus,
	toggleShareStatusModal,
} from '../actions/share-status';
import { SocialStoreState } from '../types';

type Action =
	| ReturnType<
			| typeof fetchPostShareStatus
			| typeof receivePostShareStaus
			| typeof toggleShareStatusModal
			| typeof pollingForPostShareStatus
	  >
	| { type: 'default' };

/**
 * Connection data reducer
 *
 * @param {SocialStoreState['shareStaus']} state  - State object.
 * @param {Action}                         action - Action object.
 *
 * @return {SocialStoreState['shareStaus']} - The updated state.
 */
export function shareStatus(
	state: SocialStoreState[ 'shareStatus' ] = {},
	action: Action
): SocialStoreState[ 'shareStatus' ] {
	switch ( action.type ) {
		case FETCH_POST_SHARE_STATUS:
			return {
				...state,
				[ action.postId ]: {
					shares: [],
					...state?.[ action.postId ],
					loading: action.loading ?? true,
				},
			};
		case POLLING_FOR_POST_SHARE_STATUS:
			return {
				...state,
				[ action.postId ]: {
					shares: [],
					...state?.[ action.postId ],
					polling: action.polling ?? true,
				},
			};
		case RECEIVE_POST_SHARE_STATUS:
			return {
				...state,
				[ action.postId ]: {
					...state?.[ action.postId ],
					...action.shareStatus,
					loading: false,
				},
			};
		case TOGGLE_SHARE_STATUS_MODAL:
			return {
				...state,
				isModalOpen: action.isOpen,
			};
	}

	return state;
}
