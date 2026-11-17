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
	const code: unknown = registrationError.response?.code;
	if ( typeof code === 'string' && code ) {
		return code;
	}
	return typeof registrationError.name === 'string' ? registrationError.name : undefined;
};

// Matches the PHP helper.
const DESCRIPTION_MAX_LENGTH = 400;

/**
 * The site's own explanation of a registration error, cleaned up so it's safe to display.
 *
 * Applies the same rules as the connection package's `Utils::get_registration_error_description()`:
 * drops messages that are only an HTTP status and `jetpack_id` (which carries the raw response body),
 * and caps the length at a word boundary. It also strips markup, which the PHP version leaves to the caller.
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
		.replace( /[\uD800-\uDBFF]$/, '' )
		.replace( /<[^<>]*>/g, ' ' )
		.replace( /\s+/g, ' ' )
		.trim();
	// Cut by code point so an emoji is never split in half.
	const chars = Array.from( text );
	if ( chars.length <= DESCRIPTION_MAX_LENGTH ) {
		return text || undefined;
	}
	const cut = chars.slice( 0, DESCRIPTION_MAX_LENGTH ).join( '' );
	return cut.replace( /\s+\S*$/u, '' ) || cut;
};

/**
 * One-line message for a registration error: the mapped message, else the site's own description.
 *
 * For surfaces with room for a single line. Callers add their own generic fallback.
 *
 * @param {RegistrationError|false} registrationError - The `registrationError` from `useConnection()`.
 * @param {boolean}                 isOfflineMode     - Whether the site is in offline mode, from `useConnection()`.
 * @return {import('react').ReactNode} The message, or undefined if there isn't one.
 */
export const getRegistrationErrorSummary = (
	registrationError?: RegistrationError | false,
	isOfflineMode?: boolean
): ReactNode => getRegistrationErrorDisplay( registrationError, isOfflineMode ).message;

export type RegistrationErrorDisplay = {
	/** The message to show; undefined when there's nothing better than the caller's generic fallback. */
	message?: ReactNode;
	/** A second line with the underlying cause, when it adds something the message doesn't say. */
	detail?: string;
};

/**
 * The site URL WordPress.com quotes in its text, e.g. "…unable to communicate with your site https://example.com [HTTP 503]".
 *
 * @param {string} description - The site's cleaned explanation of the error.
 * @return {string|undefined} The URL, or undefined when the text has none.
 */
const getSiteUrl = ( description: string ): string | undefined =>
	description.match( /https?:\/\/[^\s\]]+/ )?.[ 0 ].replace( /[.,;:)]+$/, '' );

/**
 * What to show for a registration error: one message, plus a detail line only when it adds something.
 *
 * @param {RegistrationError|false} registrationError - The `registrationError` from `useConnection()`.
 * @param {boolean}                 isOfflineMode     - Whether the site is in offline mode, from `useConnection()`.
 * @return {RegistrationErrorDisplay} The message and optional detail.
 */
export const getRegistrationErrorDisplay = (
	registrationError?: RegistrationError | false,
	isOfflineMode?: boolean
): RegistrationErrorDisplay => {
	const code = getRegistrationErrorCode( registrationError );
	const message = getConnectScreenErrorMessage( code, isOfflineMode );
	const description = getRegistrationErrorDescription( registrationError );

	if ( ! message ) {
		return { message: description };
	}
	if ( ! description ) {
		return { message };
	}
	if ( code === 'register_http_request_failed' ) {
		return { message, detail: description };
	}
	if ( code && /^site_inaccessible_\d{3}$/.test( code ) ) {
		return {
			message: getConnectScreenErrorMessage( code, isOfflineMode, getSiteUrl( description ) ),
		};
	}
	return { message };
};

const offlineModeMessage = () =>
	createInterpolateElement( __( 'Unavailable in <a>Offline Mode</a>', 'jetpack-connection-js' ), {
		a: (
			<a
				href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
				target="_blank"
				rel="noopener noreferrer"
			/>
		),
	} );

