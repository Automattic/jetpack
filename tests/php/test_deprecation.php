<?php

class WP_Test_Jetpack_Deprecation extends WP_UnitTestCase {

	private $errors;

	public function setUp() {
		parent::setUp();
		$this->set_error_handler();
	}

	public function tearDown() {
		parent::tearDown();
		restore_error_handler();
	}

	public function errorHandler( $errno, $errstr, $errfile, $errline, $errcontext ) {
		$this->errors[] = compact( "errno", "errstr", "errfile",
			"errline", "errcontext" );
	}

	private function set_error_handler() {
		$this->errors = array();
		set_error_handler( array( $this, "errorHandler" ) );
	}

	public function assertDeprecatedFileError( $deprecated, $replacement, $errno ) {
		foreach ( $this->errors as $error ) {
			if ( $error['errno'] === $errno ) {
				if ( $error['errcontext']['file'] === $deprecated && $error['errcontext']['replacement'] === $replacement ) {
					self::assertTrue( true );

					return;
				}
			}

		}
		$this->fail( "Error for $deprecated not found" );
	}

	/**
	 * @dataProvider provider_deprecated_file_paths
	 */
	function test_deprecated_file_paths( $file_path, $replacement_path, $error_level ) {
		require_once JETPACK__PLUGIN_DIR . $file_path;

		$this->assertDeprecatedFileError( $file_path, $replacement_path, $error_level );
	}

	/**
	 * @dataProvider provider_deprecated_method_stubs
	 */
	function test_deprecated_method_stubs( $class_name, $method_name ) {
		$this->assertTrue( method_exists( $class_name, $method_name ) );
	}

	function test_jetpack_sync_action_sender_exists() {
		$this->assertTrue( property_exists( 'Jetpack_Sync_Actions', 'sender' ) );
	}

	function provider_deprecated_method_stubs() {
		return array(
			array( 'JetpackTracking', 'record_user_event' ),
			array( 'Jetpack_Client', '_wp_remote_request' ),
			array( 'Jetpack_Client', 'remote_request' ),
			array( 'Jetpack_Client', 'wpcom_json_api_request_as_blog' ),
			array( 'Jetpack_Options', 'get_option' ),
			array( 'Jetpack_Options', 'get_option_and_ensure_autoload' ),
			array( 'Jetpack_Sync_Actions', 'initialize_listener' ),
			array( 'Jetpack_Sync_Actions', 'initialize_sender' ),
			array( 'Jetpack_Sync_Modules', 'get_module' ),
			array( 'Jetpack_Sync_Settings', 'is_syncing' ),
			array( 'Jetpack_Sync_Settings', 'reset_data' ),
			array( 'Jetpack_Sync_Settings', 'update_settings' ),
			array( 'Jetpack_Tracks_Client', 'get_connected_user_tracks_identity' ),
			array( 'Jetpack_Sync_Settings', 'is_syncing' ),
		);
	}

	function provider_deprecated_file_paths() {
		return array(
			array(
				'class.jetpack-options.php',
				'packages/options/legacy/class.jetpack-options.php',
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-client.php',
				'packages/connection/src/Client.php',
				E_USER_NOTICE,
			),
			array(
				'_inc/lib/tracks/class.tracks-client.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'_inc/lib/tracks/class.tracks-event.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-client.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-constants.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-jitm.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-options.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-signature.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-tracks.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-actions.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-defaults.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-functions.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-json-deflate-array-codec.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-listener.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-attachments.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-callables.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-comments.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-constants.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-full-sync.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-import.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-menus.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-meta.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-network-options.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-options.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-plugins.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-posts.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-protect.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-stats.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-terms.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-themes.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-updates.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-users.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-woocommerce.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-wp-super-cache.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-modules.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-queue.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-sender.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-server.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-settings.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-simple-codec.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-users.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-wp-replicastore.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/interface.jetpack-sync-codec.php',
				'',
				E_USER_NOTICE,
			),
			array(
				'sync/interface.jetpack-sync-replicastore.php',
				'',
				E_USER_NOTICE,
			),
		);
	}

}
