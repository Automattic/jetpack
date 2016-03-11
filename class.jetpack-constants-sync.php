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
		$values           = self::constant_values();
		$constantCheckSum = self::getCheckSum( $values );

		if ( Jetpack_Options::get_option( 'constant_check_sum' ) !== $constantCheckSum ) {
			Jetpack_Options::update_option( 'constant_check_sum', $constantCheckSum );

			return $values;
		}

		return null;
	}

	static function sync_all() {
		return self::constant_values();
	}

	static function getCheckSum( $values ) {
		return crc32( self::getQueryString( $values ) );
	}

	static function getQueryString( $values ) {
		return build_query( $values );
	}

	static function constant_values() {
		$constants_values = array();
		foreach ( self::$constants as $constant ) {
			$value = self::getConstant( $constant );
			if ( ! is_null( $value ) ) {
				$constants_values[ $constant ] = $value;
			}
		}

		return $constants_values;
	}

	static function getConstant( $constant ) {
		if ( defined( $constant ) ) {
			return constant( $constant );
		}

		return null;
	}

}





