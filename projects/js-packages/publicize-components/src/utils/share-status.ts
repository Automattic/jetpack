/**
 * Normalizes the share status object.
 * TODO: Optimize this function to avoid unnecessary iterations.
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

	// Remove failed shares that have a successful share later.
	shareStatus.shares = shareStatus.shares.filter( share => {
		const hasSuccessfulShareLater = shareStatus.shares.some( otherShare => {
			return (
				otherShare.timestamp > share.timestamp &&
				'success' === otherShare.status &&
				otherShare.external_id === share.external_id &&
				share.external_id // We added external_id later to the object
			);
		} );

		if ( 'failure' === share.status ) {
			return ! hasSuccessfulShareLater;
		}

		return true;
	} );

	return shareStatus;
}
