import type { ConnectionErrorObject } from './types.ts';

/**
 * Who a user-audience error is attributed to, relative to the viewer.
 *
 * `unknown` is a real answer rather than a failure: an unattributed error, or a
 * viewer we cannot identify, leaves no basis for placing the error with anyone.
 */
export type ConnectionErrorUserScope = 'self' | 'other' | 'unknown';

/**
 * Place a user-audience error's `user_id` against the viewer's own.
 *
 * Attribution only — the caller decides whether the audience makes the question
 * worth asking, and what an unplaceable error should mean for it. Both the
 * filtering rule and the display label go through here so they cannot disagree
 * about the same error: an error that can't be placed must not be filtered out
 * as somebody else's, nor labelled as somebody else's.
 *
 * @param {ConnectionErrorObject} error         - The error to place.
 * @param {number|undefined}      currentUserId - The viewer's local WordPress user ID.
 * @return {ConnectionErrorUserScope} Whose account the error names, as far as we can tell.
 */
export function getConnectionErrorUserScope(
	error: ConnectionErrorObject | undefined,
	currentUserId: number | undefined
): ConnectionErrorUserScope {
	if ( currentUserId === undefined || ! error?.user_id ) {
		return 'unknown';
	}

	// `user_id` arrives as a string from the REST payload, the viewer's ID as a
	// number, so the comparison has to coerce. The `!error.user_id` check above
	// rules out `undefined` and `''` before this runs, so an empty string can't
	// coerce to `0` and collide with a real user ID.
	const errorUserId = Number( error.user_id );

	if ( ! Number.isFinite( errorUserId ) ) {
		return 'unknown';
	}

	return errorUserId === Number( currentUserId ) ? 'self' : 'other';
}

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
	return (
		error?.audience === 'user' && getConnectionErrorUserScope( error, currentUserId ) === 'other'
	);
}
