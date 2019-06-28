<?php

class WP_Test_Jetpack_Deprecation extends WP_UnitTestCase {

	private $errors;

	public function setUp() {
		parent::setUp();
		$this->set_error_handler();
	}

	private function set_error_handler() {
		$this->errors = array();
		set_error_handler( array( $this, "errorHandler" ) );
	}

	public function tearDown() {
		parent::tearDown();
		restore_error_handler();
	}

	public function errorHandler( $errno, $errstr, $errfile, $errline, $errcontext ) {
		$this->errors[] = compact( "errno", "errstr", "errfile",
			"errline", "errcontext" );
	}

	/**
	 * @dataProvider provider_deprecated_file_paths
	 */
	function test_deprecated_file_paths( $file_path, $replacement_path, $error_level ) {
		require_once JETPACK__PLUGIN_DIR . $file_path;

		$this->assertDeprecatedFileError( $file_path, $replacement_path, $error_level );
	}

	public function assertDeprecatedFileError( $deprecated, $replacement, $errno ) {
		foreach ( $this->errors as $error ) {
			if ( $error['errno'] === $errno ) {
				// The error uses only the file name, not the path. Remove relative path if present so they can match.
				if ( false !== strrpos( $deprecated, DIRECTORY_SEPARATOR ) ) {
					$deprecated = substr( $deprecated, strrpos( $deprecated, DIRECTORY_SEPARATOR ) + 1 );
				}

				if ( $error['errcontext']['file'] === $deprecated && $error['errcontext']['replacement'] === $replacement ) {
					self::assertTrue( true );

					return;
				}
			}

		}
		$this->fail( "Error for $deprecated not found" );
	}

	/**
	 * @dataProvider provider_deprecated_method_stubs
	 */
	function test_deprecated_method_stubs( $class_name, $method_name ) {
		$this->assertTrue( method_exists( $class_name, $method_name ) );
	}

	function provider_deprecated_method_stubs() {
		return array(
			array( 'JetpackTracking', 'record_user_event' ),
			array( 'Jetpack_Client', '_wp_remote_request' ),
			array( 'Jetpack_Client', 'remote_request' ),
			array( 'Jetpack_Client', 'wpcom_json_api_request_as_blog' ),
			array( 'Jetpack_Options', 'get_option' ),
			array( 'Jetpack_Options', 'get_option_and_ensure_autoload' ),
			array( 'Jetpack_Options', 'update_option' ),
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

	/**
	 * @dataProvider provider_deprecated_defined_functions
	 */
	function test_deprecated_defined_functions( $function ) {
		$this->assertTrue( function_exists( $function ) );
	}

	function provider_deprecated_defined_functions() {
		return array(
			array( 'jetpack_tracks_get_identity' ),
			array( 'jetpack_tracks_record_event' ),
		);
	}

	/**
	 * @dataProvider provider_deprecated_lib_stubs
	 */
	function test_deprecated_lib( $lib, $functions = array() ) {
		jetpack_require_lib( $lib );
		foreach ( $functions as $function ) {
			$this->assertTrue( function_exists( $function ) );
		}
	}

	function provider_deprecated_lib_stubs() {
		return array(
			array( 'tracks/client', array( 'jetpack_tracks_record_event' ) ),
		);
	}

	function test_jetpack_sync_action_sender_exists() {
		$this->assertTrue( property_exists( 'Jetpack_Sync_Actions', 'sender' ) );
	}

	function provider_deprecated_file_paths() {
		return array(

			array(
				'class.jetpack-options.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-client.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'_inc/lib/tracks/class.tracks-client.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'_inc/lib/tracks/class.tracks-event.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-constants.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-jitm.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-signature.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'class.jetpack-tracks.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-actions.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-defaults.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-functions.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-json-deflate-array-codec.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-listener.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-attachments.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-callables.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-comments.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-constants.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-full-sync.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-import.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-menus.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-meta.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-network-options.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-options.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-plugins.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-posts.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-protect.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-stats.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-terms.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-themes.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-updates.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-users.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-woocommerce.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module-wp-super-cache.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-module.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-modules.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-queue.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-sender.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-server.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-settings.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-simple-codec.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-users.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/class.jetpack-sync-wp-replicastore.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/interface.jetpack-sync-codec.php',
				null,
				E_USER_NOTICE,
			),
			array(
				'sync/interface.jetpack-sync-replicastore.php',
				null,
				E_USER_NOTICE,
			),
		);
	}

}
