import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { ReactNode } from 'react';

/**
 * Maps a connection error code (and offline mode) to a user-facing message.
 *
 * The Jetpack plugin keeps its own overlapping code→copy map in
 * `projects/plugins/jetpack/_inc/client/components/jetpack-notices/state-notices.jsx`
 * (`getErrorFromKey`); when changing copy for a code shared by both, check the other file too.
 *
 * @param {string}  errorCode     - The connection error code.
 * @param {boolean} isOfflineMode - Whether the site is in offline mode.
 * @return {import('react').ReactNode} The error message, or undefined if there isn't one.
 */
export const getConnectScreenErrorMessage = (
	errorCode?: string,
	isOfflineMode?: boolean
): ReactNode => {
	// Explicit error code takes precedence over the offline mode.
	switch ( errorCode ) {
		case 'fail_domain_forbidden':
		case 'fail_ip_forbidden':
		case 'fail_domain_tld':
		case 'fail_subdomain_wpcom':
		case 'siteurl_private_ip':
			return __(
				'Your site host is on a private network. Sites can connect to WordPress.com only on public sites.',
				'jetpack-connection-js'
			);
		case 'connection_disabled':
			return __( 'This site has been suspended.', 'jetpack-connection-js' );
		case 'register_http_request_failed':
			return __(
				'Your site could not reach WordPress.com. This is usually temporary — try again in a minute. If it keeps happening, ask your hosting provider to allow connections to jetpack.wordpress.com.',
				'jetpack-connection-js'
			);
		case 'wpcom_408':
		case 'wpcom_5??':
		case 'wpcom_bad_response':
			return __(
				'WordPress.com is temporarily unavailable. Please try again in a minute.',
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
