<?php
/**
 * Implement nonce helper methods.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Nonce
 */
class Nonce {
	/**
	 * This is a light clone of wp_create_nonce and wp_verify_nonce which skips the UID and cookie token parts,
	 * so it can be used in anonymous HTTP callbacks. It is therefore not as secure, so be careful.
	 *
	 * @param string $action The action.
	 */
	public static function create( $action ) {
		return substr( wp_hash( wp_nonce_tick() . '|' . $action, 'nonce' ), -12, 10 );
	}

	/**
	 * Verify the nonce.
	 *
	 * @param string $nonce  The nonce.
	 * @param string $action The action.
	 */
	public static function verify( $nonce, $action ) {
		$i = wp_nonce_tick();

		// Current nonce.
		$expected = substr( wp_hash( $i . '|' . $action, 'nonce' ), -12, 10 );
		if ( hash_equals( $expected, $nonce ) ) {
			return 1;
		}

		// Nonce generated 12-24 hours ago.
		$expected = substr( wp_hash( ( $i - 1 ) . '|' . $action, 'nonce' ), -12, 10 );
		if ( hash_equals( $expected, $nonce ) ) {
			return 2;
		}

		return false;
	}
}
