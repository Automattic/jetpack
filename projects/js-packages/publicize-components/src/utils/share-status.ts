import { PostShareStatus } from '../social-store/types';

/**
 * Normalizes the share status object.
 *
 * @param {PostShareStatus} shareStatus - Share status object.
 * @return {PostShareStatus} - Normalized share status object.
 */
export function normalizeShareStatus( shareStatus: PostShareStatus ) {
	if ( shareStatus && 'shares' in shareStatus && shareStatus.done ) {
		// Sort shares to show the latest shares on the top.
		shareStatus.shares.sort( ( a, b ) => b.timestamp - a.timestamp );
	}

	return shareStatus;
}
