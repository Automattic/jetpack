<?php

class Jetpack_Sync_Functions {

	static $functions = array(
		'wp_version' => array( 'Jetpack', 'get_wp_version' ),
		'wp_max_upload_size' => 'wp_max_upload_size',
		'network_name' => array( 'Jetpack', 'network_name' ),
	);

	static $sync = array();

	static function sync() {
		return self::values( self::get_function_to_sync() );
	}

	static function sync_sometimes() {
		// Since there are option in the sync we know that things have changed.
		if ( ! empty ( self::$sync ) ) {
			return self::sync_all();
		}

		$values           = self::values( self::$functions );
		$check_sum        = self::get_check_sum( $values );

		if ( Jetpack_Options::get_option( 'options_check_sum' ) !== $check_sum ) {
			return self::sync_all( $values, $check_sum );
		}
		return array();
	}

	static function sync_all( $values = null, $check_sum = null ) {
		if ( is_null( $values ) ) {
			$values           = self::values( self::$functions );
		}
		if( is_null( $check_sum ) ) {
			$check_sum = self::get_check_sum( $values );
		}
		Jetpack_Options::update_option( 'function_check_sum', $check_sum );
		return $values;
	}

	static function get_check_sum( $values = null ) {
		if( is_null( $values ) ){
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
			foreach ( $sync as $key => $function ) {
				$values[ $key ] = self::get( $function );
			}
		}
		return $values;
	}

	static function get_function_to_sync() {
		return array_unique( self::$sync );
	}

	static function get( $function ) {
		return call_user_func( $function );
	}

}





