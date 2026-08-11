import type { ConnectionErrorObject } from './types';

/**
 * Whether a connection error belongs to a user other than the one looking at it.
 *
 * Another (non-owner) user's broken token is not this viewer's to fix: only that
 * user can restore it, and a reconnect deregisters the site and invalidates every
 * user token without giving them a new one. So it must never be the error a CTA
 * is taken from, and surfaces that attribute errors should leave it out
 * altogether.
 *
 * Site and connection-owner errors are never "somebody else's" — those break the
 * site's own connection, and any admin has a stake in them.
 *
 * The comparison needs both IDs to be known: an unattributed error, or a viewer
 * we cannot identify, could still be the viewer's own, and treating it as another
 * user's would hide a real problem.
 *
 * @param {ConnectionErrorObject} error         - The error to place.
 * @param {number|undefined}      currentUserId - The viewer's local WordPress user ID.
 * @return {boolean} Whether the error belongs to somebody else.
 */
export function isOtherUsersConnectionError(
	error: ConnectionErrorObject | undefined,
	currentUserId: number | undefined
): boolean {
	if ( error?.audience !== 'user' || currentUserId === undefined ) {
		return false;
	}

	// `user_id` arrives as a string from the REST payload, the viewer's ID as a
	// number, so the comparison has to coerce.
	const errorUserId = Number( error.user_id );

	return Number.isFinite( errorUserId ) && errorUserId !== Number( currentUserId );
}
