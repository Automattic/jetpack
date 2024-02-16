<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Modules\Page_Cache\Pre_WordPress\Boost_Cache_Settings;

class Page_Cache_Entry implements Entry_Can_Get, Entry_Can_Set {
	public function get( $_fallback = false ) {
		$cache_settings = Boost_Cache_Settings::get_instance();

		$settings = array(
			'exceptions' => $cache_settings->get_exceptions(),
			'logging'    => $cache_settings->get_logging(),
		);

		return $settings;
	}

	public function set( $value ) {
		$cache_settings = Boost_Cache_Settings::get_instance();

		$value['exceptions'] = $this->sanitize_value( $value['exceptions'] );

		$cache_settings->set( $value );
	}

	/**
	 * Sanitizes the given value, ensuring that it is a comma-separated list of unique, trimmed strings.
	 *
	 * @param mixed $value The value to sanitize.
	 *
	 * @return string The sanitized value, as a comma-separated list of unique, trimmed strings.
	 */
	private function sanitize_value( $value ) {
		if ( is_array( $value ) ) {
			$value = array_values( array_unique( array_filter( array_map( 'trim', $value ) ) ) );
		} else {
			$value = array();
		}

		return $value;
	}
}
