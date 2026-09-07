<?php
/**
 * Tests for WooCommerce_Analytics_Tracker.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\WooCommerce_Analytics_Tracker
 */
#[CoversClass( WooCommerce_Analytics_Tracker::class )]
class WooCommerce_Analytics_Tracker_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		remove_all_actions( 'after_setup_theme' );
		remove_all_filters( 'woocommerce_analytics_clickhouse_enabled' );
		remove_all_filters( 'woocommerce_analytics_experimental_proxy_tracking_enabled' );
	}

	public function test_configure_registers_bootstrap_on_after_setup_theme() {
		WooCommerce_Analytics_Tracker::configure();

		$this->assertNotFalse(
			has_action( 'after_setup_theme', array( WooCommerce_Analytics_Tracker::class, 'bootstrap' ) )
		);
	}

	public function test_bootstrap_enables_clickhouse_and_proxy_filters() {
		WooCommerce_Analytics_Tracker::bootstrap();

		$this->assertTrue( apply_filters( 'woocommerce_analytics_clickhouse_enabled', false ) );
		$this->assertTrue( apply_filters( 'woocommerce_analytics_experimental_proxy_tracking_enabled', false ) );
	}

	public function test_bootstrap_is_safe_to_run_twice() {
		for ( $i = 0; $i < 2; $i++ ) {
			WooCommerce_Analytics_Tracker::bootstrap();
		}

		// Filters still resolve to true; the modern pipeline stays enabled and no
		// error is raised by the second run.
		$this->assertTrue( apply_filters( 'woocommerce_analytics_clickhouse_enabled', false ) );
		$this->assertTrue( apply_filters( 'woocommerce_analytics_experimental_proxy_tracking_enabled', false ) );
	}
}
