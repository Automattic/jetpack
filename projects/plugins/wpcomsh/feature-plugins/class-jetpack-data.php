<?php
/**
 * Jetpack_Data was deprecated in Jetpack 9.5.
 * Some plugins (like WooCommerce Shipping & Tax) still rely on one method from that class.
 * See https://github.com/Automattic/jetpack/issues/18977
 *
 * Until the problem is solved, this file brings back Jetpack_Data to Atomic sites.
 *
 * @package automattic/wpcomsh
 */

use Automattic\Jetpack\Connection\Tokens;

/**
 * Jetpack_Data class.
 */
class Jetpack_Data {
	/**
	 * Get a token based on query args.
	 *
	 * @deprecated Jetpack 7.5 Use Connection_Manager instead.
	 *
	 * @param int|false    $user_id         false: Return the Blog Token. int: Return that user's User Token.
	 * @param string|false $token_key       If provided, check that the token matches the provided input.
	 * @param bool|true    $suppress_errors If true, return a falsy value when the token isn't found;
	 *                                      When false, return a descriptive WP_Error when the token isn't found.
	 */
	public static function get_access_token( $user_id = false, $token_key = false, $suppress_errors = true ) {
		if ( class_exists( '\Automattic\Jetpack\Connection\Tokens' ) ) {
			return ( new Tokens() )->get_access_token( $user_id, $token_key, $suppress_errors );
		}

		return false;
	}
}
