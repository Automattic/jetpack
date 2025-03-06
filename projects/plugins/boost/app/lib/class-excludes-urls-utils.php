<?php

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Utility class to handle excludes URLs sanitization and validation
 * for various modules like Speculation Rules and Page Cache
 *
 * @since $$next-version$$
 */
class Excludes_URLs_Utils {
	/**
	 * Sanitizes the given value, ensuring that it is list of valid patterns.
	 *
	 * @param mixed $value The value to sanitize.
	 *
	 * @return array The sanitized value.
	 */
	public static function sanitize_value( $value, $checks = array( 'wildcards' => 'regex' ) ) {
		if ( ! is_array( $value ) ) {
			return array();
		}

		// Remove duplicates, empty values, trim whitespace, and convert to lowercase
		$value = array_values( array_unique( array_filter( array_map( 'trim', array_map( 'strtolower', $value ) ) ) ) );

		$home_url = home_url( '/' );

		foreach ( $value as &$path ) {
			// Strip home URL (both secure and non-secure)
			$path = str_ireplace(
				array(
					$home_url,
					str_replace( 'http:', 'https:', $home_url ),
				),
				array(
					'/',
					'/',
				),
				$path
			);

			// Remove double slashes
			$path = str_replace( '//', '/', $path );

			// Remove symbols, as they are included in the regex check
			$path = ltrim( $path, '^' );
			$path = rtrim( $path, '$' );
			$path = preg_replace( '/\/\?$/', '', $path );

			// Make sure there's a leading slash
			$path = '/' . ltrim( $path, '/' );

			if ( isset( $checks['wildcards'] ) ) {
				// Fix up any wildcards
				$path = self::sanitize_wildcards( $path, $checks['wildcards'] );
			}
		}

		return array_values( array_unique( array_filter( $value ) ) );
	}

	/**
	 * Sanitize wildcards in a given path.
	 *
	 * @param string $path The path to sanitize.
	 * @return string The sanitized path.
	 */
	private static function sanitize_wildcards( $path, $wildcards_type ) {
		if ( ! $path ) {
			return '';
		}

		$path_components = explode( '/', $path );

		if ( $wildcards_type === 'regex' ) {
			$arr = array(
				'.*'   => '(.*)',
				'*'    => '(.*)',
				'(*)'  => '(.*)',
				'(.*)' => '(.*)',
			);
		} else {
			$arr = array(
				'.*'   => '*',
				'*'    => '*',
				'(*)'  => '*',
				'(.*)' => '*',
			);
		}
		foreach ( $path_components as &$path_component ) {
			$path_component = strtr( $path_component, $arr );
		}
		$path = implode( '/', $path_components );

		return $path;
	}
}
