<?php

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Speculation_Rules;

use Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules\Speculation_Rules;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;

class Speculation_Rules_Test extends Base_TestCase {
	private $speculation_rules;
	private $was_constant_defined;
	private $original_constant_value;

	public function set_up() {
		parent::set_up();
		$this->speculation_rules = new Speculation_Rules();

		// Store the original state of the constant
		$this->was_constant_defined    = defined( 'JETPACK_BOOST_ALPHA_FEATURES' );
		$this->original_constant_value = $this->was_constant_defined ? constant( 'JETPACK_BOOST_ALPHA_FEATURES' ) : null;
	}

	/**
	 * Test the is_available method with different constant states
	 *
	 * @since $$next-version$$
	 */
	public function test_is_available() {
		// Test the current behavior based on the actual constant state
		if ( ! $this->was_constant_defined ) {
			// If the constant wasn't defined, we can test both scenarios
			$this->assertFalse( Speculation_Rules::is_available(), 'Should return false when constant is not defined' );

			// Define the constant as true and test again
			define( 'JETPACK_BOOST_ALPHA_FEATURES', true );
			$this->assertTrue( Speculation_Rules::is_available(), 'Should return true when constant is defined as true' );
		} elseif ( $this->original_constant_value === true ) {
			// Constant is already defined as true
			$this->assertTrue( Speculation_Rules::is_available(), 'Should return true when constant is defined as true' );
			$this->markTestIncomplete( 'Cannot test the false case because JETPACK_BOOST_ALPHA_FEATURES is already defined as true' );
		} else {
			// Constant is already defined as something other than true
			$this->assertFalse( Speculation_Rules::is_available(), 'Should return false when constant is defined but not true' );
			$this->markTestIncomplete( 'Cannot test the true case because JETPACK_BOOST_ALPHA_FEATURES is already defined as ' . $this->original_constant_value );
		}
	}

	public function test_get_slug() {
		$this->assertEquals( 'speculation_rules', Speculation_Rules::get_slug() );
	}

	public function test_is_ready() {
		$this->assertTrue( $this->speculation_rules->is_ready() );
	}

	public function test_setup() {
		// Test that setup runs without errors
		$this->speculation_rules->setup();
		$this->assertNotFalse( has_action( 'wp_footer', array( $this->speculation_rules, 'inject_speculation_rules' ) ) );
	}

	/**
	 * Test the inject_speculation_rules method with prefetch method
	 *
	 * @since $$next-version$$
	 */
	public function test_inject_speculation_rules_prefetch() {
		// Mock jetpack_boost_ds_get to return false (use prefetch)
		Functions\when( 'jetpack_boost_ds_get' )->justReturn( false );

		// Start output buffering to capture the output
		ob_start();
		$this->speculation_rules->inject_speculation_rules();
		$output = ob_get_clean();

		// Check that the output contains the expected script tag with prefetch method
		$this->assertStringContainsString( '<script type="speculationrules">', $output );
		$this->assertStringContainsString( '"prefetch"', $output );
		$this->assertStringContainsString( '"source": "document"', $output );
		$this->assertStringContainsString( '"href_matches": "/*"', $output );
	}

	/**
	 * Test the inject_speculation_rules method with prerender method
	 *
	 * @since $$next-version$$
	 */
	public function test_inject_speculation_rules_prerender() {
		// Mock jetpack_boost_ds_get to return true (use prerender)
		Functions\when( 'jetpack_boost_ds_get' )->justReturn( true );

		// Start output buffering to capture the output
		ob_start();
		$this->speculation_rules->inject_speculation_rules();
		$output = ob_get_clean();

		// Check that the output contains the expected script tag with prerender method
		$this->assertStringContainsString( '<script type="speculationrules">', $output );
		$this->assertStringContainsString( '"prerender"', $output );
		$this->assertStringContainsString( '"source": "document"', $output );
		$this->assertStringContainsString( '"href_matches": "/*"', $output );
	}

	/**
	 * Test the register_data_sync method
	 *
	 * @since $$next-version$$
	 */
	public function test_register_data_sync() {
		// Since we can't mock the Data_Sync class directly, we'll skip the actual test
		// and just verify that the method exists and can be called without errors
		$this->assertTrue( method_exists( $this->speculation_rules, 'register_data_sync' ), 'The register_data_sync method should exist' );

		// Mark the test as skipped with an explanation
		$this->markTestSkipped(
			'Cannot fully test register_data_sync because Data_Sync is a final class and cannot be mocked.'
		);
	}
}
