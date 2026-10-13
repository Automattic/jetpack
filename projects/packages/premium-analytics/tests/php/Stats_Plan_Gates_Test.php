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
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_locked_stats_features
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_upgrade_url
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_plan_gates
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_stats_plan_gates
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_stats_plan_gates_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_plan_tier' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_wpcom_stats_plan_tier' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\has_jetpack_stats_commercial_purchase' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_locked_stats_features' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_upgrade_url' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_plan_gates' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_stats_plan_gates' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_stats_plan_gates_script_data' )]
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
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_stats_plan_gates_script_data', 20 );
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

	/**
	 * Each tier locks exactly classic Stats' set.
	 *
	 * @dataProvider provide_locked_features
	 *
	 * @param string   $tier     Tier.
	 * @param string[] $expected Locked features.
	 */
	#[DataProvider( 'provide_locked_features' )]
	public function test_each_tier_locks_classic_stats_features( $tier, $expected ) {
		$locked = get_locked_stats_features( $tier );
		sort( $locked );
		sort( $expected );

		$this->assertSame( $expected, $locked );
	}

	/**
	 * Tiers and their locked features.
	 *
	 * @return array
	 */
	public static function provide_locked_features() {
		$commercial = array( 'authors', 'search-terms', 'videos', 'utm', 'devices', 'regions-cities' );
		return array(
			'commercial'   => array( STATS_TIER_COMMERCIAL, array() ),
			'unknown'      => array( STATS_TIER_UNKNOWN, array() ),
			'legacy free'  => array( STATS_TIER_LEGACY_FREE, array( 'utm', 'devices', 'regions-cities' ) ),
			'jetpack free' => array( STATS_TIER_JETPACK_FREE, array( 'utm', 'devices', 'regions-cities' ) ),
			'paid'         => array( STATS_TIER_PAID, $commercial ),
			'legacy basic' => array( STATS_TIER_LEGACY_BASIC, array_merge( $commercial, array( 'referrers', 'clicks', 'csv', 'intervals', 'long-date-presets' ) ) ),
			'free'         => array( STATS_TIER_FREE, array_merge( $commercial, array( 'top-posts', 'referrers', 'countries', 'clicks', 'file-downloads', 'insights', 'csv', 'intervals', 'recent-7-days' ) ) ),
		);
	}

	/**
	 * Locations loses the whole widget only when countries go too; regions alone are handled in the widget.
	 */
	public function test_locations_widget_locks_only_without_countries() {
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_PAID );
		$this->assertArrayNotHasKey( 'jpa/locations', get_stats_plan_gates()['locked_widget_types'] );

		remove_all_filters( STATS_PLAN_TIER_FILTER );
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_FREE );
		$this->assertSame( 'countries', get_stats_plan_gates()['locked_widget_types']['jpa/locations'] );
	}

	/**
	 * No tier ever locks a store widget.
	 */
	public function test_store_widgets_are_never_locked() {
		foreach ( self::provide_locked_features() as $name => list( $tier ) ) {
			remove_all_filters( STATS_PLAN_TIER_FILTER );
			add_filter( STATS_PLAN_TIER_FILTER, static fn() => $tier );
			$types = array_keys( get_stats_plan_gates()['locked_widget_types'] );

			foreach ( array( 'jpa/visitors-by-location', 'jpa/sales-by-device', 'jpa/bookings-by-device', 'jpa/total-returns' ) as $store_type ) {
				$this->assertNotContains( $store_type, $types, $name );
			}
		}
	}

	/**
	 * WordPress.com sells Premium for commercial features and Personal for the rest.
	 */
	public function test_wpcom_upgrade_url_targets_the_plan_that_unlocks_the_feature() {
		$this->set_wpcom_platform( 'simple' );

		$this->assertStringStartsWith( 'https://wordpress.com/checkout/', get_stats_upgrade_url( 'utm', STATS_TIER_PAID ) );
		$this->assertStringContainsString( '/premium?', get_stats_upgrade_url( 'utm', STATS_TIER_PAID ) );
		$this->assertStringContainsString( '/personal?', get_stats_upgrade_url( 'referrers', STATS_TIER_FREE ) );
	}

	/**
	 * Self-hosted sites go to the Stats purchase screen and come back flagged as purchased.
	 */
	public function test_jetpack_upgrade_url_returns_with_the_purchase_flag() {
		$url = get_stats_upgrade_url( 'utm', STATS_TIER_JETPACK_FREE );

		$this->assertStringContainsString( 'page=stats#!/stats/purchase/', $url );
		$this->assertStringContainsString( rawurlencode( 'jpa_purchased=1' ), $url );
	}

	/**
	 * The gates ride along with the rest of the script data, as objects even when empty.
	 */
	public function test_script_data_carries_the_gates_without_clobbering_siblings() {
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_COMMERCIAL );

		$data = inject_stats_plan_gates_script_data( array( 'premium_analytics' => array( 'has_videopress' => true ) ) );

		$this->assertTrue( $data['premium_analytics']['has_videopress'] );
		$this->assertSame( STATS_TIER_COMMERCIAL, $data['premium_analytics']['plan_gates']['tier'] );
		$this->assertSame( '{}', wp_json_encode( $data['premium_analytics']['plan_gates']['locked_features'] ) );
	}

	/**
	 * Configure registers the injector after the sync tracker's priority-10 overwrite.
	 */
	public function test_configure_registers_the_injector_at_priority_20() {
		configure_stats_plan_gates();

		$this->assertSame( 20, has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_stats_plan_gates_script_data' ) );
	}
}
