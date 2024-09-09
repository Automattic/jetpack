import { Connection, PostShareStatus, ShareStatusItem } from '../social-store/types';

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

/**
 * Check if a connection matches a share item.
 *
 * @param {ShareStatusItem} shareItem - The share item to match.
 *
 * @return {(connection: Connection) => boolean} - The function to check if a connection matches the share item.
 */
export function connectionMatchesShareItem( shareItem: ShareStatusItem ) {
	return ( connection: Connection ) => {
		// Let return early if the service name doesn't match
		if ( connection.service_name !== shareItem.service ) {
			return false;
		}

		// external_id may not be present in old data, so we need to check for it
		if ( shareItem.external_id ) {
			return connection.external_id === shareItem.external_id;
		}

		// Fallback to matching by connection_id
		return connection.connection_id === shareItem.connection_id.toString();
	};
}
