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

	function provider_deprecated_method_stubs() {
		return array(
			array( 'Jetpack_Options', 'get_option' ),
			array( 'Jetpack_Options', 'get_option_and_ensure_autoload' ),
			array( 'Jetpack_Client', 'remote_request' ),
			array( 'Jetpack_Client', '_wp_remote_request' ),
			array( 'Jetpack_Client', 'wpcom_json_api_request_as_blog' ),
			array( 'Jetpack_Tracks_Client', 'get_connected_user_tracks_identity' ),
			array( 'Jetpack_Sync_Settings', 'is_syncing' ),
			array( 'Jetpack_Sync_Settings', 'update_settings' ),
			array( 'Jetpack_Sync_Settings', 'reset_data' ),
			array( 'Jetpack_Tracks_Client', 'get_connected_user_tracks_identity' ),
//			array( 'JetpackTracking', 'record_user_event' ),
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
		);
	}

}
