<?php

class Jetpack_Sync_Actions {
	static $client = null;

	static function init() {
		/**
		 * Fires on every request before default loading sync code.
		 * Return false to not load sync code and hook sync actions.
		 *
		 * @since 4.2.0
		 *
		 * @param bool should we load sync code for this request
		 */
		if ( ! apply_filters( 'jetpack_sync_should_load', 
			(
				$_SERVER['REQUEST_METHOD'] === 'POST' 
			|| 
				current_user_can( 'manage_options' ) 
			|| 
				is_admin() 
			||
				defined( 'PHPUNIT_JETPACK_TESTSUITE' )
			)
		&&
			!( Jetpack::is_development_mode() || Jetpack::is_staging_site() )
		
		) ) {
			return;
		}
		
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-client.php';

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

		// add an extra parameter to the URL so we can tell it's a sync action
		$url = add_query_arg( 'sync', '1', Jetpack::xmlrpc_api_url() );

		$rpc = new Jetpack_IXR_Client( array(
			'url'     => $url,
			'user_id' => JETPACK_MASTER_USER,
			'timeout' => 30
		) );

		$result = $rpc->query( 'jetpack.syncActions', $data );

		if ( ! $result ) {
			return $rpc->get_jetpack_error();
		}

		return $rpc->getResponse();
	}

	static function schedule_full_sync() {
		wp_schedule_single_event( time() + 1, 'jetpack_sync_full' );
	}

}
// Allow other plugins to add filters before we initalize the actions.
add_action( 'init', array( 'Jetpack_Sync_Actions', 'init' ), 11, 0 );
