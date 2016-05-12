<?php

require_once 'class.jetpack-sync-client.php';

class Jetpack_Sync_Actions {
	static $client = null;

	static function init() {

		self::$client = Jetpack_Sync_Client::getInstance();

		// bind the do_sync process to shutdown
		add_action( 'shutdown', array( self::$client, 'do_sync' ) );

		// bind the sending process
		add_filter( 'jetpack_sync_client_send_data', array( __CLASS__, 'send_data' ) );

		// On jetpack registration
		add_action( 'jetpack_site_registered', array( __CLASS__, 'schedule_full_sync' ) );
	}

	static function send_data( $data ) {
		Jetpack::load_xml_rpc_client();
		$rpc    = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
			'timeout' => 30
		) );
		$result = $rpc->query( 'jetpack.syncActions', $data );
		if ( ! $result ) {
			return $rpc->get_jetpack_error();
		}

		return $result;
	}

	static function schedule_full_sync() {
		wp_schedule_single_event( strftime( '+1 second' ), 'jetpack_sync_full' );
	}

}

Jetpack_Sync_Actions::init();
