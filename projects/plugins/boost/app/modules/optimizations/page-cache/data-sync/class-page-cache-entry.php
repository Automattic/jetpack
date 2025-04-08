<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Settings;

class Page_Cache_Entry implements Entry_Can_Get, Entry_Can_Set {
	public function get( $_fallback = false ) {
		$cache_settings = Boost_Cache_Settings::get_instance();

		$settings = array(
			'bypass_patterns' => $cache_settings->get_bypass_patterns(),
			'logging'         => $cache_settings->get_logging(),
		);

		return $settings;
	}

	public function set( $value ) {
		$cache_settings = Boost_Cache_Settings::get_instance();

		$value['bypass_patterns'] = $this->sanitize_value( $value['bypass_patterns'] );

		$cache_settings->set( $value );
	}

	/**
	 * Sanitizes the given value, ensuring that it is list of valid patterns.
	 *
	 * @param mixed $value The value to sanitize.
	 *
	 * @return array The sanitized value.
	 */
	private function sanitize_value( $value ) {
		if ( is_array( $value ) ) {
			$value = array_values( array_unique( array_filter( array_map( 'trim', array_map( 'strtolower', $value ) ) ) ) );

			$home_url = home_url( '/' );

			foreach ( $value as &$path ) {
				// Strip home URL (both secure and non-secure).
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

				// Remove double shashes.
				$path = str_replace( '//', '/', $path );

				// Remove symbols, as they are included in the regex check.
				$path = ltrim( $path, '^' );
				$path = rtrim( $path, '$' );
				$path = preg_replace( '/\/\?$/', '', $path );

				// Make sure there's a leading slash.
				$path = '/' . ltrim( $path, '/' );

				// Fix up any wildcards.
				$path = $this->sanitize_wildcards( $path );
			}

			$value = array_values( array_unique( array_filter( $value ) ) );
		} else {
			$value = array();
		}

		return $value;
	}

	/**
	 * Sanitize wildcards in a given path.
	 *
	 * @param string $path The path to sanitize.
	 * @return string The sanitized path.
	 */
	private function sanitize_wildcards( $path ) {
		if ( ! $path ) {
			return '';
		}

		$path_components = explode( '/', $path );
		$arr             = array(
			'.*'   => '(.*)',
			'*'    => '(.*)',
			'(*)'  => '(.*)',
			'(.*)' => '(.*)',
		);

		foreach ( $path_components as &$path_component ) {
			$path_component = strtr( $path_component, $arr );
		}
		$path = implode( '/', $path_components );

		return $path;
	}
}
