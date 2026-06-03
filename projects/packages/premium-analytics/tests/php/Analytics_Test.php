<?php
/**
 * Tests for the Analytics class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Tests for the Analytics class.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Analytics
 */
#[CoversClass( Analytics::class )]
class Analytics_Test extends TestCase {

	/**
	 * Test that the Analytics class can be instantiated.
	 */
	public function test_class_exists() {
		$this->assertTrue( class_exists( Analytics::class ) );
	}
}
