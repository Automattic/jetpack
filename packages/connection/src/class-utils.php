<?php
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
	 * @param string $url The url.
	 * @return string The url with the required URL scheme.
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

	/**
	 * Enters a user token into the user_tokens option
	 *
	 * @param int    $user_id The user id.
	 * @param string $token The user token.
	 * @param bool   $is_master_user Whether the user is the master user.
	 * @return bool
	 */
	public static function update_user_token( $user_id, $token, $is_master_user ) {
		// Not designed for concurrent updates.
		$user_tokens = \Jetpack_Options::get_option( 'user_tokens' );
		if ( ! is_array( $user_tokens ) ) {
			$user_tokens = array();
		}
		$user_tokens[ $user_id ] = $token;
		if ( $is_master_user ) {
			$master_user = $user_id;
			$options     = compact( 'user_tokens', 'master_user' );
		} else {
			$options = compact( 'user_tokens' );
		}
		return \Jetpack_Options::update_options( $options );
	}
}
