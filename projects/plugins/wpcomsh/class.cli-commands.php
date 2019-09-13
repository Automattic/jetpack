<?php

if ( ! class_exists( 'WP_CLI' ) ) {
	return;
}

/**
 *  Force WordPress to always output English at the command line.
 */
WP_CLI::add_wp_hook( 'pre_option_WPLANG', function() {
    return 'de_DE';
});

/**
 * Public methods of this class which are not marked as "Not a WP CLI command"
 * are WP CLI commands which can be used to perform actions on an AT site.
 *
 * The namespace is `wpcomsh` so if you were to call a command, you would write:
 *
 * wp wpcomsh do_jetpack_sync
 *
 *
 * Class WPCOMSH_CLI_Commands
 */
class WPCOMSH_CLI_Commands extends WP_CLI_Command {
	const JETPACK_SYNC_RETRIES = 10;
	const JETPACK_SYNC_RETRY_WAIT_TIME = 2; // in seconds

	/**
	 * Turns Jetpack Sync on (disabled by default), maxes out the sync speed/connection
	 * and then kicks off a full sync, retrying it each second, until the full sync is finished.
	 *
	 * This is used on a freshly transferred site which was not yet synced to WPCom.
	 */
	function do_jetpack_sync() {
		global $wp_rewrite;

		$wp_rewrite = new wp_rewrite;

		require_once WP_PLUGIN_DIR . '/jetpack/sync/class.jetpack-sync-actions.php';
		require_once WP_PLUGIN_DIR . '/jetpack/sync/class.jetpack-sync-settings.php';
		require_once WP_PLUGIN_DIR . '/jetpack/sync/class.jetpack-sync-modules.php';

		// first, max out everything and enable Jetpack sync
		Jetpack_Sync_Settings::update_settings(
			array(
				'max_enqueue_full_sync' => 5000,
				'max_queue_size_full_sync' => 10000,
				'cron_sync_time_limit' => 600,
				'upload_max_rows' => 1000,
				'dequeue_max_bytes' => 6000000,
				'sync_wait_threshold' => 300,
				'sync_wait_time' => 0,
				'enqueue_wait_time' => 0,
				'upload_max_bytes' => 7000000,

				// This is important as Jetpack sync is disabled by default.
				'disable' => false
			)
		);

		// now kick off a full sync for everything
		Jetpack_Sync_Actions::initialize_listener();
		Jetpack_Sync_Modules::get_module( 'full-sync' )->start();
		Jetpack_Sync_Actions::initialize_sender();

		// Remove the original `send_data` function so we can replace it with a modified one.
		remove_filter( 'jetpack_sync_send_data', array( 'Jetpack_Sync_Actions', 'send_data', 10, 4 ) );

		// Replace the original `send_data` function with a modified one.
		add_filter(
			'jetpack_sync_send_data',
			array( 'WPCOMSH_CLI_Commands', 'set_bigger_timeout_for_sync' ),
			10,
			4
		);

		$retries = 0;
		$total_sync_time = time();

		do {
			$result = Jetpack_Sync_Actions::$sender->do_full_sync();

			if ( ! $result || is_wp_error( $result ) ) {
				WP_CLI::warning( 'Jetpack Sync attempt failed: ' . print_r( $result, true ) );

				$retries++;

				// Pause before trying another sync so we don't overload the CPU.
				sleep( self::JETPACK_SYNC_RETRY_WAIT_TIME );
			}
		} while ( ! $result && $retries < self::JETPACK_SYNC_RETRIES );

		$total_sync_time = time() - $total_sync_time;

		if ( ! $result || is_wp_error( $result ) ) {
			$message = 'Jetpack Sync failed to complete in ' . self::JETPACK_SYNC_RETRIES .
			' retries and ' . $total_sync_time . ' seconds: ' . print_r( $result, true );
			WPCOMSH_Log::unsafe_direct_log( $message );
			WP_CLI::error( $message );
		}

		// now restore the original settings
		Jetpack_Sync_Settings::reset_data();

		WP_CLI::success( "Jetpack Sync succeeded in {$retries} retries" .
			" and {$total_sync_time} seconds." );
	}

	// Not a WP CLI command
	//
	// Similar to Jetpack_Sync_Actions::send_data but adds a greater `timeout` so
	// Jetpack sync server allocates more CPU for sync requests.
	static function set_bigger_timeout_for_sync( $data, $codec_name, $sent_timestamp, $queue_id ) {
		Jetpack::load_xml_rpc_client();

		$query_args = array(
			'sync'      => '1',             // add an extra parameter to the URL so we can tell it's a sync action
			'codec'     => $codec_name,     // send the name of the codec used to encode the data
			'timestamp' => $sent_timestamp, // send current server time so we can compensate for clock differences
			'queue'     => $queue_id,       // sync or full_sync
			'timeout'  => 50,
		);

		$rpc = new Jetpack_IXR_Client( array(
			'url'     => add_query_arg( $query_args, Jetpack::xmlrpc_api_url() ),
			'user_id' => JETPACK_MASTER_USER,
			'timeout' => 60,
		) );

		return $rpc->query( 'jetpack.syncActions', $data ) ? $rpc->getResponse() : $rpc->get_jetpack_error();
	}
}

WP_CLI::add_command( 'wpcomsh', 'WPCOMSH_CLI_Commands' );
