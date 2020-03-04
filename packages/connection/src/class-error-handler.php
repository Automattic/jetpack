<?php
/**
 * The Jetpack Connection Error Handler class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The Jetpack Connection Error Handler class is used to handle the errors
 * generated during the connection process.
 */
class Error_Handler {

	/**
	 * Returns the detailed error message for an error code.
	 *
	 * @param string $error_code The error code.
	 */
	public function get_error_message_from_code( $error_code ) {
		$message = '';

		switch ( $error_code ) {
			case 'cheatin':
				$message = __( "Cheatin' uh?", 'jetpack' );
				break;
			case 'wrong_state':
				$message = __(
					'You need to stay logged in to your WordPress blog while you authorize Jetpack.',
					'jetpack'
				);
				break;
			case 'invalid_client':
				$message = __(
					'We had an issue connecting Jetpack. Please deactivate then reactivate the Jetpack plugin and then connect again.',
					'jetpack'
				);
				break;
			case 'invalid_grant':
				$message = __(
					'There was an issue connecting your Jetpack. Please click "Connect to WordPress.com" again.',
					'jetpack'
				);
				break;
			case 'access_denied':
			case 'site_inaccessible':
			case 'site_requires_authorization':
				$message = __(
					'Your website needs to be publicly accessible to use Jetpack. Please update your website\'s settings and try again',
					'jetpack'
				);
				break;
			case 'site_blacklisted':
				$message = sprintf(
					/* translators: URL to the WPCOM TOS page. */
					__(
						'This site can\'t be connected to WordPress.com because it violates our  <a %s>Terms of Service</a>.',
						'jetpack'
					),
					'href="https://wordpress.com/tos" rel="noopener noreferrer" target="_blank"'
				);
				break;
			case 'not_public':
				$message = __(
					'<strong>Your Jetpack has a glitch.</strong> Connecting this site with WordPress.com is not possible. This usually means your site is not publicly accessible (localhost).',
					'jetpack'
				);
				break;
			case 'wpcom_408':
			case 'wpcom_5??':
			case 'wpcom_bad_response':
			case 'wpcom_outage':
				$message = __(
					'WordPress.com is currently having problems and is unable to fuel up your Jetpack.  Please try again later.',
					'jetpack'
				);
				break;
			case 'register_http_request_failed':
			case 'token_http_request_failed':
				$message = __(
					'Jetpack could not contact WordPress.com.  This usually means something is incorrectly configured on your web host.',
					'jetpack'
				);
				break;
			case 'no_role':
			case 'no_cap':
			case 'no_code':
			case 'no_state':
			case 'invalid_state':
			case 'invalid_request':
			case 'invalid_scope':
			case 'unsupported_response_type':
			case 'invalid_token':
			case 'no_token':
			case 'missing_secrets':
			case 'home_missing':
			case 'siteurl_missing':
			case 'gmt_offset_missing':
			case 'site_name_missing':
			case 'secret_1_missing':
			case 'secret_2_missing':
			case 'site_lang_missing':
			case 'home_malformed':
			case 'siteurl_malformed':
			case 'gmt_offset_malformed':
			case 'timezone_string_malformed':
			case 'site_name_malformed':
			case 'secret_1_malformed':
			case 'secret_2_malformed':
			case 'site_lang_malformed':
			case 'secrets_mismatch':
			case 'verify_secret_1_missing':
			case 'verify_secret_1_malformed':
			case 'verify_secrets_missing':
			case 'verify_secrets_mismatch':
			default:
				$message = sprintf(
					__(
						"<strong>Your Jetpack has a glitch.</strong>  We're sorry for the inconvenience. Please try again later, if the issue continues please <a %1\$s>contact support</a> with this message: %2\$s",
						'jetpack'
					),
					'href="https://jetpack.com/contact-support" rel="noopener noreferrer" target="_blank"',
					esc_html( $error_code )
				);
		}

		return $message;
	}
}
