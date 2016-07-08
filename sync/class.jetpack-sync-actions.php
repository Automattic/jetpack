<?php

function jetpack_send_db_checksum() {
	$sync_sender = Jetpack_Sync_Sender::getInstance();
	$sync_sender->send_checksum();
}

class Jetpack_Sync_Actions {
	static $sender = null;
	static $listener = null;

	static function init() {
		/**
		 * Fires on every request before default loading sync listener code.
		 * Return false to not load sync listener code that monitors common
		 * WP actions to be serialized
		 *
		 * @since 4.2.0
		 *
		 * @param bool should we load sync listener code for this request
		 */
		if ( apply_filters( 'jetpack_sync_listener_should_load',
				(
					$_SERVER['REQUEST_METHOD'] !== 'GET'
				||
					defined( 'DOING_AJAX' ) && DOING_AJAX
				||
					defined( 'PHPUNIT_JETPACK_TESTSUITE' )
				||
				    is_admin()
				)
			) ) {
			require_once dirname( __FILE__ ) . '/class.jetpack-sync-listener.php';
			self::$listener = Jetpack_Sync_Listener::getInstance();
		}

		// Sync connected user role changes to .com
		require_once dirname( __FILE__ ) . '/class.jetpack-sync-users.php';

		/**
		 * Fires on every request before default loading sync sender code.
		 * Return false to not load sync sender code that serializes pending
		 * data and sends it to WPCOM for processing.
		 *
		 * @since 4.2.0
		 *
		 * @param bool should we load sync sender code for this request
		 */
		if ( ! apply_filters( 'jetpack_sync_sender_should_load',
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
			( Jetpack::is_active() || defined( 'PHPUNIT_JETPACK_TESTSUITE' ) )
		&&
			!( Jetpack::is_development_mode() || Jetpack::is_staging_site() )

		) ) {
			return;
		}

		require_once dirname( __FILE__ ) . '/class.jetpack-sync-sender.php';
		self::$sender = Jetpack_Sync_Sender::getInstance();

		// bind the do_sync process to shutdown
		add_action( 'shutdown', array( self::$sender, 'do_sync' ) );

		// bind the sending process
		add_filter( 'jetpack_sync_send_data', array( __CLASS__, 'send_data' ), 10, 3 );

		// On jetpack registration
		add_action( 'jetpack_site_registered', array( __CLASS__, 'schedule_full_sync' ) );

		// Schedule a job to send DB checksums once an hour
		if ( ! wp_next_scheduled ( 'jetpack_send_db_checksum' ) ) {
			wp_schedule_event( time(), 'hourly', 'jetpack_send_db_checksum' );
		}

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

	static function schedule_full_sync() {
		wp_schedule_single_event( time() + 1, 'jetpack_sync_full' );
	}

}
// Allow other plugins to add filters before we initalize the actions.
add_action( 'init', array( 'Jetpack_Sync_Actions', 'init' ), 11, 0 );
