<?php


require_once 'class.jetpack-sync-client.php';

if ( is_multisite() ) {
	require_once 'class.jetpack-sync-network-options.php';
}

class Jetpack_Sync {
	static $client = null;

	static function init() {

		self::$client = Jetpack_Sync_Client::getInstance();

		// bind the do_sync process to shutdown
		add_action( 'shutdown', array( self::$client, 'do_sync' ) );

		// bind the sending process
		add_filter( 'jetpack_sync_client_send_data', array( __CLASS__, 'send_data' ) );

		// On jetpack version bump
		add_action( 'updating_jetpack_version', array( __CLASS__, 'schedule_full_sync' ) );

		// On jetpack registration
		add_action( 'jetpack_site_registered', array( __CLASS__, 'schedule_full_sync' ) );
	}

	static function send_data( $data ) {
		Jetpack::load_xml_rpc_client();
		$rpc = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
		) );
		$result = $rpc->query( 'jetpack.syncActions', $data );
		error_log("got result: ");
		error_log(print_r($result, 1));
		return $result;
	}

	static function schedule_full_sync() {
		// Nothing to see here yet...	
	}

	// static function get_data_to_sync() {
	// 	$send['current_user_id'] = get_current_user_id(); 
	// 	$send['options']        = Jetpack_Sync_Options::get_to_sync();
	// 	$send['options_delete'] = Jetpack_Sync_Options::get_to_delete();
	// 	$send['constants']      = self::sync_if_has_changed( Jetpack_Sync_Constants::$check_sum_id, Jetpack_Sync_Constants::get_all() );

	// 	$send['actions'] = self::get_actions_to_sync();

	// 	$send['post_meta']        = Jetpack_Sync_Meta::meta_to_sync( 'post' );
	// 	$send['post_meta_delete'] = Jetpack_Sync_Meta::meta_to_delete( 'post' );

	// 	$send['comments']            = Jetpack_Sync_Comments::comments_to_sync();
	// 	$send['delete_comments']     = Jetpack_Sync_Comments::comments_to_delete();
	// 	$send['comment_meta']        = Jetpack_Sync_Meta::meta_to_sync( 'comment' );
	// 	$send['comment_meta_delete'] = Jetpack_Sync_Meta::meta_to_delete( 'comment' );

	// 	$send['updates'] = Jetpack_Sync_Updates::get_to_sync();
	// 	$send['themes']  = Jetpack_Sync_Themes::get_to_sync();

	// 	if ( false === ( $do_check = get_transient( 'jetpack_sync_functions' ) ) ) {
	// 		$send['functions'] = self::sync_if_has_changed( Jetpack_Sync_Functions::$check_sum_id, Jetpack_Sync_Functions::get_all() );
	// 		set_transient( 'jetpack_sync_functions', true, MINUTE_IN_SECONDS );
	// 	}
	// 	if ( is_multisite() ) {
	// 		$send['network_options']        = Jetpack_Sync_Network_Options::get_to_sync();
	// 		$send['network_options_delete'] = Jetpack_Sync_Network_Options::get_to_delete();
	// 	}

	// 	return array_filter( $send );
	// }


	// TODO: use these for full sync

	// static function get_all_data() {
	// 	$send['options']   = Jetpack_Sync_Options::get_all();
	// 	$send['constants'] = Jetpack_Sync_Constants::get_all();
	// 	$send['functions'] = Jetpack_Sync_Functions::get_all();
	// 	$send['updates']   = Jetpack_Sync_Updates::get_all();
	// 	$send['themes']    = Jetpack_Sync_Themes::get_all();
	// 	if ( is_multisite() ) {
	// 		$send['network_options'] = Jetpack_Sync_Network_Options::get_all();
	// 	}

	// 	return $send;
	// }
}

Jetpack_Sync::init();
