<?php

require_once 'sync/class.jetpack-sync-posts.php';
require_once 'sync/class.jetpack-sync-comments.php';
require_once 'sync/class.jetpack-sync-options.php';
require_once 'sync/class.jetpack-sync-functions.php';
require_once 'sync/class.jetpack-sync-constants.php';
if( is_multisite() ) {
	require_once 'sync/class.jetpack-sync-network-options.php';
}

class Jetpack_Sync_All {

	static $to_sync = array();

	static $everything = array( 'options', 'constants', 'functions', 'posts', 'comments' );

	static function init() {
		Jetpack_Sync_Posts::init();
		Jetpack_Sync_Comments::init();
		Jetpack_Sync_Options::init();
		Jetpack_Sync_Functions::init();
		add_action( 'shutdown', array( __CLASS__, 'on_shutdown' ) );
	}

	static function on_shutdown() {
		$send = array();
		if ( is_multisite() ) {
			self::$everything[] = 'network_options';
			self::$everything[] = 'network_options_delete';
		}
		foreach( array_keys( self::$everything ) as $key ) {
			switch( $key ) {
				case 'options':
					$send[ $key ] = Jetpack_Sync_Options::get_to_sync();
					break;

				case 'options_delete':
					$send[ $key ] = Jetpack_Sync_Options::get_to_delete();
					break;

				case 'network_options':
					$send[ $key ] = Jetpack_Sync_Network_Options::get_to_sync();
					break;

				case 'network_options_delete':
					$send[ $key ] = Jetpack_Sync_Network_Options::get_to_delete();
					break;

				case 'constants':
					$send[ $key ] = self::sync_if_has_changed( Jetpack_Sync_Constants::$check_sum_id, Jetpack_Sync_Constants::get_all() );
					break;

				case 'functions':
					if ( false === ( $do_check = get_transient( 'jetpack_sync_functions' ) ) ) {
						$send[ $key ] = self::sync_if_has_changed( Jetpack_Sync_Functions::$check_sum_id, Jetpack_Sync_Functions::get_all() );
						set_transient( 'jetpack_sync_functions', true, MINUTE_IN_SECONDS );
					}
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
					$send[ $key ] = Jetpack_Sync_Comments::comments_to_delete();
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

	static function sync_if_has_changed( $check_sum_id, $values ) {
		$current_check_sum = self::get_check_sum( $values );
		if ( Jetpack_Options::get_option( $check_sum_id ) !== $current_check_sum ) {
			Jetpack_Options::update_option( $check_sum_id, $current_check_sum );
			return $values;
		}
		return null;
	}

	static function get_check_sum( $values ) {
		return crc32( build_query( $values ) );
	}
}

Jetpack_Sync_All::init();
