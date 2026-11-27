<?php
/**
 * Tests for WooCommerce_Analytics_Tracker.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Woocommerce_Analytics;
use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\WooCommerceStats\WooCommerce_Analytics_Tracker
 */
#[CoversClass( WooCommerce_Analytics_Tracker::class )]
class WooCommerce_Analytics_Tracker_Test extends TestCase {

	const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . Analytics_Dashboard::FLAG;

	/**
	 * @before
	 */
	#[Before]
	public function set_up() {
		add_filter( self::FLAG_FILTER, '__return_true' );
	}

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		remove_all_actions( 'after_setup_theme' );
		remove_all_filters( 'woocommerce_analytics_clickhouse_enabled' );
		remove_all_filters( 'woocommerce_analytics_experimental_proxy_tracking_enabled' );
		remove_all_filters( WooCommerce_Analytics_Tracker::ENABLED_FILTER );
		remove_all_filters( self::FLAG_FILTER );
	}

	public function test_configure_registers_bootstrap_on_after_setup_theme() {
		WooCommerce_Analytics_Tracker::configure();

		$this->assertNotFalse(
			has_action( 'after_setup_theme', array( WooCommerce_Analytics_Tracker::class, 'bootstrap' ) )
		);
	}

	public function test_bootstrap_enables_clickhouse_and_leaves_proxy_tracking_to_the_host() {
		WooCommerce_Analytics_Tracker::bootstrap();

		$this->assertTrue( apply_filters( 'woocommerce_analytics_clickhouse_enabled', false ) );
		$this->assertFalse( apply_filters( 'woocommerce_analytics_experimental_proxy_tracking_enabled', false ) );
	}

	/**
	 * Tracking off also skips init(), not just the pipeline filters.
	 *
	 * @dataProvider data_tracking_off
	 *
	 * @param bool      $flag_off      Whether to leave the WooCommerce Stats flag at its default, off.
	 * @param bool|null $host_tracking The host's answer to the store tracking filter, or null for none.
	 */
	#[DataProvider( 'data_tracking_off' )]
	public function test_bootstrap_does_nothing_when_tracking_is_off( $flag_off, $host_tracking ) {
		$sync     = array( Woocommerce_Analytics::class, 'sync_proxy_tracking_state' );
		$priority = has_action( 'init', $sync );
		if ( false !== $priority ) {
			remove_action( 'init', $sync, $priority );
		}
		if ( $flag_off ) {
			remove_all_filters( self::FLAG_FILTER );
		}
		if ( null !== $host_tracking ) {
			add_filter( WooCommerce_Analytics_Tracker::ENABLED_FILTER, $host_tracking ? '__return_true' : '__return_false' );
		}

		WooCommerce_Analytics_Tracker::bootstrap();

		$this->assertFalse( apply_filters( 'woocommerce_analytics_clickhouse_enabled', false ) );
		$this->assertFalse( apply_filters( 'woocommerce_analytics_experimental_proxy_tracking_enabled', false ) );
		// init() registers this before any of its own early returns, so it shows init() ran.
		$this->assertFalse( has_action( 'init', $sync ) );
	}

	/**
	 * @return array<string, array{0: bool, 1: bool|null}>
	 */
	public static function data_tracking_off() {
		return array(
			'host turns store tracking off' => array( false, false ),
			'flag off'                      => array( true, null ),
			'flag off, host forces it on'   => array( true, true ),
		);
	}

	public function test_bootstrap_is_safe_to_run_twice() {
		for ( $i = 0; $i < 2; $i++ ) {
			WooCommerce_Analytics_Tracker::bootstrap();
		}

		$this->assertTrue( apply_filters( 'woocommerce_analytics_clickhouse_enabled', false ) );
	}
}
