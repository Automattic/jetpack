<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The Jetpack Connection package Utils class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;

/**
 * Provides utility methods for the Connection package.
 */
class Utils {

	/**
	 * Some hosts disable the OpenSSL extension and so cannot make outgoing HTTPS requests.
	 * This method sets the URL scheme to HTTP when HTTPS requests can't be made.
	 *
	 * @param String $url The url.
	 * @return String The url with the required URL scheme.
	 */
	public static function fix_url_for_bad_hosts( $url ) {
		// If we receive an http url, return it.
		if ( 'http' === wp_parse_url( $url, PHP_URL_SCHEME ) ) {
			return $url;
		}

		// If the url should never be https, ensure it isn't https.
		if ( 'NEVER' === Constants::get_constant( 'JETPACK_CLIENT__HTTPS' ) ) {
			return set_url_scheme( $url, 'http' );
		}

		// Otherwise, return the https url.
		return $url;
	}
}
