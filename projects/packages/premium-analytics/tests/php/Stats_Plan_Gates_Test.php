<?php
/**
 * Tests for the Stats plan gates.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/stats-plan-gates.php';
require_once __DIR__ . '/fixtures/widget-modules-manifest.php';
require_once __DIR__ . '/traits/trait-widget-manifest-fixture.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_plan_tier
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_wpcom_stats_plan_tier
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_jetpack_stats_plan_tier
 * @covers ::Automattic\Jetpack\PremiumAnalytics\has_cached_jetpack_plan
 * @covers ::Automattic\Jetpack\PremiumAnalytics\has_jetpack_stats_commercial_purchase
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_locked_stats_features
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_feature_copy
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_upgrade_url
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_plan_gates
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_stats_plan_gates
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_stats_plan_gates_script_data
 * @covers ::Automattic\Jetpack\PremiumAnalytics\maybe_refresh_jetpack_plan
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_plan_tier' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_wpcom_stats_plan_tier' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_jetpack_stats_plan_tier' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\has_cached_jetpack_plan' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\has_jetpack_stats_commercial_purchase' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_locked_stats_features' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_feature_copy' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_upgrade_url' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_plan_gates' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_stats_plan_gates' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_stats_plan_gates_script_data' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\maybe_refresh_jetpack_plan' )]
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
		remove_all_filters( STATS_PLAN_TIER_FILTER );
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_stats_plan_gates_script_data', 20 );
		remove_action( 'admin_init', __NAMESPACE__ . '\\maybe_refresh_jetpack_plan' );
		remove_all_filters( 'pre_http_request' );
		unset( $_GET['jpa_purchased'], $_GET['page'], $GLOBALS['current_screen'], $GLOBALS['_parent_pages']['stats'] );
		delete_transient( EMPTY_PLAN_REFRESH_TRANSIENT );
		delete_transient( PURCHASE_PLAN_REFRESH_TRANSIENT );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		Stats_Options::set_option( 'enable_odyssey_stats', true );
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
			'security plan is not'     => array( $plan( 'jetpack_security_t1_yearly' ), array(), STATS_TIER_JETPACK_FREE ),
			'stats-commercial feature' => array( array( 'features' => array( 'active' => array( 'stats-commercial' ) ) ), array(), STATS_TIER_COMMERCIAL ),
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
					'jpa/devices'       => 'devices',
					'jpa/locations'     => 'countries',
					'jpa/referrers'     => 'referrers',
					'plugin/top-videos' => 'videos',
				),
			),
		);
	}

	/**
	 * A renamed widget or a misspelled feature would silently unlock a paid widget.
	 */
	public function test_package_plan_features_name_real_widgets_and_lockable_features() {
		$names = array();
		foreach ( glob( dirname( __DIR__, 2 ) . '/widgets/*/widget.json' ) as $file ) {
			$names[] = wp_json_file_decode( $file )->name;
		}
		$lockable = get_locked_stats_features( STATS_TIER_FREE );

		foreach ( WIDGET_TYPE_PLAN_FEATURES as $name => $feature ) {
			$this->assertContains( $name, $names );
			$this->assertContains( $feature, $lockable, $name );
		}
	}

	/**
	 * Tags sits on Traffic among locked cards that each say what they show, so it must not fall back to the generic sentence.
	 */
	public function test_locked_tags_widget_carries_its_own_copy() {
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_FREE );
		$locked = get_stats_plan_gates()['locked_features'][ WIDGET_TYPE_PLAN_FEATURES['jpa/tags'] ];

		$this->assertSame( 'Track the most viewed <link>tags & categories</link>.', $locked['description'] );
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

	public function test_jetpack_upgrade_url_returns_with_the_purchase_flag() {
		$GLOBALS['_parent_pages']['stats'] = false;
		\Jetpack_Options::update_option( 'id', 1234 );
		$url = get_stats_upgrade_url( 'utm', STATS_TIER_JETPACK_FREE );

		$this->assertStringContainsString( 'page=stats#!/stats/purchase/1234?', $url );
		$this->assertStringContainsString( 'productType=commercial', $url );
		$this->assertStringContainsString( rawurlencode( 'jpa_purchased=1' ), $url );
	}

	public function test_jetpack_upgrade_url_is_empty_with_odyssey_stats_off() {
		$GLOBALS['_parent_pages']['stats'] = false;
		Stats_Options::set_option( 'enable_odyssey_stats', false );

		$this->assertSame( '', get_stats_upgrade_url( 'utm', STATS_TIER_JETPACK_FREE ) );
	}

	/**
	 * Without the classic Stats page the feature stays locked, with nowhere to send the reader.
	 */
	public function test_jetpack_upgrade_url_is_empty_without_the_stats_page() {
		update_option( 'jetpack_active_plan', self::FREE_PLAN );

		$this->assertSame( '', get_stats_plan_gates()['locked_features']['utm']['upgrade_url'] );
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

		$_GET['jpa_purchased'] = '1';
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

	public function test_configure_hooks_the_refresh() {
		configure_stats_plan_gates();

		$this->assertNotFalse( has_action( 'admin_init', __NAMESPACE__ . '\\maybe_refresh_jetpack_plan' ) );
	}
}
