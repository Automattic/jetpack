<?php

class Jetpack_Sync_Functions {

	static $functions = array(
		'wp_version'              => array( 'Jetpack', 'get_wp_version' ),
		'wp_max_upload_size'      => 'wp_max_upload_size',
		'featured_images_enabled' => array( 'Jetpack', 'featured_images_enabled' ),
	);

	static $multi_site_functions = array(
		'network_name'                        => array( 'Jetpack', 'network_name' ),
		'network_allow_new_registrations'     => array( 'Jetpack', 'network_allow_new_registrations' ),
		'network_add_new_users'               => array( 'Jetpack', 'network_add_new_users' ),
		'network_site_upload_space'           => array( 'Jetpack', 'network_site_upload_space' ),
		'network_upload_file_types'           => array( 'Jetpack', 'network_upload_file_types' ),
		'network_enable_administration_menus' => array( 'Jetpack', 'network_enable_administration_menus' ),
	);

	static $sync = array();

	static function init() {
		if ( is_multisite() ) {
			self::$functions = array_merge( self::$functions, self::$multi_site_functions );
		}
	}

	static function sync() {
		return self::values( self::get_function_to_sync() );
	}

	static function register( $key, $function ) {
		self::$functions[ $key ] = $function;
	}

	static function trigger_sync( $key ) {
		self::$sync[] = $key;
	}

	static function sync_sometimes() {
		// Since there are option in the sync we know that things have changed.
		if ( ! empty ( self::$sync ) ) {
			return self::sync_all();
		}

		$values    = self::values( self::$functions );
		$check_sum = self::get_check_sum( $values );

		if ( Jetpack_Options::get_option( 'function_check_sum' ) !== $check_sum ) {
			return self::sync_all( $values, $check_sum );
		}

		return array();
	}

	static function sync_all( $values = null, $check_sum = null ) {
		if ( is_null( $values ) ) {
			$values = self::values( array_keys( self::$functions ) );
		}
		if ( is_null( $check_sum ) ) {
			$check_sum = self::get_check_sum( $values );
		}
		Jetpack_Options::update_option( 'function_check_sum', $check_sum );

		return $values;
	}

	static function get_check_sum( $values = null ) {
		if ( is_null( $values ) ) {
			$values = self::values();
		}

		return crc32( self::get_query_string( $values ) );
	}

	static function get_query_string( $values ) {
		return build_query( $values );
	}

	static function values( $sync = array() ) {
		$values = array();
		if ( ! empty( $sync ) ) {
			foreach ( $sync as $key ) {
				$value = self::get( $key );
				if ( ! is_null( $value ) ) {
					$values[ $key ] = $value;
				}

			}
		}

		return $values;
	}

	static function get_function_to_sync() {
		return array_unique( self::$sync );
	}

	static function get( $key ) {
		if ( is_callable( self::$functions[ $key ] ) ) {
			return call_user_func( self::$functions[ $key ] );
		}

		return null;
	}

}





