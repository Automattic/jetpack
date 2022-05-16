<?php

class WP_Test_Jetpack_Deprecation extends WP_UnitTestCase {

	/**
	 * @dataProvider provider_deprecated_file_paths
	 */
	public function test_deprecated_file_paths( $file_path, $replacement_path ) {
		$this->setExpectedDeprecated( $file_path );

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
	public function test_deprecated_method_stubs( $class_name, $method_name ) {
		$this->assertTrue( method_exists( $class_name, $method_name ) );
	}

	public function provider_deprecated_method_stubs() {
		return array(
			array( 'JetpackTracking', 'record_user_event', array( 'Bogus' ) ),
			array( 'Jetpack_Client', '_wp_remote_request', array( 'Bogus', 'Bogus' ) ),
			array( 'Jetpack_Client', 'remote_request', array( 'Bogus' ) ),
			array( 'Jetpack_Client', 'wpcom_json_api_request_as_blog', array( 'Bogus' ) ),
			array( 'Jetpack_Options', 'get_option', array( 'Bogus' ), false ),
			array( 'Jetpack_Options', 'get_option_and_ensure_autoload', array( 'Bogus', 'Bogus' ), false ),
			array( 'Jetpack_Options', 'update_option', array( 'Bogus', 'Bogus' ), false ),
			array( 'Jetpack_Sync_Actions', 'initialize_listener', array() ),
			array( 'Jetpack_Sync_Actions', 'initialize_sender', array() ),
			array( 'Jetpack_Sync_Actions', 'sync_via_cron_allowed', array() ),
			array( 'Jetpack_Sync_Modules', 'get_module', array( 'Bogus' ) ),
			array( 'Jetpack_Sync_Settings', 'is_syncing', array() ),
			array( 'Jetpack_Sync_Settings', 'reset_data', array() ),
			array( 'Jetpack_Sync_Settings', 'update_settings', array( array( 'Bogus' => 1 ) ) ),
			array( 'Jetpack_Tracks_Client', 'get_connected_user_tracks_identity', array(), false ),
			array( 'Jetpack_Sync_Settings', 'is_syncing', array() ),
		);
	}

	/**
	 * @dataProvider provider_deprecated_defined_functions
	 */
	public function test_deprecated_defined_functions( $function ) {
		$this->assertTrue( function_exists( $function ) );
	}

	/**
	 * @dataProvider provider_deprecated_method_stubs
	 */
	public function test_deprecated_method_smoke_test( $class, $method, $arguments, $expect_notice = true ) {
		if ( $expect_notice ) {
			$this->setExpectedDeprecated( "$class::$method" );
		}

		$class  = new ReflectionClass( $class );
		$method = $class->getMethod( $method );

		set_error_handler( '__return_null' );
		try {
			$method->invokeArgs( null, $arguments );
			$this->assertTrue( true );
		} catch ( Error $e ) {
			$this->fail( "{$class->getName()}::{$method->getName()} is throwing fatal errors.\n$e" );
		} finally {
			restore_error_handler();
		}
	}

	public function provider_deprecated_defined_functions() {
		return array(
			array( 'jetpack_tracks_get_identity' ),
			array( 'jetpack_tracks_record_event' ),
		);
	}

	public function test_jetpack_sync_action_sender_exists() {
		$this->assertTrue( property_exists( 'Jetpack_Sync_Actions', 'sender' ) );
	}

	/**
	 * Provides deprecated files and expected replacements.
	 *
	 * @return array
	 */
	public function provider_deprecated_file_paths() {
		return array();
	}
}
