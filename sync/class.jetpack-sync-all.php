<?php

require_once 'sync/class.jetpack-sync-posts.php';
require_once 'sync/class.jetpack-sync-comments.php';
require_once 'sync/class.jetpack-sync-options.php';
require_once 'sync/class.jetpack-sync-functions.php';
require_once 'sync/class.jetpack-sync-constants.php';
if ( is_multisite() ) {
	require_once 'sync/class.jetpack-sync-network-options.php';
}

class Jetpack_Sync_All {

	static $to_sync = array();

	static function init() {
		Jetpack_Sync_Posts::init();
		Jetpack_Sync_Comments::init();
		Jetpack_Sync_Options::init();
		Jetpack_Sync_Functions::init();
		add_action( 'shutdown', array( __CLASS__, 'on_shutdown' ) );
	}

	static function on_shutdown() {
		if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
			return;
		}
		Jetpack::xmlrpc_async_call( 'jetpack.syncContent', self::get_data_to_sync() );
	}

	static function get_data_to_sync() {
		$send['options']         = Jetpack_Sync_Options::get_to_sync();
		$send['options_delete']  = Jetpack_Sync_Options::get_to_delete();
		$send['constants']       = self::sync_if_has_changed( Jetpack_Sync_Constants::$check_sum_id, Jetpack_Sync_Constants::get_all() );
		$send['posts']           = Jetpack_Sync_Posts::posts_to_sync();
		$send['posts_delete']    = Jetpack_Sync_Posts::posts_to_delete();
		$send['comments']        = Jetpack_Sync_Comments::comments_to_sync();
		$send['delete_comments'] = Jetpack_Sync_Comments::comments_to_delete();
		if ( false === ( $do_check = get_transient( 'jetpack_sync_functions' ) ) ) {
			$send['functions'] = self::sync_if_has_changed( Jetpack_Sync_Functions::$check_sum_id, Jetpack_Sync_Functions::get_all() );
			set_transient( 'jetpack_sync_functions', true, MINUTE_IN_SECONDS );
		}
		if ( is_multisite() ) {
			$send['network_options']        = Jetpack_Sync_Network_Options::get_to_sync();
			$send['network_options_delete'] = Jetpack_Sync_Network_Options::get_to_delete();
		}
		return array_filter( $send );
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
