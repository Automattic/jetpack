<?php
namespace Automattic\Jetpack_Boost\Tests\Compatibility;

use Automattic\Jetpack_Boost\Tests\Base_TestCase;

/**
 * Class JS_Concatenate_Test
 *
 * @package Automattic\Jetpack_Boost\Tests\Compatibility
 */
class JS_Concatenate_Test extends Base_TestCase {

	/**
	 * Load the compatibility shim (it registers a filter on include).
	 */
	protected function set_up() {
		parent::set_up();
		require_once JETPACK_BOOST_DIR_PATH . '/compatibility/js-concatenate.php';
	}

	public function test_excluded_handle_is_not_concatenated() {
		$fn = 'Automattic\Jetpack_Boost\Compatibility\JS_Concatenate\maybe_do_not_concat';
		$this->assertFalse( $fn( true, 'tribe-tickets-block' ) );
		$this->assertFalse( $fn( true, 'woocommerce-analytics-client' ) );
	}

	public function test_other_handles_pass_through_unchanged() {
		$fn = 'Automattic\Jetpack_Boost\Compatibility\JS_Concatenate\maybe_do_not_concat';
		$this->assertTrue( $fn( true, 'some-other-handle' ) );
		$this->assertFalse( $fn( false, 'some-other-handle' ) );
	}

	/**
	 * The `jetpack-boost-guide` handle was previously force-excluded from
	 * concatenation as a workaround for the JS truncation bug. Now that the bundle
	 * ships as `.min.js` and the serving path skips re-minifying it, the exclusion
	 * is removed: the handle must concatenate like any other. Locked in so re-adding
	 * the exclusion line (e.g. a conflict revert) fails a test.
	 */
	public function test_guide_handle_is_no_longer_force_excluded() {
		$fn = 'Automattic\Jetpack_Boost\Compatibility\JS_Concatenate\maybe_do_not_concat';
		$this->assertTrue( $fn( true, 'jetpack-boost-guide' ) );
	}
}
