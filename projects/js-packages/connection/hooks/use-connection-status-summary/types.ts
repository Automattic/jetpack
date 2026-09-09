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
