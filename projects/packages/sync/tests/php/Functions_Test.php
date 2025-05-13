<?php
/**
 * Functions Test
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use WorDBless\BaseTestCase;

/**
 * Unit tests for the Functions class.
 *
 * @package automattic/jetpack-sync
 */
class Functions_Test extends BaseTestCase {

	/**
	 * Test that the function passes through the value from wp_get_environment_type().
	 */
	public function test_get_environment_type_passes_through() {
		$this->assertEquals( wp_get_environment_type(), Functions::get_environment_type(), 'Failed asserting that get_environment_type() passes through the value from wp_get_environment_type()' );
	}
}
