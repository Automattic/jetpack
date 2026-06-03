<?php
/**
 * Tests for Analytics::init() configuration.
 *
 * @package automattic/jetpack-premium-analytics-plugin
 */

use Automattic\Jetpack\PremiumAnalytics\Analytics;
use PHPUnit\Framework\TestCase;

/**
 * Tests for Analytics::init() configuration.
 */
class AnalyticsInitTest extends TestCase {

	/**
	 * Test that the Analytics class exists and is loadable.
	 */
	public function test_analytics_class_exists() {
		$this->assertTrue( class_exists( Analytics::class ) );
	}
}
