import { __, sprintf } from '@wordpress/i18n';

/**
 * Returns an error message based on the error code.
 *
 * @param {Error} error - Error object
 * @returns {*}	an error message
 */
export function getErrorMessage( error ) {
	switch ( error?.message ) {
		case 'unknown_blog':
		case 'unauthorized':
		case 'bad_request':
		case 'payload_too_large':
		case 'not_supported':
			return sprintf(
				// translators: %s: Error code.
				__(
					'Jetpack Search has encountered an error. Please contact the site administrator if the issue persists. [%s]',
					'jetpack-search-pkg'
				),
				error.message
			);
		case 'offline':
			return __(
				"It looks like you're offline. Please reconnect to load the latest results.",
				'jetpack-search-pkg'
			);

		case 'service_unavailable':
		default:
			return sprintf(
				// translators: %s: Error code.
				__(
					'Jetpack Search is currently unavailable. Please try again later. [%s]',
					'jetpack-search-pkg'
				),
				error?.message ?? 'unknown'
			);
	}
}
