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

		try {
			$method->invokeArgs( null, $arguments );
		} catch ( Error $e ) {
			$this->fail( $class->getName() . '::' . $method->getName() . ' is throwing fatal errors.' );
			return;
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

	/**
	 * Provides deprecated files and expected relacements.
	 *
	 * @todo Remove error version check when WordPress 5.4 is the minimum.
	 * @todo Remove replacement version check when WordPress 5.5 is the minimum.
	 *
	 * @return array
	 */
	function provider_deprecated_file_paths() {
		global $wp_version;

		$error       = ( version_compare( $wp_version, '5.4-alpha', '>=' ) ) ? E_USER_DEPRECATED : E_USER_NOTICE;
		$replacement = ( version_compare( $wp_version, '5.5-alpha', '>=' ) ) ? '' : null;

		return array(

			array(
				'class.jetpack-ixr-client.php',
				$replacement,
				$error,
			),
			array(
				'class.jetpack-xmlrpc-server.php',
				$replacement,
				$error,
			),
		);
	}

}
