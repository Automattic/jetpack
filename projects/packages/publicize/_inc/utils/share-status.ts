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

/**
 * Check if two share items are for the same connection.
 *
 * @param {ShareStatusItem} a - The first share item.
 * @param {ShareStatusItem} b - The second share item.
 *
 * @return {boolean} - Whether the share items are for the same connection.
 */
export function areShareItemsForSameConnection( a: ShareStatusItem, b: ShareStatusItem ) {
	if ( a.service !== b.service ) {
		return false;
	}

	// If the connection_id matches, they are definitely for the same connection
	if ( a.connection_id === b.connection_id ) {
		return true;
	}

	// external_id may not be present in old data, so we need to check for it
	if ( a.external_id || b.external_id ) {
		return a.external_id === b.external_id;
	}

	return false;
}
