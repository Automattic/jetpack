<?php

use PHPUnit\Framework\Attributes\DataProvider;

class Jetpack_Deprecation_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @dataProvider provider_deprecated_file_paths
	 */
	#[DataProvider( 'provider_deprecated_file_paths' )]
	public function test_deprecated_file_paths( $file_path, $replacement_path ) {
		if ( $file_path === '' && $replacement_path === '' ) {
			$this->markTestSkipped( 'No deprecated paths to test' );
		}

		$this->setExpectedDeprecated( $file_path );

		$action = $this->getMockBuilder( \CallableMock::class )->getMock();
		$action->expects( $this->once() )->method( '__invoke' )->with( $file_path, $replacement_path );

		add_action( 'deprecated_file_included', $action, 10, 2 );
		add_filter( 'deprecated_file_trigger_error', '__return_false' );

		require_once JETPACK__PLUGIN_DIR . $file_path;
	}

	/**
	 * @dataProvider provider_deprecated_method_stubs
	 */
	#[DataProvider( 'provider_deprecated_method_stubs' )]
	public function test_deprecated_method_stubs( $class_name, $method_name ) {
		$this->assertTrue( method_exists( $class_name, $method_name ) );
	}

	public static function provider_deprecated_method_stubs() {
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
	#[DataProvider( 'provider_deprecated_method_stubs' )]
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
	public static function provider_deprecated_file_paths() {
		return array(
			// PHPunit 11 doesn't allow an empty data provider and doesn't allow the provider to explicitly skip either, sigh. So we have to do BS like this instead.
			array( '', '' ),
		);
	}
}
