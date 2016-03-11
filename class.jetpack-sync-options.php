<?php


class Jetpack_Sync_Options {

	static $options = array(
		'blogname',
	);

	static $sync = array();
	static $delete = array();

	static function init() {
		foreach ( self::$options as $option ) {
			self::register( $option );
		}
	}

	static function register( $option ) {
		add_action( "add_option_{$option}",    array( __CLASS__, 'add_option'   ) );
		add_action( "update_option_{$option}", array( __CLASS__, 'update_option' ) );
		add_action( "delete_option_{$option}", array( __CLASS__, 'delete_option' ) );
	}

	static function add_option( $option ) {
		self::$sync[] = $option;
	}

	static function update_option() {
		$option = current_filter();
		$prefix = 'update_option_';
		if ( 0 !== strpos( $option, $prefix ) ) {
			return;
		}
		$option = substr( $option, strlen( $prefix ) );
		self::$sync[] = $option;
	}

	static function delete_option( $option ) {
		self::$delete[] = $option;
	}

	static function sync() {
		return self::values( self::get_options_to_sync() );
	}

	static function sync_sometimes() {

		// Since there are option in the sync we know that things have changed.
		if( ! empty ( self::$sync ) ) {
			return self::sync_all();
		}

		$values           = self::values( self::$options );
		$check_sum        = self::get_check_sum( $values );

		if ( Jetpack_Options::get_option( 'options_check_sum' ) !== $check_sum ) {
			return self::sync_all( $values, $check_sum );
		}
		return null;
	}

	static function sync_all( $values = null, $check_sum = null ) {
		if ( is_null( $values ) ) {
			$values           = self::values( self::$options );
		}
		if( is_null( $check_sum ) ) {
			$check_sum = self::get_check_sum( $values );
		}
		Jetpack_Options::update_option( 'options_check_sum', $check_sum );
		return $values;
	}

	static function options_to_sync() {
		return array_unique( self::$sync );
	}

	static function get_check_sum( $values ) {
		return crc32( self::get_query_string( $values ) );
	}

	static function get_query_string( $values ) {
		return build_query( $values );
	}

	static function values( $sync = array() ) {
		$values = array();
		if ( ! empty( $sync ) ) {
			foreach ( $sync as $key ) {
				$values[ $key ] = self::get( $key );
			}
		}
		return $values;
	}

	static function get_options_to_sync() {
		return array_unique( self::$sync );
	}

	static function sync_delete() {
		return array_unique( self::$delete );
	}

	static function get( $constant ) {
		return get_option( $constant );
	}
}
