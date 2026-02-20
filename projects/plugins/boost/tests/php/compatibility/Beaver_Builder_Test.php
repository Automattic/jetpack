<?php
/**
 * Tests for Beaver Builder compatibility.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Compatibility;

use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;

/**
 * Class Beaver_Builder_Test
 *
 * @package Automattic\Jetpack_Boost\Tests\Compatibility
 */
class Beaver_Builder_Test extends Base_TestCase {

	/**
	 * Flag to track if the compatibility file has been loaded.
	 *
	 * @var bool
	 */
	private static $file_loaded = false;

	/**
	 * Load the compatibility file once, after mocking add_filter.
	 */
	protected function set_up() {
		parent::set_up();

		// Mock add_filter before loading the file (it's called at file load time)
		if ( ! self::$file_loaded ) {
			Functions\when( 'add_filter' )->justReturn( true );
			require_once JETPACK_BOOST_DIR_PATH . '/compatibility/beaver-builder.php';
			self::$file_loaded = true;
		}
	}

	/**
	 * Test that JS concatenation is disabled when fl_builder query param is present.
	 */
	public function test_disables_concat_when_fl_builder_param_present() {
		// Mock filter_input to return empty string (param exists with no value)
		Functions\when( 'filter_input' )->justReturn( '' );

		$result = \Automattic\Jetpack_Boost\Compatibility\Beaver_Builder\disable_js_concatenate_for_beaver_builder( true, 'some-handle' );

		$this->assertFalse( $result );
	}

	/**
	 * Test that JS concatenation is disabled when fl_builder query param has a value.
	 */
	public function test_disables_concat_when_fl_builder_param_has_value() {
		// Mock filter_input to return a value
		Functions\when( 'filter_input' )->justReturn( '1' );

		$result = \Automattic\Jetpack_Boost\Compatibility\Beaver_Builder\disable_js_concatenate_for_beaver_builder( true, 'some-handle' );

		$this->assertFalse( $result );
	}

	/**
	 * Test that JS concatenation is allowed when not in BB editor mode.
	 */
	public function test_allows_concat_when_not_in_bb_editor() {
		// Mock filter_input to return null (param not present)
		Functions\when( 'filter_input' )->justReturn( null );

		$result = \Automattic\Jetpack_Boost\Compatibility\Beaver_Builder\disable_js_concatenate_for_beaver_builder( true, 'some-handle' );

		$this->assertTrue( $result );
	}

	/**
	 * Test that original $do_concat value is preserved when not in BB editor.
	 */
	public function test_preserves_original_do_concat_value() {
		// Mock filter_input to return null (param not present)
		Functions\when( 'filter_input' )->justReturn( null );

		// Test with false
		$result = \Automattic\Jetpack_Boost\Compatibility\Beaver_Builder\disable_js_concatenate_for_beaver_builder( false, 'some-handle' );
		$this->assertFalse( $result );

		// Test with true
		$result = \Automattic\Jetpack_Boost\Compatibility\Beaver_Builder\disable_js_concatenate_for_beaver_builder( true, 'another-handle' );
		$this->assertTrue( $result );
	}
}
