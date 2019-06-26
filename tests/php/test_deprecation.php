<?php

class WP_Test_Jetpack_Deprecation extends WP_UnitTestCase {

	private $errors;

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

	function test_require_old_jetpack_options() {
		$this->set_error_handler();
		require_once JETPACK__PLUGIN_DIR . '/class.jetpack-options.php';

		$this->assertDeprecatedFileError( 'class.jetpack-options.php', 'packages/options/legacy/class.jetpack-options.php',
			E_USER_NOTICE );
		restore_error_handler();
	}

	function test_jetpack_deprecated_class_methods() {
		$deprecated = array(
			'Jetpack_Options'   => array(
				'get_option',
				'update_option'
			),
		);

		foreach ( $deprecated as $class => $methods ) {
			foreach ( $methods as $method ) {
				$this->assertTrue( method_exists( $class, $method ) );
			}
		}
	}

}
