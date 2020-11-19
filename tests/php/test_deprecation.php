<?php

class WP_Test_Jetpack_Deprecation extends WP_UnitTestCase {

	/**
	 * @dataProvider provider_deprecated_file_paths
	 */
	public function test_deprecated_file_paths( $file_path, $replacement_path ) {
		$mock = $this->getMockBuilder( stdClass::class )
			->setMethods( array( 'action' ) )
			->getMock();
		$mock->expects( $this->once() )->method( 'action' )->with( $file_path, $replacement_path );

		add_action( 'deprecated_file_included', array( $mock, 'action' ), 10, 2 );
		add_filter( 'deprecated_file_trigger_error', '__return_false' );

		require_once JETPACK__PLUGIN_DIR . $file_path;
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
			array( 'Jetpack_Sync_Actions', 'sync_via_cron_allowed' ),
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

	/**
	 * @dataProvider provider_deprecated_method_stubs
	 */
	function test_deprecated_method_smoke_test( $class, $method ) {
		$class = new ReflectionClass( $class );
		$method = $class->getMethod( $method );
		$parameters = $method->getParameters();

		$arguments = array();

		// Generating enough parameters for the method call to successfully complete.
		foreach ( $parameters as $parameter ) {
			if( $parameter->isDefaultValueAvailable() ) {

				// No more parameters needed to successfully call the method.
				break;
			}

			$arguments[] = 'Bogus argument';
		}

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler
		set_error_handler( '__return_null' );
		try {
			$method->invokeArgs( null, $arguments );
		} catch ( Error $e ) {
			$this->fail( $class->getName() . '::' . $method->getName() . ' is throwing fatal errors.' );
			return;
		} finally {
			restore_error_handler();
		}

		// Marking as skipped instead of artificially passing to account for any warnings or notices
		// the methods might throw when called with bogus arguments.
		$this->markTestSkipped();
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
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler
		set_error_handler( '__return_null' );
		try {
			jetpack_require_lib( $lib );
		} finally {
			restore_error_handler();
		}
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

	/**
	 * Provides deprecated files and expected relacements.
	 *
	 * @return array
	 */
	function provider_deprecated_file_paths() {
		return array(
			array(
				'class.jetpack-ixr-client.php',
				'',
			),
			array(
				'class.jetpack-xmlrpc-server.php',
				'',
			),
		);
	}

}
