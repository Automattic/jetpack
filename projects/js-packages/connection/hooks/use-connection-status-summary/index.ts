import { useMemo } from 'react';
import useConnectionErrorNotice from '../use-connection-error-notice';
import type {
	ConnectionErrorObject,
	ConnectionErrorViewer,
} from '../use-connection-error-notice/types.ts';

/**
 * Which half of the connection a set of errors describes, from the viewer's
 * point of view.
 *
 * - `site`: the site's own connection to WordPress.com.
 * - `account`: the viewer's WordPress.com account.
 * - `owner-account`: the connection owner's account, and the viewer is not them.
 * - `mixed`: the errors on screen do not agree on one half.
 */
export type ConnectionErrorScope = 'site' | 'account' | 'owner-account' | 'mixed';

/**
 * How much of a problem the errors are for the viewer.
 *
 * `warning` marks a break only somebody else can repair, so the viewer is being
 * told rather than asked to act.
 */
export type ConnectionErrorSeverity = 'error' | 'warning';

/**
 * The connection status needed by the UI: whether it is broken,
 * which side is affected, and how much it affects this viewer.
 *
 * Contains no copy, so consumers can use their own text and voice.
 *
 * `hasConnectionError` tells the compiler that scope and severity
 * are only present when there is an error.
 */
export type ConnectionStatusSummary =
	| {
			/** Whether there is an error worth showing this viewer. */
			hasConnectionError: false;
			/** Null: nothing is broken, so no half is at fault. */
			scope: null;
			/** Null: nothing is broken, so there is nothing to rate. */
			severity: null;
	  }
	| {
			/** Whether there is an error worth showing this viewer. */
			hasConnectionError: true;
			/** The half of the connection at fault. */
			scope: ConnectionErrorScope;
			/** How much of a problem it is for them. */
			severity: ConnectionErrorSeverity;
	  };

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
