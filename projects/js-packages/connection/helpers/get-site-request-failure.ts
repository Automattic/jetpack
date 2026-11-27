import { __ } from '@wordpress/i18n';

/** Why a request to the site's own REST API failed, whatever the request was for. */
export type SiteRequestFailureCause =
	'offline' | 'blocked' | 'output' | 'session' | 'permission' | 'server';

/**
 * Classify a failed request to the site's own REST API.
 *
 * Endpoint-specific codes, such as WordPress.com's registration errors, are left to the caller.
 *
 * @param code   - The REST error code, or the `@automattic/jetpack-api` client error's name when there is none.
 * @param status - The HTTP status, when known.
 * @return The cause, or undefined when the code and status say nothing site-side.
 */
export function getSiteRequestFailureCause(
	code?: string,
	status?: number | null
): SiteRequestFailureCause | undefined {
	switch ( code ) {
		// The request never completed: no connection, or a firewall, CDN or redirect in the way.
		case 'FetchNetworkError':
			return 'offline';
		// A non-JSON answer: something, usually a plugin or a PHP error, printed extra output.
		case 'JsonParseError':
		case 'JsonParseAfterRedirectError':
			return 'output';
		// The REST route is missing, so a security plugin or server rule is blocking it.
		case 'Api404Error':
		case 'Api404AfterRedirectError':
			return 'blocked';
	}

	// WordPress sends 401 when the request has no logged-in user, whatever the error code.
	if ( status === 401 ) {
		return 'session';
	}

	switch ( code ) {
		case 'rest_disabled':
			return 'blocked';
		// The client does not refresh an expired nonce, so a reload is what fixes it.
		case 'rest_cookie_invalid_nonce':
		case 'rest_not_logged_in':
			return 'session';
		case 'rest_forbidden':
			return 'permission';
		// WordPress's fatal error handler.
		case 'internal_server_error':
			return 'server';
	}

	return status === 403 ? 'permission' : undefined;
}

/**
 * What to tell the user about a failed request to the site's own REST API.
 *
 * @param cause - Why it failed.
 * @return The message.
 */
export function getSiteRequestFailureMessage( cause: SiteRequestFailureCause ): string {
	switch ( cause ) {
		case 'offline':
			return __(
				'Your browser couldn’t complete the request to your site. A firewall, CDN or redirect may be interfering. Reload the page and try again.',
				'jetpack-connection-js'
			);
		case 'blocked':
			return __(
				'Your site’s REST API couldn’t be reached. A security plugin or server rule may be blocking it.',
				'jetpack-connection-js'
			);
		case 'output':
			return __(
				'Your site sent an unexpected response. Another plugin or a PHP error may be adding extra output; your site’s error log, or temporarily deactivating other plugins, can show which.',
				'jetpack-connection-js'
			);
		case 'session':
			return __( 'Your session expired. Reload the page and try again.', 'jetpack-connection-js' );
		case 'permission':
			return __(
				'You don’t have permission to do this. Ask a site administrator.',
				'jetpack-connection-js'
			);
		case 'server':
			return __(
				'Your site’s server ran into a problem. Try again in a few minutes. If it keeps happening, your site’s error log may show the cause.',
				'jetpack-connection-js'
			);
		default: {
			// Fails to compile when a cause is added without a message.
			const unhandled: never = cause;
			return unhandled;
		}
	}
}
