<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Main plugin file testing.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use WorDBless\BaseTestCase;

/**
 * Main plugin file testing.
 */
class Share_Limits_Test extends BaseTestCase {
	/**
	 * Get a list of dummy connections for testing.
	 *
	 * @return array
	 */
	public function get_dummy_connections() {
		return array(
			'twitter'  => array(
				123456 => array(),
			),
			'facebook' => array(
				123456 => array(),
			),
		);
	}

	/**
	 * Test that connections get disabled by default when the number of connections is greater than the share limit.
	 */
	public function test_connections_get_disabled_when_number_of_connections_is_greater_than_share_limit() {
		$share_limit = new Share_Limits( $this->get_dummy_connections(), 1, false );
		$share_limit->enforce_share_limits();

		// When checking for a specific callback with has_filter, the function returns the priority of the filter.
		$this->assertEquals( has_filter( 'publicize_checkbox_default', '__return_false' ), 10 );
	}

	/**
	 * Test that connections stay enabled by default when the number of connections is smaller than the share limit.
	 */
	public function test_connections_stay_enabled_when_number_of_connections_is_smaller_than_share_limit() {
		$share_limit = new Share_Limits( $this->get_dummy_connections(), 3, false );
		$share_limit->enforce_share_limits();

		$this->assertFalse( has_filter( 'publicize_checkbox_default', '__return_false' ) );
	}
}
