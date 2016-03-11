<?php

class Jetpack_Constants_Sync {

	static $constants = array(
		'EMPTY_TRASH_DAYS',
		'WP_POST_REVISIONS',
		'AUTOMATIC_UPDATER_DISABLED',
		'ABSPATH',
		'WP_CONTENT_DIR',
		'FS_METHOD',
		'DISALLOW_FILE_EDIT',
		'DISALLOW_FILE_MODS',
		'WP_AUTO_UPDATE_CORE',
		'WP_HTTP_BLOCK_EXTERNAL',
		'WP_ACCESSIBLE_HOSTS',
	);

	static function sync() {
		$values           = self::values();
		$constantCheckSum = self::get_check_sum( $values );

		if ( Jetpack_Options::get_option( 'constant_check_sum' ) !== $constantCheckSum ) {
			Jetpack_Options::update_option( 'constant_check_sum', $constantCheckSum );

			return $values;
		}

		return null;
	}

	static function sync_all() {
		Jetpack_Options::update_option( 'constant_check_sum', self::get_check_sum() );
		return self::values();
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

	static function values() {
		$constants_values = array();
		foreach ( self::$constants as $constant ) {
			$value = self::get( $constant );
			if ( ! is_null( $value ) ) {
				$constants_values[ $constant ] = $value;
			}
		}

		return $constants_values;
	}

	static function get( $constant ) {
		if ( defined( $constant ) ) {
			return constant( $constant );
		}

		return null;
	}

}





