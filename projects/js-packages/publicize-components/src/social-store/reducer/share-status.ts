import { FETCH_POST_SHARE_STATUS, RECEIVE_POST_SHARE_STATUS } from '../actions/constants';
import { fetchPostShareStatus, receivePostShareStaus } from '../actions/share-status';
import { SocialStoreState } from '../types';

type Action =
	| ReturnType< typeof fetchPostShareStatus | typeof receivePostShareStaus >
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
		case RECEIVE_POST_SHARE_STATUS:
			return {
				...state,
				[ action.postId ]: {
					...action.shareStatus,
					loading: false,
				},
			};
	}

	return state;
}
