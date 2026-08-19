import { __, sprintf } from '@wordpress/i18n';

/**
 * Format the message shown when a connection restore (reconnect) attempt fails.
 *
 * The single source of truth for this copy, so consumers render it instead of
 * re-authoring the string themselves.
 *
 * @param error - The restore error detail returned by the reconnect attempt.
 * @return The formatted, translatable reconnect-failure message.
 */
export function getReconnectErrorMessage( error: string ): string {
	return sprintf(
		/* translators: %s: the error. */
		__( 'There was an error reconnecting Jetpack. Error: %s', 'jetpack-connection-js' ),
		error
	);
}
