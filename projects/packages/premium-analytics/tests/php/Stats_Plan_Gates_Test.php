<?php
/**
 * Tests for the Stats plan gates.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/stats-plan-gates.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_plan_tier
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_wpcom_stats_plan_tier
 * @covers ::Automattic\Jetpack\PremiumAnalytics\has_jetpack_stats_commercial_purchase
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_plan_tier' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_wpcom_stats_plan_tier' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\has_jetpack_stats_commercial_purchase' )]
class Stats_Plan_Gates_Test extends BaseTestCase {

	/**
	 * Host detection memoizes into the status cache, which outlives the constants.
	 */
	public function set_up() {
		parent::set_up();
		Cache::clear();
		$GLOBALS['jpa_test_wpcom_features']  = array();
		$GLOBALS['jpa_test_wpcom_purchases'] = array( array( 'product_slug' => 'business-bundle' ) );
	}

	/**
	 * Reset constants, options and filters.
	 */
	public function tear_down() {
		Constants::clear_constants();
		Cache::clear();
		$GLOBALS['jpa_test_wpcom_features']  = array();
		$GLOBALS['jpa_test_wpcom_purchases'] = array( array( 'product_slug' => 'business-bundle' ) );
		delete_option( 'jetpack_active_plan' );
		delete_option( 'jetpack_site_products' );
		remove_all_filters( STATS_PLAN_TIER_FILTER );
		parent::tear_down();
	}

	/**
	 * Place the site on Simple or Atomic.
	 *
	 * @param string $platform `simple` or `atomic`.
	 */
	private function set_wpcom_platform( $platform ) {
		if ( 'simple' === $platform ) {
			Constants::set_constant( 'IS_WPCOM', true );
			return;
		}
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/plugins/wpcomsh/wpcomsh.php' );
	}

	/**
	 * WordPress.com reads the site's stats feature, in Calypso's order.
	 *
	 * @dataProvider provide_wpcom_tiers
	 *
	 * @param string   $platform Platform.
	 * @param string[] $features Entitled features.
	 * @param string   $expected Expected tier.
	 */
	#[DataProvider( 'provide_wpcom_tiers' )]
	public function test_wpcom_tier_follows_the_stats_feature( $platform, $features, $expected ) {
		$this->set_wpcom_platform( $platform );
		$GLOBALS['jpa_test_wpcom_features'] = $features;

		$this->assertSame( $expected, get_stats_plan_tier() );
	}

	/**
	 * Feature sets and the tier each resolves to, on both platforms.
	 *
	 * @return array
	 */
	public static function provide_wpcom_tiers() {
		$cases = array(
			'commercial wins'          => array( array( 'stats-commercial', 'stats-paid', 'stats-free' ), STATS_TIER_COMMERCIAL ),
			'legacy free beats paid'   => array( array( 'stats-paid', 'stats-free' ), STATS_TIER_LEGACY_FREE ),
			'paid'                     => array( array( 'stats-paid' ), STATS_TIER_PAID ),
			'legacy basic'             => array( array( 'stats-basic' ), STATS_TIER_LEGACY_BASIC ),
			'no stats feature is free' => array( array(), STATS_TIER_FREE ),
			'near-miss slug'           => array( array( 'stats-commercial-v2' ), STATS_TIER_FREE ),
		);
		$data  = array();
		foreach ( array( 'simple', 'atomic' ) as $platform ) {
			foreach ( $cases as $name => $case ) {
				$data[ "$platform: $name" ] = array( $platform, $case[0], $case[1] );
			}
		}
		return $data;
	}

	/**
	 * Unsynced Atomic purchases read like a site that bought nothing, so nothing is gated.
	 */
	public function test_atomic_without_synced_purchases_is_unknown() {
		$this->set_wpcom_platform( 'atomic' );
		$GLOBALS['jpa_test_wpcom_purchases'] = array();

		$this->assertSame( STATS_TIER_UNKNOWN, get_stats_plan_tier() );
	}

	/**
	 * Simple has no persistent data to sync, so empty purchases still mean free.
	 */
	public function test_simple_ignores_the_purchases_check() {
		$this->set_wpcom_platform( 'simple' );
		$GLOBALS['jpa_test_wpcom_purchases'] = array();

		$this->assertSame( STATS_TIER_FREE, get_stats_plan_tier() );
	}

	/**
	 * Self-hosted sites are commercial only with a purchase that supports commercial use.
	 *
	 * @dataProvider provide_jetpack_purchases
	 *
	 * @param mixed  $plan     The `jetpack_active_plan` option.
	 * @param mixed  $products The `jetpack_site_products` option.
	 * @param string $expected Expected tier.
	 */
	#[DataProvider( 'provide_jetpack_purchases' )]
	public function test_jetpack_tier_follows_purchases( $plan, $products, $expected ) {
		update_option( 'jetpack_active_plan', $plan );
		update_option( 'jetpack_site_products', $products );

		$this->assertSame( $expected, get_stats_plan_tier() );
	}

	/**
	 * Purchase states and the tier each resolves to.
	 *
	 * @return array
	 */
	public static function provide_jetpack_purchases() {
		return array(
			'nothing'                  => array( array(), array(), STATS_TIER_JETPACK_FREE ),
			'stats yearly product'     => array( array(), array( array( 'product_slug' => 'jetpack_stats_yearly' ) ), STATS_TIER_COMMERCIAL ),
			'stats PWYW is not'        => array( array(), array( array( 'product_slug' => 'jetpack_stats_pwyw_yearly' ) ), STATS_TIER_JETPACK_FREE ),
			'complete plan'            => array( array( 'product_slug' => 'jetpack_complete_monthly' ), array(), STATS_TIER_COMMERCIAL ),
			'growth plan'              => array( array( 'product_slug' => 'jetpack_growth_yearly' ), array(), STATS_TIER_COMMERCIAL ),
			'security plan is not'     => array( array( 'product_slug' => 'jetpack_security_t1_yearly' ), array(), STATS_TIER_JETPACK_FREE ),
			'stats-commercial feature' => array( array( 'features' => array( 'active' => array( 'stats-commercial' ) ) ), array(), STATS_TIER_COMMERCIAL ),
			'malformed options'        => array( 'garbage', 'garbage', STATS_TIER_JETPACK_FREE ),
		);
	}

	/**
	 * VIP is never gated.
	 */
	public function test_vip_is_commercial() {
		Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );

		$this->assertSame( STATS_TIER_COMMERCIAL, get_stats_plan_tier() );
	}

	/**
	 * Hosts and tests can override the tier.
	 */
	public function test_tier_is_filterable() {
		add_filter(
			STATS_PLAN_TIER_FILTER,
			static function () {
				return STATS_TIER_PAID;
			}
		);

		$this->assertSame( STATS_TIER_PAID, get_stats_plan_tier() );
	}
}
