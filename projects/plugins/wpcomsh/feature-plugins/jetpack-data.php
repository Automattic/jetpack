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

if ( ! class_exists( 'Jetpack_Data' ) ) {
	class Jetpack_Data {
		/**
		 * @deprecated Jetpack 7.5 Use Connection_Manager instead.
		 */
		public static function get_access_token( $user_id = false, $token_key = false, $suppress_errors = true ) {
			if ( class_exists( '\Automattic\Jetpack\Connection\Tokens' ) ) {
				$token = ( new Tokens() )->get_access_token( $user_id, $token_key, $suppress_errors );
				return $token;
			}

			return false;
		}
	}
}

