<?php

require_once 'sync/class.jetpack-sync-utils.php';
require_once 'sync/class.jetpack-sync-posts.php';
require_once 'sync/class.jetpack-sync-comments.php';
require_once 'sync/class.jetpack-sync-options.php';
require_once 'sync/class.jetpack-sync-functions.php';
require_once 'sync/class.jetpack-sync-constants.php';

class Jetpack_Sync_All {

	static $to_sync = array();

	static $everything = array( 'options', 'constants', 'functions', 'posts', 'comments' );

	static function init() {
		Jetpack_Sync_Posts::init();
		Jetpack_Sync_Comments::init();
		Jetpack_Sync_Options::init();
		Jetpack_Sync_Functions::init();
	}

	static function all() {

		return array();
	}

	static function trigger( $part ) {

		if ( empty( self::$to_sync ) ) {
			add_action( 'shutdown', array( __CLASS__, 'on_shutdown' ) );
		}

		self::$to_sync[ $part ] = true;
	}

	static function on_shutdown() {
		$send = array();
		foreach( array_keys( self::$to_sync ) as $key ) {
			switch( $key ) {
				case 'options':
					$send[ $key ] = Jetpack_Sync_Options::get_to_sync();
					break;

				case 'options_delete':
					$send[ $key ] = Jetpack_Sync_Options::get_to_delete();
					break;

				case 'constants':
					$send[ $key ] = Jetpack_Sync_Constants::get_all();
					break;

				case 'functions':
					$send[ $key ] = Jetpack_Sync_Functions::get_all();
					break;

				case 'posts':
					$send[ $key ] = Jetpack_Sync_Posts::posts_to_sync();
					break;

				case 'posts_delete':
					$send[ $key ] = Jetpack_Sync_Posts::posts_to_delete();
					break;

				case 'comments':
					$send[ $key ] = Jetpack_Sync_Comments::comments_to_sync();
					break;

				case 'delete_comments':
					$send[ $key ] = Jetpack_Sync_Comments::get_comment_ids_to_delete();
					break;
			}
		}

	}

	static function on_heartbeat() {
		// still needs to be implemented
	}

	static function force_sync() {
		// when the user forces the sync to happen

	}

	static function on_upgrade() {
		// when the user gets a new version of Jetpack

	}

	static function on_connect() {
		// when the user connects jetpack ( )
		// maybe trigger force_sync
	}

}

Jetpack_Sync_All::init();