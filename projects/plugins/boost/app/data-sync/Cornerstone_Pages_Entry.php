<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Lib\Environment_Change_Detector;

class Cornerstone_Pages_Entry implements Entry_Can_Get, Entry_Can_Set {

	private $option_key;

	public function __construct( $option_key ) {
		$this->option_key = 'jetpack_boost_ds_' . $option_key;
	}

	public function get( $fallback_value = array() ) {
		$urls = get_option( $this->option_key, array() );

		if ( empty( $urls ) && ! empty( $fallback_value ) ) {
			$urls = $fallback_value;
			$this->set( $urls );
		}

		/**
		 * Filters the list of cornerstone pages.
		 *
		 * @since 3.7.0
		 *
		 * @param array $urls An array of absolute URLs.
		 */
		return apply_filters( 'jetpack_boost_cornerstone_pages_list', array_map( array( $this, 'transform_to_absolute' ), $urls ) );
	}

	public function set( $value ) {
		$value = $this->sanitize_value( $value );

		$updated = update_option( $this->option_key, $value );
		if ( $updated ) {
			( new Environment_Change_Detector() )->handle_cornerstone_pages_list_update();
		}
	}

	private function sanitize_value( $value ) {
		if ( is_array( $value ) ) {
			$value = array_values( array_unique( array_map( 'untrailingslashit', array_map( array( $this, 'transform_to_relative' ), $value ) ) ) );
		} else {
			$value = array();
		}

		return $value;
	}

	private function transform_to_relative( $url ) {
		$url = trim( $url );

		// Remove the home_url from the beginning of the URL if it exists.
		if ( strpos( $url, home_url() ) === 0 ) {
			$url = substr( $url, strlen( home_url() ) );
		}

		// Ensure the URL starts with a slash.
		if ( $url !== '' ) {
			$url = ltrim( $url, '/' );
			$url = '/' . $url;
		}

		return $url;
	}

	private function transform_to_absolute( $url ) {
		return home_url( $url );
	}
}
