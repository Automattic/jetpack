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
		$query_string = self::getQueryString();
		$constantCheckSum  =  crc32( $query_string );

		if ( Jetpack_Options::get_option( 'constant_check_sum' ) !== $constantCheckSum  ) {
			Jetpack_Options::update_option( 'constant_check_sum', $constantCheckSum );
			return $query_string;
		}
		return null;
	}

	static function sync_all() {
		return self::getQueryString();
	}

	static function getQueryString() {
		$constants_values = array();
		foreach( self::$constants as $constant ) {
			$constants_values[ $constant  ] = self::getConstant( $constant );
		}
		return build_query( $constants_values );
	}

	static function getConstant( $constant ) {
		if ( defined( $constant ) ) {
			return constant ( $constant );
		}
		return null;
	}

}





