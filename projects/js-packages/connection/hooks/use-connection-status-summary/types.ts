import type {
	ConnectionErrorScope,
	ConnectionErrorSeverity,
} from '../use-connection-error-notice/types.ts';

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
