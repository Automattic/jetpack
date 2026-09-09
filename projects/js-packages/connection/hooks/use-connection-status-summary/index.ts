import { useMemo } from 'react';
import useConnectionErrorNotice from '../use-connection-error-notice';
import type { ConnectionErrorScope, ConnectionStatusSummary } from './types.ts';
import type {
	ConnectionErrorObject,
	ConnectionErrorViewer,
} from '../use-connection-error-notice/types.ts';

export type * from './types.ts';

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
 * The connection's standing for a status surface — a card, a badge, a health row.
 *
 * Sits alongside `useConnectionErrorNotice`, which answers what to *say* about an
 * error; this answers what the connection *is*. Both read the same displayable
 * set, so a surface built on either cannot contradict one built on the other.
 *
 * @return {ConnectionStatusSummary} Whether the connection is broken, which half, and how badly.
 */
export default function useConnectionStatusSummary(): ConnectionStatusSummary {
	const { hasConnectionError, displayableErrors, viewer } = useConnectionErrorNotice();

	return useMemo( (): ConnectionStatusSummary => {
		const scope = getConnectionErrorScope( displayableErrors, viewer );

		// Both sides read the same displayable set, so they agree already; naming
		// the pair keeps the summary honest even if one of them ever drifts.
		if ( ! hasConnectionError || scope === null ) {
			return { hasConnectionError: false, scope: null, severity: null };
		}

		return {
			hasConnectionError: true,
			scope,
			// Only the owner can restore their own token: a reconnect by anyone else
			// deregisters the site rather than repairing it, so for every other viewer
			// that break is news rather than a task.
			severity: scope === 'owner-account' ? 'warning' : 'error',
		};
	}, [ hasConnectionError, displayableErrors, viewer ] );
}
