import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import type { RegistrationError } from '../components/use-connection/types';
import type { ReactNode } from 'react';

/**
 * Turns a registration error into a code the message map understands.
 *
 * Errors returned by the site's REST API carry a code in `response.code`: either WordPress.com's own
 * error (e.g. `site_inaccessible_403`) or a site-side one (e.g. `rest_cookie_invalid_nonce`).
 * When the site's response couldn't be read at all, the API client throws an error with only a name
 * (e.g. `JsonParseError`), which is used instead.
 *
 * @param {RegistrationError|false} registrationError - The `registrationError` from `useConnection()`.
 * @return {string|undefined} The error code, or undefined when there's no error.
 */
export const getRegistrationErrorCode = (
	registrationError?: RegistrationError | false
): string | undefined => {
	if ( ! registrationError ) {
		return undefined;
	}
	if ( registrationError.response?.code ) {
		return registrationError.response.code;
	}
	return typeof registrationError.name === 'string' ? registrationError.name : undefined;
};

/**
 * The site's own explanation of a registration error, safe to show under the mapped message.
 *
 * Mirrors `Jetpack::get_registration_error_description()`: drops messages that are only an HTTP
 * status and `jetpack_id` (which carries the raw response body), strips markup, and caps the length.
 *
 * @param {RegistrationError|false} registrationError - The `registrationError` from `useConnection()`.
 * @return {string|undefined} The description, or undefined when there's nothing worth showing.
 */
export const getRegistrationErrorDescription = (
	registrationError?: RegistrationError | false
): string | undefined => {
	if ( ! registrationError ) {
		return undefined;
	}
	const message = registrationError.response?.message;
	if (
		typeof message !== 'string' ||
		'jetpack_id' === registrationError.response?.code ||
		/^\s*\d+\s*$/.test( message )
	) {
		return undefined;
	}
	// The message comes from the site, so bound its length and keep the tag pattern linear-time.
	const text = message
		.slice( 0, 1000 )
		.replace( /<[^<>]*>/g, ' ' )
		.replace( /\s+/g, ' ' )
		.trim();
	return text ? text.slice( 0, 250 ) : undefined;
};

/**
 * One-line message for a registration error: the mapped message, else the site's own description.
 *
 * For surfaces with room for a single line. Callers add their own generic fallback.
 *
 * @param {RegistrationError|false} registrationError - The `registrationError` from `useConnection()`.
 * @return {import('react').ReactNode} The message, or undefined if there isn't one.
 */
export const getRegistrationErrorSummary = (
	registrationError?: RegistrationError | false
): ReactNode =>
	getConnectScreenErrorMessage( getRegistrationErrorCode( registrationError ) ) ||
	getRegistrationErrorDescription( registrationError );

const unreachableMessage = () =>
	__(
		'WordPress.com couldn’t reach your site to verify it. Make sure your site is publicly reachable and its domain and SSL certificate are set up correctly. If they are, ask your hosting provider whether they block connections from WordPress.com.',
		'jetpack-connection-js'
	);

/**
 * Message for a `site_inaccessible_{status}` code, based on the HTTP status WordPress.com got from the site.
 *
 * @param {number} status - The HTTP status.
 * @return {string} The message.
 */
const siteHttpErrorMessage = ( status: number ): string => {
	if ( status === 404 || status === 405 || status === 410 ) {
		return __(
			'WordPress.com reached your site, but the connection endpoint was not found. A security plugin or server rule may be blocking xmlrpc.php or the REST API.',
			'jetpack-connection-js'
		);
	}
	if ( status >= 500 && status < 520 ) {
		return sprintf(
			/* translators: %d is an HTTP status code, e.g. 500. */
			__(
				'Your site returned an error (HTTP %d) when WordPress.com tried to verify it. Check your site’s error log, then try again.',
				'jetpack-connection-js'
			),
			status
		);
	}
	return sprintf(
		/* translators: %d is an HTTP status code, e.g. 403. */
		__(
			'Something blocked WordPress.com from verifying your site (HTTP %d). This is usually a firewall, CDN or security plugin. Ask your hosting provider to allow connections from WordPress.com.',
			'jetpack-connection-js'
		),
		status
	);
};

/**
 * Maps a connection error code (and offline mode) to a user-facing message.
 *
 * Covers three kinds of registration failure:
 * - WordPress.com rejected the registration (it couldn't verify the site, or refused it).
 * - The site's own REST request failed before WordPress.com was contacted.
 * - The site couldn't reach WordPress.com.
 *
 * The Jetpack plugin keeps its own overlapping code→copy map in
 * `projects/plugins/jetpack/_inc/client/components/jetpack-notices/state-notices.jsx`
 * (`getErrorFromKey`); when changing copy for a code shared by both, check the other file too.
 *
 * @param {string}  errorCode     - The connection error code, see `getRegistrationErrorCode()`.
 * @param {boolean} isOfflineMode - Whether the site is in offline mode.
 * @return {import('react').ReactNode} The error message, or undefined if there isn't one.
 */
