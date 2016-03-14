<?php

class Jetpack_Sync_Constants {

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
	
	static $check_sum_id = 'constant_check_sum';

	static function get( $constant ) {
		if ( defined( $constant ) ) {
			return constant( $constant );
		}
		return null;
	}
	
	static function get_all() {
		return array_combine( self::$constants, array_map( array( __CLASS__, 'get' ), self::$constants ) );
	}

}





