import { __ } from '@wordpress/i18n';

/**
 * Returns an error message based on the error code.
 *
 * @param {Error} error - Error object
 * @returns {*}	an error message
 */
export function getErrorMessage( error ) {
	switch ( error?.message ) {
		case 'service_unavailable':
			return __(
				'Jetpack Search is currently unavailable. Please try again later.',
				'jetpack-search-pkg'
			);
		case 'unknown_blog':
		case 'unauthorized':
			return __( 'You are not authorized to perform search on the website.', 'jetpack-search-pkg' );
		case 'bad_request':
			return __(
				'One or more parameters are not accepted by the server. Please contact the website administrator.',
				'jetpack-search-pkg'
			);
		case 'payload_too_large':
			return __(
				'The search request is too large. Please contact the website administrator.',
				'jetpack-search-pkg'
			);
		case 'not_supported':
			return __(
				'The website does not have a valid Jetpack Search subscription. Please contact the website administrator.',
				'jetpack-search-pkg'
			);

		default:
			return __( 'An unknown error occurred. Please try again later.', 'jetpack-search-pkg' );
	}
}