const sslMessage = ( siteUrl?: string ) =>
	siteUrl
		? sprintf(
				/* translators: %s is the site URL WordPress.com tried, e.g. https://example.com. */
				__(
					'WordPress.com couldn’t make a secure (HTTPS) connection to your site at %s. Its SSL certificate or HTTPS setup may be invalid. Ask your hosting provider to check it.',
					'jetpack-connection-js'
				),
				siteUrl
			)
		: __(
				'WordPress.com couldn’t make a secure (HTTPS) connection to your site. Its SSL certificate or HTTPS setup may be invalid. Ask your hosting provider to check it.',
				'jetpack-connection-js'
			);

const unreachableMessage = ( siteUrl?: string ) =>
	siteUrl
		? sprintf(
				/* translators: %s is the site URL WordPress.com tried, e.g. https://example.com. */
				__(
					'WordPress.com couldn’t reach your site at %s to verify it. Make sure your site is publicly reachable and its domain and SSL certificate are set up correctly. If they are, ask your hosting provider whether they block connections from WordPress.com.',
					'jetpack-connection-js'
				),
				siteUrl
			)
		: __(
				'WordPress.com couldn’t reach your site to verify it. Make sure your site is publicly reachable and its domain and SSL certificate are set up correctly. If they are, ask your hosting provider whether they block connections from WordPress.com.',
				'jetpack-connection-js'
			);

/**
 * Message for a `site_inaccessible_{status}` code, based on the HTTP status WordPress.com got from the site.
 *
 * @param {number} status  - The HTTP status.
 * @param {string} siteUrl - The URL WordPress.com tried, when known; it helps spot a wrong site address.
 * @return {string} The message.
 */
const siteHttpErrorMessage = ( status: number, siteUrl?: string ): string => {
	if ( status === 404 || status === 405 || status === 410 ) {
		return siteUrl
			? sprintf(
					/* translators: %s is the site URL WordPress.com tried, e.g. https://example.com. */
					__(
						'WordPress.com reached your site at %s, but the connection endpoint was not found. A security plugin or server rule may be blocking xmlrpc.php or the REST API.',
						'jetpack-connection-js'
					),
					siteUrl
				)
			: __(
					'WordPress.com reached your site, but the connection endpoint was not found. A security plugin or server rule may be blocking xmlrpc.php or the REST API.',
					'jetpack-connection-js'
				);
	}
	// Cloudflare's 521–524 and 530 mean the origin server is down or unreachable, 525 and 526 are SSL failures.
	if ( ( status >= 521 && status <= 524 ) || status === 530 ) {
		return unreachableMessage( siteUrl );
	}
	if ( status === 525 || status === 526 ) {
		return sslMessage( siteUrl );
	}
	if ( status >= 500 && status <= 520 ) {
		return siteUrl
			? sprintf(
					/* translators: %1$d is an HTTP status code, e.g. 500; %2$s is the site URL WordPress.com tried, e.g. https://example.com. */
					__(
						'WordPress.com got an error (HTTP %1$d) when it tried to verify your site at %2$s. Your site’s error log may show the cause.',
						'jetpack-connection-js'
					),
					status,
					siteUrl
				)
			: sprintf(
					/* translators: %d is an HTTP status code, e.g. 500. */
					__(
						'WordPress.com got an error (HTTP %d) when it tried to verify your site. Your site’s error log may show the cause.',
						'jetpack-connection-js'
					),
					status
				);
	}
	return siteUrl
		? sprintf(
				/* translators: %1$s is the site URL WordPress.com tried, e.g. https://example.com; %2$d is an HTTP status code, e.g. 403. */
				__(
					'Something blocked WordPress.com from verifying your site at %1$s (HTTP %2$d). Try again in a minute. If it keeps happening, a firewall or security rule is usually the cause: ask your hosting provider to allow connections from WordPress.com.',
					'jetpack-connection-js'
				),
				siteUrl,
				status
			)
		: sprintf(
				/* translators: %d is an HTTP status code, e.g. 403. */
				__(
					'Something blocked WordPress.com from verifying your site (HTTP %d). Try again in a minute. If it keeps happening, a firewall or security rule is usually the cause: ask your hosting provider to allow connections from WordPress.com.',
					'jetpack-connection-js'
				),
				status
			);
};

