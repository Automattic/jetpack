<?php
/**
 * Tests for the Stats plan gates.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/stats-plan-gates.php';
require_once __DIR__ . '/../../src/purchase-success.php';
require_once __DIR__ . '/../../src/dashboard-first-visit.php';
require_once __DIR__ . '/fixtures/widget-modules-manifest.php';
require_once __DIR__ . '/traits/trait-widget-manifest-fixture.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_plan_tier
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_wpcom_stats_plan_tier
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_jetpack_stats_plan_tier
 * @covers ::Automattic\Jetpack\PremiumAnalytics\has_cached_jetpack_plan
 * @covers ::Automattic\Jetpack\PremiumAnalytics\has_jetpack_stats_commercial_purchase
 * @covers ::Automattic\Jetpack\PremiumAnalytics\has_jetpack_stats_product
 * @covers ::Automattic\Jetpack\PremiumAnalytics\offers_free_site_upgrade
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_dashboard_first_visit
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_locked_stats_features
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_feature_copy
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_locked_stats_sections
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_section_copy
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_personal_plan_price
 * @covers ::Automattic\Jetpack\PremiumAnalytics\localize_stats_support_url
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_upgrade_url
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_plan_gates
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_stats_plan_gates
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_stats_plan_gates_script_data
 * @covers ::Automattic\Jetpack\PremiumAnalytics\maybe_refresh_jetpack_plan
 * @covers ::Automattic\Jetpack\PremiumAnalytics\maybe_invalidate_stats_caches
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_plan_tier' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_wpcom_stats_plan_tier' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_jetpack_stats_plan_tier' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\has_cached_jetpack_plan' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\has_jetpack_stats_commercial_purchase' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\has_jetpack_stats_product' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\offers_free_site_upgrade' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_dashboard_first_visit' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_locked_stats_features' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_feature_copy' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_locked_stats_sections' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_section_copy' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_personal_plan_price' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\localize_stats_support_url' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_upgrade_url' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_plan_gates' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_stats_plan_gates' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_stats_plan_gates_script_data' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\maybe_refresh_jetpack_plan' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\maybe_invalidate_stats_caches' )]
class Stats_Plan_Gates_Test extends BaseTestCase {
	use Widget_Manifest_Fixture_Trait;

	/**
	 * A cached plan for a site without a Stats purchase.
	 */
	const FREE_PLAN = array(
		'product_slug' => 'jetpack_free',
		'features'     => array( 'active' => array( 'akismet' ) ),
	);

	/**
	 * Plan refreshes sent to WordPress.com during the test.
	 *
	 * @var int
	 */
	private $plan_requests = 0;

	/**
	 * Plan list requests sent to WordPress.com during the test.
	 *
	 * @var int
	 */
	private $plan_list_requests = 0;

	/**
	 * The timeout the last plan list request carried.
	 *
	 * @var int|null
	 */
	private $plan_list_timeout;

	/**
	 * Host detection memoizes into the status cache, which outlives the constants.
	 */
	public function set_up() {
		parent::set_up();
		Cache::clear();
		$GLOBALS['jpa_test_wpcom_features']  = array();
		$GLOBALS['jpa_test_wpcom_purchases'] = array( array( 'product_slug' => 'business-bundle' ) );

		$this->reset_widget_registry();
		add_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_fixture_widget_manifest' ) );
		$GLOBALS['jpa_test_widget_manifest'] = array(
			array( 'name' => 'jpa/devices' ),
			array( 'name' => 'jpa/locations' ),
			array( 'name' => 'jpa/referrers' ),
			array( 'name' => 'jpa/post-all-time-traffic' ),
			array( 'name' => 'jpa/open-to-all' ),
		);
		add_action( Widget_Type_Registry::REGISTER_ACTION, array( $this, 'register_plugin_widget_type' ), 20 );
	}

	/**
	 * Another plugin's widget type, declaring its plan feature at registration.
	 */
	public function register_plugin_widget_type() {
		register_widget_type( 'plugin/top-videos', array( 'plan_feature' => 'videos' ) );
	}

	/**
	 * Drop the main registry so the next read hydrates from this test's manifest.
	 */
	private function reset_widget_registry() {
		$instance = new \ReflectionProperty( Widget_Type_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
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
		delete_option( DASHBOARD_FIRST_VISIT_OPTION );
		remove_all_filters( STATS_PLAN_TIER_FILTER );
		remove_all_filters( 'locale' );
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_stats_plan_gates_script_data', 20 );
		remove_action( 'admin_init', __NAMESPACE__ . '\\maybe_refresh_jetpack_plan' );
		remove_action( 'admin_init', __NAMESPACE__ . '\\maybe_invalidate_stats_caches' );
		delete_transient( Notices::NOTICES_CACHE_KEY );
		remove_all_filters( 'pre_http_request' );
		unset( $_GET['statsPurchaseSuccess'], $_GET['page'], $GLOBALS['current_screen'] );
		delete_transient( EMPTY_PLAN_REFRESH_TRANSIENT );
		delete_transient( PURCHASE_PLAN_REFRESH_TRANSIENT );
		delete_transient( PURCHASE_CACHE_INVALIDATION_TRANSIENT );
		delete_transient( PERSONAL_PLAN_PRICE_TRANSIENT . get_current_user_id() );
		wp_set_current_user( 0 );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token', 'user_tokens' ) );
		remove_filter( 'jetpack_premium_analytics_widgets_manifest_path', array( $this, 'use_fixture_widget_manifest' ) );
		remove_action( Widget_Type_Registry::REGISTER_ACTION, array( $this, 'register_plugin_widget_type' ), 20 );
		unset( $GLOBALS['jpa_test_widget_manifest'] );
		$this->reset_widget_registry();
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
	 * Feature sets and the tier each resolves to; one Atomic row pins its platform detection.
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
		);
		$data  = array();
		foreach ( $cases as $name => $case ) {
			$data[ "simple: $name" ] = array( 'simple', $case[0], $case[1] );
		}
		$data['atomic: commercial wins'] = array( 'atomic', $cases['commercial wins'][0], STATS_TIER_COMMERCIAL );
		return $data;
	}

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
		$products = static fn( $slug ) => array( array( 'product_slug' => $slug ) );
		$plan     = static fn( $slug ) => array_merge( self::FREE_PLAN, array( 'product_slug' => $slug ) );

		return array(
			'empty cache is unknown'   => array( array(), array(), STATS_TIER_UNKNOWN ),
			'non-array cache'          => array( 'garbage', 'garbage', STATS_TIER_UNKNOWN ),
			'no active features'       => array( array_merge( self::FREE_PLAN, array( 'features' => array( 'active' => array() ) ) ), array(), STATS_TIER_UNKNOWN ),
			'cached free plan'         => array( self::FREE_PLAN, array(), STATS_TIER_JETPACK_FREE ),
			'malformed products'       => array( self::FREE_PLAN, 'garbage', STATS_TIER_JETPACK_FREE ),
			'stats yearly product'     => array( self::FREE_PLAN, $products( 'jetpack_stats_yearly' ), STATS_TIER_COMMERCIAL ),
			'stats PWYW is not'        => array( self::FREE_PLAN, $products( 'jetpack_stats_pwyw_yearly' ), STATS_TIER_JETPACK_FREE ),
			'complete plan'            => array( $plan( 'jetpack_complete_monthly' ), array(), STATS_TIER_COMMERCIAL ),
			'growth plan'              => array( $plan( 'jetpack_growth_yearly' ), array(), STATS_TIER_COMMERCIAL ),
			'pro plan'                 => array( $plan( 'jetpack_pro_yearly' ), array(), STATS_TIER_COMMERCIAL ),
			'pro bi-yearly plan'       => array( $plan( 'jetpack_pro_bi_yearly' ), array(), STATS_TIER_COMMERCIAL ),
			'security plan is not'     => array( $plan( 'jetpack_security_t1_yearly' ), array(), STATS_TIER_JETPACK_FREE ),
			'stats-commercial feature' => array( array( 'features' => array( 'active' => array( 'stats-commercial' ) ) ), array(), STATS_TIER_COMMERCIAL ),
		);
	}

	/**
	 * A site without paid Stats is offered a plan from 30 days after its first dashboard load.
	 *
	 * @dataProvider provide_free_site_upgrade_offers
	 *
	 * @param string   $tier     The Stats plan tier.
	 * @param int|null $days_ago Days since the first dashboard load, or null for none yet.
	 * @param bool     $expected Whether the plan is offered.
	 */
	#[DataProvider( 'provide_free_site_upgrade_offers' )]
	public function test_free_site_upgrade_follows_tier_and_first_visit( $tier, $days_ago, $expected ) {
		if ( null !== $days_ago ) {
			update_option( DASHBOARD_FIRST_VISIT_OPTION, time() - $days_ago * DAY_IN_SECONDS );
		}

		$this->assertSame( $expected, offers_free_site_upgrade( $tier ) );
	}

	/**
	 * Tiers and first-visit ages, and whether each is offered a plan.
	 *
	 * @return array
	 */
	public static function provide_free_site_upgrade_offers() {
		return array(
			'Jetpack free on day 30' => array( STATS_TIER_JETPACK_FREE, 30, true ),
			'Jetpack free on day 29' => array( STATS_TIER_JETPACK_FREE, 29, false ),
			'no dashboard load yet'  => array( STATS_TIER_JETPACK_FREE, null, false ),
			'WordPress.com free'     => array( STATS_TIER_FREE, 31, false ),
			'legacy free'            => array( STATS_TIER_LEGACY_FREE, 31, true ),
			'legacy basic'           => array( STATS_TIER_LEGACY_BASIC, 31, true ),
			'paid'                   => array( STATS_TIER_PAID, 31, false ),
			'commercial'             => array( STATS_TIER_COMMERCIAL, 31, false ),
			'plan not synced'        => array( STATS_TIER_UNKNOWN, 31, false ),
		);
	}

	/**
	 * Stats counts PWYW as paid and stops its upgrade prompts, while the free Stats product still gets the offer.
	 *
	 * @dataProvider provide_free_site_upgrade_products
	 *
	 * @param string $slug     The site's Stats product.
	 * @param bool   $expected Whether the plan is offered.
	 */
	#[DataProvider( 'provide_free_site_upgrade_products' )]
	public function test_free_site_upgrade_follows_stats_product( $slug, $expected ) {
		update_option( 'jetpack_active_plan', self::FREE_PLAN );
		update_option( 'jetpack_site_products', array( array( 'product_slug' => $slug ) ) );
		update_option( DASHBOARD_FIRST_VISIT_OPTION, time() - 31 * DAY_IN_SECONDS );

		$this->assertSame( $expected, offers_free_site_upgrade( STATS_TIER_JETPACK_FREE ) );
	}

	/**
	 * Stats products and whether each is offered a plan.
	 *
	 * @return array
	 */
	public static function provide_free_site_upgrade_products() {
		return array(
			'PWYW Stats' => array( 'jetpack_stats_pwyw_yearly', false ),
			'free Stats' => array( 'jetpack_stats_free_yearly', true ),
		);
	}

	/**
	 * Simple keeps the upgrade rules of its own, so the dashboard does not offer it.
	 */
	public function test_free_site_upgrade_is_not_offered_on_simple() {
		$this->set_wpcom_platform( 'simple' );
		update_option( DASHBOARD_FIRST_VISIT_OPTION, time() - 31 * DAY_IN_SECONDS );

		$this->assertFalse( offers_free_site_upgrade( STATS_TIER_LEGACY_FREE ) );
	}

	/**
	 * The free and PWYW Stats products count as a Stats product; other Jetpack products do not.
	 *
	 * @dataProvider provide_stats_products
	 *
	 * @param mixed $plan     The `jetpack_active_plan` option.
	 * @param mixed $products The `jetpack_site_products` option.
	 * @param bool  $expected Whether the site has a Stats product.
	 */
	#[DataProvider( 'provide_stats_products' )]
	public function test_stats_product_follows_purchases( $plan, $products, $expected ) {
		update_option( 'jetpack_active_plan', $plan );
		update_option( 'jetpack_site_products', $products );

		$this->assertSame( $expected, has_jetpack_stats_product() );
	}

	/**
	 * Purchase states and whether each holds a Stats product.
	 *
	 * @return array
	 */
	public static function provide_stats_products() {
		$products = static fn( $slug ) => array( array( 'product_slug' => $slug ) );

		return array(
			'no products'          => array( self::FREE_PLAN, array(), false ),
			'malformed products'   => array( self::FREE_PLAN, 'garbage', false ),
			'free Stats'           => array( self::FREE_PLAN, $products( 'jetpack_stats_free_yearly' ), true ),
			'PWYW Stats'           => array( self::FREE_PLAN, $products( 'jetpack_stats_pwyw_yearly' ), true ),
			'another product only' => array( self::FREE_PLAN, $products( 'jetpack_backup_t1_yearly' ), false ),
		);
	}

	public function test_vip_is_commercial() {
		Constants::set_constant( 'WPCOM_IS_VIP_ENV', true );

		$this->assertSame( STATS_TIER_COMMERCIAL, get_stats_plan_tier() );
	}

	public function test_an_unrecognized_filtered_tier_keeps_the_computed_one() {
		$this->set_wpcom_platform( 'simple' );
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => 'Paid' );
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );

		$this->assertSame( STATS_TIER_FREE, get_stats_plan_tier() );
	}

	/**
	 * Each tier locks exactly classic Stats' set; features without a widget, like regions or the 7-day limit, have no other test.
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
			'free'         => array( STATS_TIER_FREE, array_merge( $commercial, array( 'top-posts', 'referrers', 'countries', 'clicks', 'file-downloads', 'insights', 'tags', 'csv', 'intervals', 'long-date-presets', 'recent-7-days' ) ) ),
		);
	}

	/**
	 * The author and video detail pages apply no date limits, so every tier that limits dates must lock them.
	 */
	public function test_a_date_limited_tier_locks_the_author_and_video_reports() {
		$date_limited = array_filter(
			STATS_TIERS,
			static fn( $tier ) => (bool) array_intersect( array( 'recent-7-days', 'long-date-presets' ), get_locked_stats_features( $tier ) )
		);
		$this->assertNotEmpty( $date_limited );

		foreach ( $date_limited as $tier ) {
			$this->assertEmpty( array_diff( array( 'authors', 'videos' ), get_locked_stats_features( $tier ) ), $tier );
		}
	}

	/**
	 * A widget type locks when its registered plan feature does, whichever plugin registered it.
	 *
	 * @dataProvider provide_locked_widget_types
	 *
	 * @param string   $tier     Tier.
	 * @param string[] $expected Locked widget types and their features.
	 */
	#[DataProvider( 'provide_locked_widget_types' )]
	public function test_locked_widget_types_follow_the_registered_plan_features( $tier, $expected ) {
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => $tier );

		$locked = get_stats_plan_gates()['locked_widget_types'];
		ksort( $locked );

		$this->assertSame( $expected, $locked );
	}

	/**
	 * Tiers and the staged widget types they lock.
	 *
	 * @return array
	 */
	public static function provide_locked_widget_types() {
		return array(
			'commercial'                       => array( STATS_TIER_COMMERCIAL, array() ),
			'legacy free locks only advanced'  => array( STATS_TIER_LEGACY_FREE, array( 'jpa/devices' => 'devices' ) ),
			'jetpack free locks only advanced' => array( STATS_TIER_JETPACK_FREE, array( 'jpa/devices' => 'devices' ) ),
			'legacy basic keeps countries'     => array(
				STATS_TIER_LEGACY_BASIC,
				array(
					'jpa/devices'       => 'devices',
					'jpa/referrers'     => 'referrers',
					'plugin/top-videos' => 'videos',
				),
			),
			'paid keeps countries'             => array(
				STATS_TIER_PAID,
				array(
					'jpa/devices'       => 'devices',
					'plugin/top-videos' => 'videos',
				),
			),
			'free locks the whole widget'      => array(
				STATS_TIER_FREE,
				array(
					'jpa/devices'               => 'devices',
					'jpa/locations'             => 'countries',
					'jpa/post-all-time-traffic' => 'recent-7-days',
					'jpa/referrers'             => 'referrers',
					'plugin/top-videos'         => 'videos',
				),
			),
		);
	}

	/**
	 * A renamed widget or a misspelled feature would silently unlock a paid widget.
	 */
	public function test_package_plan_features_name_real_widgets_and_lockable_features() {
		$names    = $this->package_widget_names();
		$lockable = get_locked_stats_features( STATS_TIER_FREE );

		foreach ( WIDGET_TYPE_PLAN_FEATURES as $name => $feature ) {
			$this->assertContains( $name, $names );
			$this->assertContains( $feature, $lockable, $name );
		}
	}

	/**
	 * The names of the widgets this package ships.
	 *
	 * @return string[]
	 */
	private function package_widget_names() {
		$names = array();
		foreach ( glob( dirname( __DIR__, 2 ) . '/widgets/*/widget.json' ) as $file ) {
			$names[] = wp_json_file_decode( $file )->name;
		}
		return $names;
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

	public function test_jetpack_upgrade_url_opens_the_dashboard_upgrade_page() {
		update_option( 'jetpack_active_plan', self::FREE_PLAN );

		$this->assertSame(
			admin_url( 'admin.php?page=jetpack-premium-analytics-wp-admin&p=' . rawurlencode( '/upgrade?source=jetpack-premium-analytics-locked-feature' ) ),
			get_stats_plan_gates()['locked_features']['utm']['upgrade_url']
		);
	}

	/**
	 * Each locked feature carries its own sentence and support page; one without its own gets the generic sentence.
	 *
	 * @dataProvider provide_locked_feature_copy
	 *
	 * @param string $feature     Locked feature.
	 * @param string $description Expected sentence.
	 * @param string $support_url Expected support page.
	 */
	#[DataProvider( 'provide_locked_feature_copy' )]
	public function test_locked_features_carry_their_copy( $feature, $description, $support_url ) {
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_FREE );
		$locked = get_stats_plan_gates()['locked_features'][ $feature ];

		$this->assertSame( $description, $locked['description'] );
		$this->assertSame( $support_url, $locked['support_url'] );
	}

	/**
	 * Locked features and their copy.
	 *
	 * @return array
	 */
	public static function provide_locked_feature_copy() {
		return array(
			'own copy'     => array( 'utm', 'Generate UTM parameters and track your <link>campaign performance data</link>.', 'https://jetpack.com/support/jetpack-stats/traffic-dashboard/#harnessing-utm-stats-for-precision-tracking' ),
			'generic copy' => array( 'insights', 'Upgrade your plan to unlock Jetpack Stats.', '' ),
			// Keyed through the card's mapping, which no other test fails on if it reverts to insights.
			'tags card'    => array( WIDGET_TYPE_PLAN_FEATURES['jpa/tags'], 'Track the most viewed <link>tags & categories</link>.', 'https://wordpress.com/support/stats/learn-insights-about-your-website/#all-time-insights' ),
			'intervals'    => array( 'intervals', 'Group your charts by week, month or year.', '' ),
		);
	}

	/**
	 * The gates link the user's language to a WordPress.com page.
	 */
	public function test_locked_features_link_wpcom_support_in_the_user_language() {
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_FREE );
		add_filter( 'locale', static fn() => 'zh_TW' );

		$this->assertSame(
			'https://wordpress.com/zh-tw/support/stats/analyze-content-performance/#track-file-downloads',
			get_stats_plan_gates()['locked_features']['file-downloads']['support_url']
		);
	}

	/**
	 * Only a free site loses whole sections.
	 *
	 * @dataProvider provide_locked_sections
	 *
	 * @param string   $tier     Tier.
	 * @param string[] $expected Locked sections.
	 */
	#[DataProvider( 'provide_locked_sections' )]
	public function test_each_tier_locks_classic_stats_sections( $tier, $expected ) {
		$this->assertSame( $expected, get_locked_stats_sections( $tier ) );
	}

	/**
	 * Tiers and their locked sections.
	 *
	 * @return array
	 */
	public static function provide_locked_sections() {
		return array(
			'free'         => array( STATS_TIER_FREE, array( 'traffic', 'insights' ) ),
			'paid'         => array( STATS_TIER_PAID, array() ),
			'commercial'   => array( STATS_TIER_COMMERCIAL, array() ),
			'legacy free'  => array( STATS_TIER_LEGACY_FREE, array() ),
			'legacy basic' => array( STATS_TIER_LEGACY_BASIC, array() ),
			'jetpack free' => array( STATS_TIER_JETPACK_FREE, array() ),
			'unknown'      => array( STATS_TIER_UNKNOWN, array() ),
		);
	}

	/**
	 * Each locked section carries classic Stats' upsell copy and the Personal checkout.
	 */
	public function test_locked_sections_carry_v1_copy() {
		$this->set_wpcom_platform( 'simple' );
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_FREE );
		$sections = get_stats_plan_gates()['locked_sections'];

		$this->assertSame( array( 'traffic', 'insights' ), array_keys( $sections ) );
		$this->assertSame( 'Unlock site growth analytics', $sections['traffic']['title'] );
		$this->assertSame( 'Unlock site insights', $sections['insights']['title'] );
		$this->assertSame( 'View trends and data from any time period', $sections['traffic']['features'][0] );
		$this->assertSame( 'Monitor your posting activity', $sections['insights']['features'][0] );
		$this->assertSame( array( 'jpa/traffic-chart' ), $sections['traffic']['open_widget_types'] );
		$this->assertSame( array(), $sections['insights']['open_widget_types'] );
		// A renamed widget would otherwise hide the chart on every free site.
		$this->assertContains( 'jpa/traffic-chart', $this->package_widget_names() );

		foreach ( $sections as $section ) {
			$this->assertCount( 11, $section['features'] );
			$this->assertSame( 'Get detailed insights into your site’s performance with a Personal plan.', $section['description'] );
			$this->assertSame( 'Get detailed insights into your site’s performance for <strong>%s/month</strong> with a Personal plan.', $section['description_with_price'] );
			$this->assertSame( 'Upgrade to Personal', $section['upgrade_label'] );
			$this->assertSame( 'Show all Personal features', $section['expand_label'] );
			$this->assertSame( 'https://wordpress.com/support/stats/', $section['support_url'] );
			$this->assertStringContainsString( '/personal?redirect_to=', $section['upgrade_url'] );
		}
	}

	/**
	 * Connect a user and answer WordPress.com's plan list with the given Personal plan.
	 *
	 * @param array|null|\WP_Error $personal The Personal plan's fields, null to leave it out, or a failed request.
	 */
	private function answer_plan_list_with( $personal ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'plan_price_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => "user_token.secret.$user_id" ) );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $personal ) {
				if ( false === strpos( $url, '/rest/v1.5/plans' ) ) {
					return $preempt;
				}
				++$this->plan_list_requests;
				$this->plan_list_timeout = $args['timeout'];
				if ( is_wp_error( $personal ) ) {
					return $personal;
				}
				$plans = array( array( 'product_slug' => 'free_plan' ) );
				if ( null !== $personal ) {
					$plans[] = array( 'product_slug' => 'personal-bundle' ) + $personal;
				}
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( $plans, JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * A locked section carries the Personal plan's yearly price, or null when WordPress.com gives none, and a reload reuses either answer.
	 *
	 * @dataProvider provide_personal_plan_prices
	 *
	 * @param array|null|\WP_Error $personal The Personal plan's fields.
	 * @param array|null           $expected The section's price.
	 */
	#[DataProvider( 'provide_personal_plan_prices' )]
	public function test_locked_sections_carry_the_personal_plan_price( $personal, $expected ) {
		$this->answer_plan_list_with( $personal );
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_FREE );

		for ( $load = 1; $load <= 2; $load++ ) {
			foreach ( get_stats_plan_gates()['locked_sections'] as $section ) {
				$this->assertSame( $expected, $section['plan_price'], "Load $load" );
			}
		}
		$this->assertSame( 1, $this->plan_list_requests );
		$this->assertSame( 5, $this->plan_list_timeout );
	}

	/**
	 * Plan list answers and the price a section carries.
	 *
	 * @return array
	 */
	public static function provide_personal_plan_prices() {
		return array(
			'priced'        => array(
				array(
					'raw_price_integer' => 156000,
					'currency_code'     => 'TWD',
				),
				array(
					'yearly'   => 156000,
					'currency' => 'TWD',
				),
			),
			'missing plan'  => array( null, null ),
			'no currency'   => array( array( 'raw_price_integer' => 4800 ), null ),
			'zero price'    => array(
				array(
					'raw_price_integer' => 0,
					'currency_code'     => 'USD',
				),
				null,
			),
			'request fails' => array( new \WP_Error( 'http_request_failed', 'Operation timed out' ), null ),
		);
	}

	/**
	 * A tier without locked sections never asks WordPress.com for the price.
	 */
	public function test_a_tier_without_locked_sections_never_asks_for_the_price() {
		$this->answer_plan_list_with(
			array(
				'raw_price_integer' => 4800,
				'currency_code'     => 'USD',
			)
		);
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_PAID );
		get_stats_plan_gates();
		$this->assertSame( 0, $this->plan_list_requests );
	}

	/**
	 * Only a WordPress.com support URL moves, and only to a language its support site has.
	 *
	 * @dataProvider provide_support_url_localization
	 *
	 * @param string $locale   The user's locale.
	 * @param string $url      English support URL.
	 * @param string $expected Linked URL.
	 */
	#[DataProvider( 'provide_support_url_localization' )]
	public function test_support_url_follows_the_user_locale( $locale, $url, $expected ) {
		add_filter( 'locale', static fn() => $locale );

		$this->assertSame( $expected, localize_stats_support_url( $url ) );
	}

	/**
	 * Locales and URLs, localized or left in English.
	 *
	 * @return array
	 */
	public static function provide_support_url_localization() {
		$wpcom   = 'https://wordpress.com/support/stats/analyze-content-performance/#track-file-downloads';
		$jetpack = 'https://jetpack.com/support/jetpack-stats/traffic-dashboard/#devices-stats';

		return array(
			'region kept'          => array( 'pt_BR', $wpcom, 'https://wordpress.com/pt-br/support/stats/analyze-content-performance/#track-file-downloads' ),
			'region dropped'       => array( 'de_DE_formal', $wpcom, 'https://wordpress.com/de/support/stats/analyze-content-performance/#track-file-downloads' ),
			'no stats translation' => array( 'hi_IN', $wpcom, $wpcom ),
			'english'              => array( 'en_US', $wpcom, $wpcom ),
			'jetpack.com'          => array( 'zh_TW', $jetpack, $jetpack ),
		);
	}

	/**
	 * The gates ride along with the rest of the script data, as objects even when empty.
	 */
	public function test_script_data_carries_the_gates_without_clobbering_siblings() {
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_COMMERCIAL );
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );

		$data = inject_stats_plan_gates_script_data( array( 'premium_analytics' => array( 'has_videopress' => true ) ) );

		$this->assertTrue( $data['premium_analytics']['has_videopress'] );
		$this->assertSame( STATS_TIER_COMMERCIAL, $data['premium_analytics']['plan_gates']['tier'] );
		$this->assertSame( '{}', wp_json_encode( $data['premium_analytics']['plan_gates']['locked_features'], JSON_UNESCAPED_SLASHES ) );
		$this->assertSame( '{}', wp_json_encode( $data['premium_analytics']['plan_gates']['locked_sections'], JSON_UNESCAPED_SLASHES ) );
		$this->assertNull( $data['premium_analytics']['plan_gates']['free_site_upgrade'] );
	}

	/**
	 * The offer carries the upgrade page URL, credited to the banner, and whether the site has a Stats product for its title.
	 */
	public function test_script_data_offers_the_free_site_upgrade_with_its_upgrade_url() {
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_JETPACK_FREE );
		update_option( DASHBOARD_FIRST_VISIT_OPTION, time() - 31 * DAY_IN_SECONDS );
		update_option( 'jetpack_site_products', array( array( 'product_slug' => 'jetpack_stats_free_yearly' ) ) );
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );

		$data = inject_stats_plan_gates_script_data( array() );

		$this->assertSame(
			admin_url( 'admin.php?page=jetpack-premium-analytics-wp-admin&p=' . rawurlencode( '/upgrade?source=jetpack-premium-analytics-free-site-upgrade-notice' ) ),
			$data['premium_analytics']['plan_gates']['free_site_upgrade']['upgrade_url']
		);
		$this->assertTrue( $data['premium_analytics']['plan_gates']['free_site_upgrade']['has_stats_product'] );
	}

	/**
	 * Other admin pages print script data too, and must not pay for the registry.
	 */
	public function test_script_data_is_left_alone_off_the_dashboard() {
		$_GET['page'] = 'jetpack';
		set_current_screen( 'toplevel_page_jetpack' );

		$this->assertSame( array( 'premium_analytics' => array() ), inject_stats_plan_gates_script_data( array( 'premium_analytics' => array() ) ) );
	}

	/**
	 * Configure registers the injector after the sync tracker's priority-10 overwrite.
	 */
	public function test_configure_registers_the_injector_at_priority_20() {
		configure_stats_plan_gates();

		$this->assertSame( 20, has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_stats_plan_gates_script_data' ) );
	}

	/**
	 * Serve the dashboard page with a connected site whose plan fetches are counted.
	 *
	 * @param array|\WP_Error|null $response What WordPress.com answers; a free plan when null.
	 */
	private function open_dashboard_with_counted_plan_fetches( $response = null ) {
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );

		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $response ) {
				if ( false === strpos( $url, '/sites/1234' ) ) {
					return $preempt;
				}
				++$this->plan_requests;
				return $response ?? array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( array( 'plan' => self::FREE_PLAN ), JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	public function test_empty_plan_cache_is_refreshed_once_on_the_dashboard() {
		$this->open_dashboard_with_counted_plan_fetches();
		$this->assertSame( STATS_TIER_UNKNOWN, get_stats_plan_tier() );

		maybe_refresh_jetpack_plan();
		delete_option( 'jetpack_active_plan' );
		maybe_refresh_jetpack_plan();

		$this->assertSame( 1, $this->plan_requests, 'A second empty read within the window does not fetch again.' );
	}

	public function test_a_failed_refresh_is_throttled_and_leaves_the_tier_unknown() {
		$this->open_dashboard_with_counted_plan_fetches( new \WP_Error( 'http_request_failed', 'Operation timed out' ) );

		maybe_refresh_jetpack_plan();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- The second load is the throttle under test.
		maybe_refresh_jetpack_plan();

		$this->assertSame( 1, $this->plan_requests );
		$this->assertSame( STATS_TIER_UNKNOWN, get_stats_plan_tier() );
	}

	public function test_unconnected_visit_does_not_throttle_the_refresh_after_connecting() {
		$this->open_dashboard_with_counted_plan_fetches();
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		( new Connection_Manager() )->reset_connection_status();
		maybe_refresh_jetpack_plan();

		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();
		maybe_refresh_jetpack_plan();

		$this->assertSame( STATS_TIER_JETPACK_FREE, get_stats_plan_tier() );
	}

	public function test_refreshed_plan_feeds_the_tier() {
		$this->open_dashboard_with_counted_plan_fetches();

		maybe_refresh_jetpack_plan();

		$this->assertSame( STATS_TIER_JETPACK_FREE, get_stats_plan_tier() );
	}

	/**
	 * Coming back from checkout refreshes again, even right after the empty-cache refresh.
	 */
	public function test_purchase_return_refreshes_after_an_empty_cache_refresh() {
		$this->open_dashboard_with_counted_plan_fetches();
		maybe_refresh_jetpack_plan();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- The second load is the throttle under test.
		maybe_refresh_jetpack_plan();
		$this->assertSame( 1, $this->plan_requests, 'A cached plan is left alone.' );

		$_GET['statsPurchaseSuccess'] = 'paid';
		maybe_refresh_jetpack_plan();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- The second load is the throttle under test.
		maybe_refresh_jetpack_plan();
		$this->assertSame( 2, $this->plan_requests, 'One fetch per purchase return.' );
	}

	public function test_no_refresh_off_the_dashboard_or_on_wpcom() {
		$this->open_dashboard_with_counted_plan_fetches();
		$this->set_wpcom_platform( 'simple' );
		maybe_refresh_jetpack_plan();

		Constants::clear_single_constant( 'IS_WPCOM' );
		Cache::clear();
		$_GET['page'] = 'jetpack';
		maybe_refresh_jetpack_plan();

		$this->assertSame( 0, $this->plan_requests );
	}

	public function test_purchase_return_drops_the_cached_stats_replies() {
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );
		set_transient( Notices::NOTICES_CACHE_KEY, '{}', MINUTE_IN_SECONDS );

		maybe_invalidate_stats_caches();
		$this->assertNotFalse( get_transient( Notices::NOTICES_CACHE_KEY ), 'A plain dashboard load keeps the caches.' );
		$this->assertFalse( get_option( 'jetpack_premium_analytics_proxy_cache_generations' ) );

		$_GET['statsPurchaseSuccess'] = 'free';
		maybe_invalidate_stats_caches();
		$this->assertFalse( get_transient( Notices::NOTICES_CACHE_KEY ) );
		$this->assertSame( array( '*' => 1 ), get_option( 'jetpack_premium_analytics_proxy_cache_generations' ) );

		set_transient( Notices::NOTICES_CACHE_KEY, '{}', MINUTE_IN_SECONDS );
		maybe_invalidate_stats_caches();
		$this->assertNotFalse( get_transient( Notices::NOTICES_CACHE_KEY ), 'A second return within the window keeps the caches.' );
		$this->assertSame( array( '*' => 1 ), get_option( 'jetpack_premium_analytics_proxy_cache_generations' ) );
	}

	/**
	 * @dataProvider provide_purchase_returns_that_keep_the_caches
	 *
	 * @param string      $page     The admin page loaded.
	 * @param string|null $platform `simple`, or null for a self-hosted site.
	 */
	#[DataProvider( 'provide_purchase_returns_that_keep_the_caches' )]
	public function test_purchase_return_keeps_the_caches_off_the_dashboard_or_on_simple( $page, $platform ) {
		$_GET['page']                 = $page;
		$_GET['statsPurchaseSuccess'] = 'paid';
		set_current_screen( 'toplevel_page_' . $page );
		if ( $platform ) {
			$this->set_wpcom_platform( $platform );
		}
		set_transient( Notices::NOTICES_CACHE_KEY, '{}', MINUTE_IN_SECONDS );

		maybe_invalidate_stats_caches();

		$this->assertNotFalse( get_transient( Notices::NOTICES_CACHE_KEY ) );
		$this->assertFalse( get_option( 'jetpack_premium_analytics_proxy_cache_generations' ) );
	}

	/**
	 * @return array<string, array{0: string, 1: string|null}>
	 */
	public static function provide_purchase_returns_that_keep_the_caches() {
		return array(
			'off the dashboard' => array( 'jetpack', null ),
			'on Simple'         => array( Analytics::MENU_PAGE_SLUG, 'simple' ),
		);
	}

	public function test_configure_hooks_the_purchase_return() {
		configure_stats_plan_gates();

		$this->assertNotFalse( has_action( 'admin_init', __NAMESPACE__ . '\\maybe_refresh_jetpack_plan' ) );
		$this->assertNotFalse( has_action( 'admin_init', __NAMESPACE__ . '\\maybe_invalidate_stats_caches' ) );
	}
}