export const getConnectScreenErrorMessage = (
	errorCode?: string,
	isOfflineMode?: boolean
): ReactNode => {
	const siteHttpStatus = errorCode?.match( /^site_inaccessible_(\d{3})$/ );
	if ( siteHttpStatus ) {
		return siteHttpErrorMessage( Number( siteHttpStatus[ 1 ] ) );
	}

	// Explicit error code takes precedence over the offline mode.
	switch ( errorCode ) {
		// WordPress.com rejected the registration.
		case 'fail_domain_forbidden':
		case 'fail_ip_forbidden':
		case 'fail_domain_tld':
		case 'fail_subdomain_wpcom':
		case 'siteurl_private_ip':
		case 'home_private_ip':
		case 'siteurl_private_ip_dev':
			return __(
				'Your site host is on a private network. Sites can connect to WordPress.com only on public sites.',
				'jetpack-connection-js'
			);
		case 'connection_disabled':
			return __( 'This site has been suspended.', 'jetpack-connection-js' );
		case 'offline_mode':
			return __(
				'This site is in Offline Mode (for example a local development site), so it can’t connect to WordPress.com.',
				'jetpack-connection-js'
			);
		case 'request_cancelled':
			return __(
				'There have been too many connection attempts from this site. Please wait an hour and try again.',
				'jetpack-connection-js'
			);
		case 'site_requires_authorization':
			return __(
				'Your site asks visitors to log in (for example password protection or a maintenance mode plugin), so WordPress.com couldn’t verify it. Turn that off while you connect, then try again.',
				'jetpack-connection-js'
			);
		case 'host_lookup_fail':
			return __(
				'WordPress.com couldn’t find your site’s domain. Check that the domain is set up correctly and points to your site, then try again.',
				'jetpack-connection-js'
			);
		case 'ssl_error':
			return __(
				'WordPress.com couldn’t verify your site because its SSL certificate isn’t valid. Ask your hosting provider to fix the certificate, then try again.',
				'jetpack-connection-js'
			);
		case 'site_inaccessible':
		case 'request_timeout':
		case 'connection_timeout':
		case 'connection_refused':
		case 'connection_reset':
		case 'bad_redirect_url':
			return unreachableMessage();
		case 'xml_rpc-32700':
		case 'xml_rpc-32601':
			return __(
				'WordPress.com couldn’t read your site’s response. Another plugin may be adding extra output to xmlrpc.php. Try deactivating other plugins, then connect again.',
				'jetpack-connection-js'
			);
		case 'verify_secrets_missing':
		case 'verify_secrets_expired':
		case 'verify_secrets_mismatch':
		case 'verify_secrets_empty':
		case 'verify_secrets_incomplete':
		case 'verify_secret_1_missing':
		case 'verify_secret_1_malformed':
		case 'state_missing':
		case 'state_malformed':
		case 'registration_state_invalid':
			return __(
				'The connection attempt expired or was interrupted. Please try again.',
				'jetpack-connection-js'
			);
		case 'insert_blog':
		case 'new_access_token':
		case 'get_blog_details':
		case 'unknown':
			return __(
				'WordPress.com couldn’t register your site right now. Please try again in a few minutes, and contact support if it keeps happening.',
				'jetpack-connection-js'
			);

		// The site's own REST request failed before WordPress.com was contacted.
		case 'JsonParseError':
		case 'JsonParseAfterRedirectError':
			return __(
				'Your site sent an unexpected response. A plugin or PHP error may be adding extra output. Check your site’s error log, or temporarily deactivate other plugins, then try again.',
				'jetpack-connection-js'
			);
		case 'Api404Error':
		case 'Api404AfterRedirectError':
		case 'rest_no_route':
			return __(
				'Your site’s REST API couldn’t be reached. A security plugin or server rule may be blocking it.',
				'jetpack-connection-js'
			);
		case 'FetchNetworkError':
			return __(
				'Your browser couldn’t complete the request to your site. A firewall, CDN or redirect may be interfering. Reload the page and try again.',
				'jetpack-connection-js'
			);
		case 'rest_cookie_invalid_nonce':
			return __( 'Your session expired. Reload the page and try again.', 'jetpack-connection-js' );
		case 'internal_server_error':
			return __(
				'Your site ran into a critical error while connecting. Check your site’s error log for details.',
				'jetpack-connection-js'
			);
		case 'invalid_user_permission_jetpack_connect':
			return __(
				'Only site administrators can connect this site. Ask an administrator to connect it.',
				'jetpack-connection-js'
			);

		// The site couldn't reach WordPress.com.
		case 'register_http_request_failed':
			return __(
				'Your site couldn’t reach WordPress.com. Ask your hosting provider to allow outgoing connections from your site to jetpack.wordpress.com.',
				'jetpack-connection-js'
			);
		case 'wpcom_408':
		case 'wpcom_5??':
			return __(
				'WordPress.com is temporarily unavailable. Please try again in a minute.',
				'jetpack-connection-js'
			);
		case 'wpcom_bad_response':
			return __(
				'Your site got an unexpected response from WordPress.com. If your hosting provider filters outgoing connections, ask them to allow jetpack.wordpress.com.',
				'jetpack-connection-js'
			);
		case 'jetpack_id':
			return __(
				'WordPress.com returned an unexpected response when registering your site. Please try again in a minute.',
				'jetpack-connection-js'
			);
	}

	if ( isOfflineMode ) {
		return createInterpolateElement(
			__( 'Unavailable in <a>Offline Mode</a>', 'jetpack-connection-js' ),
			{
				a: (
					<a
						href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		);
	}

	return undefined;
};
