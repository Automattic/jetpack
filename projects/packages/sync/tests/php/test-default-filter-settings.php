<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The Test_Default_Filter_Settings class.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Default_Filter_Settings class.
 *
 * @package automattic/jetpack-sync
 */
class Test_Default_Filter_Settings extends TestCase {

	/**
	 * Tests the test_get_default_settings method with invalid inputs which
	 * should return false.
	 *
	 * @param mixed $input The test input.
	 *
	 * @dataProvider data_provider_test_get_default_settings_invalid_input
	 */
	public function test_get_default_settings_invalid_input( $input ) {
		$this->assertFalse( ( new Default_Filter_Settings() )->get_default_settings( $input ) );
	}

	/**
	 * Data provider for the test_get_default_settings_invalid_input test.
	 *
	 * @return array An array containing the test inputs.
	 */
	public function data_provider_test_get_default_settings_invalid_input() {
		return array(
			'null'           => array( null ),
			'array'          => array( array( 'test' ) ),
			'integer'        => array( 2 ),
			'invalid string' => array( 'test' ),
		);
	}

	/**
	 * Tests the test_get_default_settings method with valid inputs.
	 *
	 * @param string $input The test input.
	 * @param array  $output The expected output from the get_default_settings method.
	 *
	 * @dataProvider data_provider_test_get_default_settings_valid_input
	 */
	public function test_get_default_settings_valid_input( $input, $output ) {
		$this->assertSame( $output, ( new Default_Filter_Settings() )->get_default_settings( $input ) );
	}

	/**
	 * Data provider for the test_get_default_settings_invalid_input test.
	 *
	 * @return array An array containing the test inputs.
	 */
	public function data_provider_test_get_default_settings_valid_input() {
		return array(
			'options'   => array(
				'input'  => 'jetpack_sync_options_whitelist',
				'output' => Defaults::$default_options_whitelist,
			),
			'callables' => array(
				'input'  => 'jetpack_sync_callable_whitelist',
				'output' => Defaults::$default_callable_whitelist,
			),
		);
	}

	/**
	 * Tests the get_all_filters_default_settings method.
	 */
	public function test_get_all_filters_default_settings() {
		$output = array(
			'jetpack_sync_options_whitelist'            => Defaults::$default_options_whitelist,
			'jetpack_sync_options_contentless'          => Defaults::$default_options_contentless,
			'jetpack_sync_constants_whitelist'          => Defaults::$default_constants_whitelist,
			'jetpack_sync_callable_whitelist'           => Defaults::$default_callable_whitelist,
			'jetpack_sync_multisite_callable_whitelist' => Defaults::$default_multisite_callable_whitelist,
			'jetpack_sync_post_meta_whitelist'          => Defaults::$post_meta_whitelist,
			'jetpack_sync_comment_meta_whitelist'       => Defaults::$comment_meta_whitelist,
			'jetpack_sync_capabilities_whitelist'       => Defaults::$default_capabilities_whitelist,
			'jetpack_sync_known_importers'              => Defaults::$default_known_importers,
		);

		$this->assertSame( $output, ( new Default_Filter_Settings() )->get_all_filters_default_settings() );
	}

}
