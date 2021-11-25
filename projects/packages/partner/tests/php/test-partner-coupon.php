<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests the partner-coupon package.
 *
 * @package automattic/jetpack-partner
 */

namespace Automattic\Jetpack;

use Brain\Monkey;
use PHPUnit\Framework\TestCase;

/**
 * Class Partner_Coupon_Test
 *
 * @package Automattic\Jetpack
 * @covers Automattic\Jetpack\Partner_Coupon
 */
class Partner_Coupon_Test extends TestCase {

	/**
	 * Set up the tests.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();
	}

	/**
	 * Tests the class returns the instance.
	 */
	public function test_get_instance_returns_instance() {
		$this->assertInstanceOf( Partner_Coupon::class, Partner_Coupon::get_instance() );
	}

}
