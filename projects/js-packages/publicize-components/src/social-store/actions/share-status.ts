import { SocialStoreState } from '../types';
import { FETCH_POST_SHARE_STATUS, RECEIVE_POST_SHARE_STATUS } from './constants';

/**
 * Returns an action object used in signalling that the post share status
 * has been requested and is loading.
 *
 * @param {number}  postId    - Post ID.
 * @param {boolean} [loading] - Loading status.
 * @return {object} Action object.
 */
export function fetchPostShareStatus( postId: number, loading = true ) {
	return {
		type: FETCH_POST_SHARE_STATUS,
		postId,
		loading,
	};
}

/**
 * Returns an action object used in signalling that the post share status has been received.
 *
 * @param {SocialStoreState[ 'shareStaus' ][ number ]} shareStatus - Post share status.
 * @param {number}                                     postId      - Post ID.
 *
 * @return {object} Action object.
 */
export function receivePostShareStaus(
	shareStatus: SocialStoreState[ 'shareStatus' ][ number ],
	postId: number
) {
	return {
		type: RECEIVE_POST_SHARE_STATUS,
		shareStatus,
		postId,
	};
}
