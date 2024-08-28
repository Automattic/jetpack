/**
 * Normalizes the share status object.
 *
 * @param {import( './types' ).PostShareStatus} shareStatus - Share status object.
 * @return {import( './types' ).PostShareStatus | undefined} - Normalized share status object.
 */
export function normalizeShareStatus( shareStatus ) {
	if ( ! shareStatus || ! ( 'shares' in shareStatus ) || ! shareStatus.done ) {
		return;
	}
	// Sort shares to show the latest shares on the top.
	shareStatus.shares.sort( ( a, b ) => b.timestamp - a.timestamp );

	return shareStatus;
}
