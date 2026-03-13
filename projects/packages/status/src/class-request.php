<?php
/**
 * Get information about the current request.
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack\Status;

use Automattic\Jetpack\Constants;

/**
 * Get information about the current request.
 */
class Request {
	/**
	 * Determine whether the current request is for accessing the frontend.
	 * Also update Vary headers to indicate that the response may vary by Accept header.
	 *
	 * @since 6.0.3 Added $send_vary_headers argument.
	 *
	 * @param bool $send_vary_headers Whether to send Vary headers.
	 *
	 * @return bool True if it's a frontend request, false otherwise.
	 */
	public static function is_frontend( $send_vary_headers = true ) {
		$is_frontend        = true;
		$is_varying_request = true;

		if (
			is_admin()
			|| wp_doing_ajax()
			|| wp_is_jsonp_request()
			|| is_feed()
			|| Constants::is_true( 'REST_REQUEST' )
			|| Constants::is_true( 'REST_API_REQUEST' )
			|| Constants::is_true( 'WP_CLI' )
			|| Constants::is_true( 'WPCOM_CLI_SCRIPT' ) // Special case for CLI scripts on WP.com that aren't using WP CLI.
		) {
			$is_frontend        = false;
			$is_varying_request = false;
		} elseif (
			wp_is_json_request()
			|| wp_is_xml_request()
		) {
			$is_frontend = false;
		}

		/*
		* Check existing headers for the request.
		* If there is no existing Vary Accept header, add one.
		*/
		if ( $send_vary_headers && $is_varying_request && ! headers_sent() ) {
			$headers           = headers_list();
			$vary_header_parts = self::get_vary_headers( $headers );

			header( 'Vary: ' . implode( ', ', $vary_header_parts ) );
		}

		/**
		 * Filter whether the current request is for accessing the frontend.
		 *
		 * @since jetpack-9.0.0
		 * @since 6.0.3 Added $send_vary_headers argument.
		 *
		 * @param bool $is_frontend Whether the current request is for accessing the frontend.
		 * @param bool $send_vary_headers Whether to send Vary headers.
		 */
		return (bool) apply_filters( 'jetpack_is_frontend', $is_frontend, $send_vary_headers );
	}

	/**
	 * Go through headers and get a list of Vary headers to add,
	 * including Vary on Accept and Content-Type if necessary.
	 *
	 * @since jetpack-12.2
	 *
	 * @param array $headers The headers to be sent.
	 *
	 * @return array $vary_header_parts Vary Headers to be sent.
	 */
	public static function get_vary_headers( $headers = array() ) {
		$vary_header_parts = array( 'accept', 'content-type' );

		foreach ( $headers as $header ) {
			// Check for a Vary header.
			if ( ! str_starts_with( strtolower( $header ), 'vary:' ) ) {
				continue;
			}

			// If the header is a wildcard, we'll return that.
			if ( str_contains( $header, '*' ) ) {
				$vary_header_parts = array( '*' );
				break;
			}

			// Remove the Vary: part of the header.
			$header = preg_replace( '/^vary\:\s?/i', '', $header );

			// Remove spaces from the header.
			$header = str_replace( ' ', '', $header );

			// Break the header into parts.
			$header_parts = explode( ',', strtolower( $header ) );

			// Build an array with the Accept header and what was already there.
			$vary_header_parts = array_values( array_unique( array_merge( $vary_header_parts, $header_parts ) ) );
		}

		return $vary_header_parts;
	}
}
