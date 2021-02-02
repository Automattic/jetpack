<?php
/**
 * Mocking tools.
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper\Mocker;

/**
 * Mocking Tools.
 */
class Tools {

	const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

	/**
	 * Generate a random string.
	 *
	 * @param int      $length Fixed string length, or minimum string length if maximum is provided.
	 * @param int|null $length_max Maximum string length, optional.
	 *
	 * @return string
	 */
	public static function get_random_string( $length = 15, $length_max = null ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.rand_rand
		$length = $length_max ? rand( $length, $length_max ) : $length;

		$char_length = strlen( self::CHARS );

		for ( $string = '', $i = 0; $i < $length; $i++ ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.rand_rand
			$string .= self::CHARS[ rand( 0, $char_length - 1 ) ];
		}

		return $string;
	}

}