/**
 * Maps a connection error code (and offline mode) to a user-facing message.
 *
 * The Jetpack plugin's `state-notices.jsx` (`getErrorFromKey`) keeps an overlapping map;
 * when changing copy for a code in both, check the other file too.
 *
 * @param {string}  errorCode     - The connection error code, see `getRegistrationErrorCode()`.
 * @param {boolean} isOfflineMode - Whether the site is in offline mode.
 * @param {string}  siteUrl       - For `site_inaccessible_{status}`: the URL WordPress.com tried, when known.
 * @return {import('react').ReactNode} The error message, or undefined if there isn't one.
 */
export const getConnectScreenErrorMessage = (
	errorCode?: string,
	isOfflineMode?: boolean,
	siteUrl?: string
): ReactNode => {
	// Offline mode takes away the connect capability, so this error means offline mode, not a missing role.
	if ( isOfflineMode && errorCode === 'invalid_user_permission_jetpack_connect' ) {
		return offlineModeMessage();
	}

	const siteHttpStatus = errorCode?.match( /^site_inaccessible_(\d{3})$/ );
	if ( siteHttpStatus ) {
		return siteHttpErrorMessage( Number( siteHttpStatus[ 1 ] ), siteUrl );
	}

	// Explicit error code takes precedence over the offline mode.
	switch ( errorCode ) {
		// WordPress.com rejected the registration.
		case 'fail_domain_forbidden':
		case 'fail_ip_forbidden':
		case 'fail_domain_tld':
		case 'siteurl_private_ip':
		case 'home_private_ip':
		case 'siteurl_private_ip_dev':
			return __(
				'Your site is on a private network, so WordPress.com can’t reach it. Jetpack can only connect sites that are publicly accessible.',
				'jetpack-connection-js'
			);
		case 'fail_subdomain_wpcom':
			return __(
				'Your site’s address is on WordPress.com. Jetpack connects WordPress sites hosted elsewhere, so it can’t connect this one.',
				'jetpack-connection-js'
			);
		case 'connection_disabled':
			return __( 'This site has been suspended.', 'jetpack-connection-js' );
		case 'offline_mode':
			return offlineModeMessage();
		case 'request_cancelled':
			return __(
				'There have been too many connection attempts from this site. Please wait an hour and try again.',
				'jetpack-connection-js'
			);
		case 'site_requires_authorization':
			return __(
				'Your site asks visitors to log in (for example password protection or a maintenance mode plugin), so WordPress.com couldn’t verify it. Turn it off while you connect.',
				'jetpack-connection-js'
			);
		case 'host_lookup_fail':
			return __(
				'WordPress.com couldn’t find your site’s domain. Check that the domain is set up correctly and points to your site.',
				'jetpack-connection-js'
			);
		case 'ssl_error':
			return sslMessage();
		case 'site_inaccessible':
		case 'connection_refused':
		case 'connection_reset':
			return unreachableMessage();
		case 'request_timeout':
		case 'connection_timeout':
			return __(
				'WordPress.com timed out waiting for your site to answer. Your site may be slow or overloaded, or a firewall may be silently dropping the connection. Try again in a minute. If it keeps happening, ask your hosting provider to check.',
				'jetpack-connection-js'
			);
		case 'bad_redirect_url':
			return __(
				'Your site redirected WordPress.com to an address it couldn’t use. Check the WordPress Address and Site Address in Settings › General, and any redirect rules on your site or host.',
				'jetpack-connection-js'
			);
		case 'xml_rpc-32601':
			return __(
				'WordPress.com couldn’t connect to your site through xmlrpc.php. A security plugin or your hosting provider may be blocking it.',
				'jetpack-connection-js'
			);
		case 'xml_extension_missing':
			return __(
				'PHP’s XML extension isn’t available on your site, and Jetpack needs it to connect. Ask your hosting provider to enable it.',
				'jetpack-connection-js'
			);
		case 'xml_rpc-32700':
			return __(
				'WordPress.com couldn’t read your site’s response. Another plugin may be adding extra output to xmlrpc.php. Try deactivating other plugins.',
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
				'The connection attempt expired or was interrupted, for example by another connection attempt at the same time. Please try again.',
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
				'The connection request got an unexpected response. Another plugin or a PHP error may be adding extra output; your site’s error log, or temporarily deactivating other plugins, can show which.',
				'jetpack-connection-js'
			);
		case 'Api404Error':
		case 'Api404AfterRedirectError':
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
				'A critical error stopped the connection. Your site’s error log has the details.',
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
		return offlineModeMessage();
	}

	return undefined;
};
