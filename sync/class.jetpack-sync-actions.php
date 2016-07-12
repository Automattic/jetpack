<?php

/**
 * The role of this class is to hook the Sync subsystem into WordPress - when to listen for actions,
 * when to send, when to perform a full sync, etc.
 *
 * It also binds the action to send data to WPCOM to Jetpack's XMLRPC client object.
 */
class Jetpack_Sync_Actions {
	static $sender = null;
	static $listener = null;

	static function init() {
		
		// On jetpack authorization, schedule a full sync
		add_action( 'jetpack_client_authorized', array( __CLASS__, 'schedule_full_sync' ) );

		// Sync connected user role changes to .com
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-users.php';

		// everything below this point should only happen if we're a valid sync site
		if ( ! self::sync_allowed() ) {
			return;
		}

		// cron hooks
		add_action( 'jetpack_sync_send_db_checksum', array( __CLASS__, 'send_db_checksum' ) );
		add_action( 'jetpack_sync_full', array( __CLASS__, 'do_full_sync' ), 10, 1 );
		add_action( 'jetpack_sync_send_pending_data', array( __CLASS__, 'do_send_pending_data' ) );

		if ( ! wp_next_scheduled ( 'jetpack_sync_send_db_checksum' ) ) {
			// Schedule a job to send DB checksums once an hour
			wp_schedule_event( time(), 'hourly', 'jetpack_sync_send_db_checksum' );
		}

		/**
		 * Fires on every request before default loading sync listener code.
		 * Return false to not load sync listener code that monitors common
		 * WP actions to be serialized.
		 * 
		 * By default this returns true for non-GET-requests, or requests where the 
		 * user is logged-in.
		 *
		 * @since 4.2.0
		 *
		 * @param bool should we load sync listener code for this request
		 */
		if ( apply_filters( 'jetpack_sync_listener_should_load',
				(
					$_SERVER['REQUEST_METHOD'] !== 'GET'
				||
					is_user_logged_in()
				||
					defined( 'PHPUNIT_JETPACK_TESTSUITE' )
				)
			) ) {
			self::initialize_listener();
		}

		/**
		 * Fires on every request before default loading sync sender code.
		 * Return false to not load sync sender code that serializes pending
		 * data and sends it to WPCOM for processing.
		 *
		 * By default this returns true for POST requests, admin requests, or requests
		 * by users who can manage_options.
		 *
		 * @since 4.2.0
		 *
		 * @param bool should we load sync sender code for this request
		 */
		if ( apply_filters( 'jetpack_sync_sender_should_load',
			(
				$_SERVER['REQUEST_METHOD'] === 'POST'
			||
				current_user_can( 'manage_options' )
			||
				is_admin()
			||
				defined( 'PHPUNIT_JETPACK_TESTSUITE' )
			)
			) ) {
			self::initialize_sender();
			add_action( 'shutdown', array( self::$sender, 'do_sync' ) );
		}

	}

	static function sync_allowed() {
		return ( Jetpack::is_active() && !( Jetpack::is_development_mode() || Jetpack::is_staging_site() ) )
			|| defined( 'PHPUNIT_JETPACK_TESTSUITE' );
	}

	static function send_data( $data, $codec_name, $sent_timestamp ) {
		Jetpack::load_xml_rpc_client();

		$url = add_query_arg( array(
			'sync' => '1', // add an extra parameter to the URL so we can tell it's a sync action
			'codec' => $codec_name, // send the name of the codec used to encode the data
			'timestamp' => $sent_timestamp, // send current server time so we can compensate for clock differences
		), Jetpack::xmlrpc_api_url() );

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

	static function schedule_full_sync( $modules = null ) {
		wp_schedule_single_event( time() + 1, 'jetpack_sync_full', array( $modules ) );
	}

	static function do_full_sync( $modules = null ) {
		if ( ! self::sync_allowed() ) {
			return;
		}

		self::initialize_listener();
		Jetpack_Sync_Modules::get_module( 'full-sync' )->start( $modules );
		self::do_send_pending_data(); // try to send at least some of the data
	}

	static function do_send_pending_data() {
		self::initialize_sender();
		self::$sender->do_sync();
	}

	static function send_db_checksum() {
		self::initialize_listener();
		self::initialize_sender();
		self::$sender->send_checksum();
		self::$sender->do_sync();
	}

	static function initialize_listener() {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-listener.php';
		self::$listener = Jetpack_Sync_Listener::getInstance();
	}

	static function initialize_sender() {
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-sender.php';
		self::$sender = Jetpack_Sync_Sender::getInstance();
		
		// bind the sending process
		add_filter( 'jetpack_sync_send_data', array( __CLASS__, 'send_data' ), 10, 3 );
	}
}

// Allow other plugins to add filters before we initalize the actions.
add_action( 'init', array( 'Jetpack_Sync_Actions', 'init' ), 11, 0 );
