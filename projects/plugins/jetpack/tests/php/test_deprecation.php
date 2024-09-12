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

		// @phan-suppress-next-line PhanEmptyFQSENInClasslike -- https://github.com/phan/phan/issues/4851
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
			array( 'Jetpack_Options', 'get_option', array( 'Bogus' ), false ),
			array( 'Jetpack_Options', 'get_option_and_ensure_autoload', array( 'Bogus', 'Bogus' ), false ),
			array( 'Jetpack_Options', 'update_option', array( 'Bogus', 'Bogus' ), false ),
			array( 'Jetpack_Tracks_Client', 'get_connected_user_tracks_identity', array(), false ),
		);
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

	/**
	 * Provides deprecated files and expected replacements.
	 *
	 * @return array
	 */
	public function provider_deprecated_file_paths() {
		return array();
	}
}
