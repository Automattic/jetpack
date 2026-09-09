import type {
	ConnectionErrorObject,
	ConnectionErrorScope,
	ConnectionErrorSeverity,
	ConnectionErrorViewer,
} from './types.ts';

/**
 * Place a set of displayable errors on the site/account split.
 *
 * Lives beside `isOtherUsersConnectionError`, whose filtering this depends on:
 * a `user` error that survived into the displayable set is the viewer's own,
 * which is what lets this read one as `account` without re-checking the ID.
 *
 * @param {ConnectionErrorObject[]} errors - The errors this viewer is being shown.
 * @param {ConnectionErrorViewer}   viewer - Who is looking.
 * @return {ConnectionErrorScope|null} The half they describe, 'mixed' when they disagree, or null when there are none.
 */
export function getConnectionErrorScope(
	errors: ConnectionErrorObject[],
	viewer: ConnectionErrorViewer = {}
): ConnectionErrorScope | null {
	if ( ! errors.length ) {
		return null;
	}

	const scopes = new Set< ConnectionErrorScope >(
		errors.map( error => {
			// `audience` is optional metadata that a connection package older than the
			// code reading it does not emit, and its documented default is site-wide.
			switch ( error.audience ?? 'site' ) {
				case 'owner':
					return viewer.isOwner ? 'account' : 'owner-account';
				case 'user':
					return 'account';
				default:
					return 'site';
			}
		} )
	);

	if ( scopes.size > 1 ) {
		return 'mixed';
	}

	const [ only ] = [ ...scopes ];

	return only;
}

/**
 * Rate a scope for the viewer looking at it.
 *
 * Only the owner can restore their own token: a reconnect by anyone else
 * deregisters the site rather than repairing it, so for every other viewer that
 * break is news rather than a task.
 *
 * @param {ConnectionErrorScope} scope - The half of the connection at fault.
 * @return {ConnectionErrorSeverity} How much of a problem it is for them.
 */
export function getConnectionErrorSeverity( scope: ConnectionErrorScope ): ConnectionErrorSeverity {
	return scope === 'owner-account' ? 'warning' : 'error';
}
