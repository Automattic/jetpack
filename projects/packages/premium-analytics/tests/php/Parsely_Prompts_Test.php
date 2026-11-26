<?php
/**
 * Tests for the Upgrade to Parse.ly prompt eligibility.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;

require_once __DIR__ . '/../../src/stats-plan-gates.php';
require_once __DIR__ . '/../../src/parsely-prompts.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\offers_parsely_prompts
 * @covers ::Automattic\Jetpack\PremiumAnalytics\has_parsely_integration
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_monthly_stats_views
 * @covers ::Automattic\Jetpack\PremiumAnalytics\fetch_monthly_stats_views
 * @covers ::Automattic\Jetpack\PremiumAnalytics\quietest_monthly_views
 * @covers Automattic\Jetpack\PremiumAnalytics\Parsely_Prompts
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_parsely_prompts
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_parsely_prompts_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\offers_parsely_prompts' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\has_parsely_integration' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_monthly_stats_views' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\fetch_monthly_stats_views' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\quietest_monthly_views' )]
#[CoversClass( Parsely_Prompts::class )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_parsely_prompts' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_parsely_prompts_script_data' )]
class Parsely_Prompts_Test extends BaseTestCase {

	/**
	 * Stats usage requests sent to WordPress.com during the test.
	 *
	 * @var int
	 */
	private $usage_requests = 0;

	/**
	 * The arguments the last Stats usage request was sent with.
	 *
	 * @var array
	 */
	private $usage_request_args = array();

	/**
	 * Every test starts from a site that qualifies, and switches off one condition at a time.
	 */
	public function set_up() {
		parent::set_up();
		Cache::clear();
		// The registry is static, so without this a test could read a flag an earlier one registered.
		Feature_Flags::reset();

		$user_id = wp_insert_user(
			array(
				'user_login' => 'parsely_prompts_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		add_filter( 'jetpack_feature_flag_enabled_' . Parsely_Prompts::FLAG, '__return_true' );
		add_filter( STATS_PLAN_TIER_FILTER, array( $this, 'return_commercial_tier' ) );

		// Defeat the stats client's own cache, so the request counts below answer for this file's cache alone.
		add_filter( 'jetpack_fetch_stats_cache_expiration', array( $this, 'expire_stats_cache_at_once' ) );

		$this->usage_requests     = 0;
		$this->usage_request_args = array();
	}

	/**
	 * Reset everything the tests reach outside their own scope.
	 */
	public function tear_down() {
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Parsely_Prompts::FLAG );
		remove_all_filters( STATS_PLAN_TIER_FILTER );
		remove_all_filters( OFFERS_PARSELY_PROMPTS_FILTER );
		remove_all_filters( 'jetpack_fetch_stats_cache_expiration' );
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_parsely_prompts_script_data', 20 );
		unset( $_GET['page'], $GLOBALS['current_screen'], $GLOBALS['parsely'] );
		delete_transient( PARSELY_PROMPTS_VIEWS_TRANSIENT );
		delete_option( 'parsely' );
		wp_set_current_user( 0 );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		Constants::clear_constants();
		Cache::clear();
		parent::tear_down();
	}

	/**
	 * The qualifying tier, for the plan tier filter.
	 *
	 * @return string
	 */
	public function return_commercial_tier() {
		return STATS_TIER_COMMERCIAL;
	}

	/**
	 * An already-expired stats cache, for the expiration filter.
	 *
	 * @return int
	 */
	public function expire_stats_cache_at_once() {
		return -1;
	}

	/**
	 * Answer the Stats usage endpoint, counting the requests it receives.
	 *
	 * @param array|string|WP_Error $response The payload WordPress.com answers with, or a failed request.
	 */
	private function answer_stats_usage_with( $response ) {
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $response ) {
				if ( false === strpos( $url, '/jetpack-stats/usage' ) ) {
					return $preempt;
				}

				++$this->usage_requests;
				$this->usage_request_args = $args;

				if ( is_wp_error( $response ) ) {
					return $response;
				}

				return array(
					'response' => array( 'code' => 200 ),
					'body'     => wp_json_encode( $response, JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * A usage payload whose recent whole months each got the given views.
	 *
	 * @param mixed $views The views each whole month got.
	 * @return array
	 */
	private static function usage_with_views( $views ) {
		return self::usage_with_monthly_views( array( $views, $views ) );
	}

	/**
	 * A usage payload shaped like the live one: `recent_usages` carries the closed periods, most
	 * recent first, and the period in progress is in `current_usage` alone, with a count far below
	 * the threshold so that folding it into the figure would refuse the site.
	 * `billable_monthly_views` is 0, as it is for a site whose plan already covers its traffic, so a
	 * gate reading that offers nothing.
	 *
	 * @param array $monthly_views The views each closed period got.
	 * @return array
	 */
	private static function usage_with_monthly_views( array $monthly_views ) {
		$months = array();

		foreach ( $monthly_views as $index => $views ) {
			$months[] = array(
				'current_start' => sprintf( '2026-%02d-26', 9 - $index ),
				'next_start'    => sprintf( '2026-%02d-26', 10 - $index ),
				'views_count'   => $views,
				'days_to_reset' => 30 * ( $index + 1 ),
			);
		}

		return array(
			'billable_monthly_views' => 0,
			'current_usage'          => array(
				'current_start' => '2026-10-26',
				'next_start'    => '2026-11-26',
				'views_count'   => 1,
				'days_to_reset' => 1,
			),
			'recent_usages'          => $months,
		);
	}

	public function test_eligible_site_offers_the_prompts() {
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertTrue( offers_parsely_prompts() );
		$this->assertSame( 1, $this->usage_requests, 'The answer came from the mocked payload.' );
	}

	/**
	 * The lookup runs in front of a dashboard render, so it must not wait the client's own 20
	 * seconds on a slow WordPress.com.
	 */
	public function test_the_views_lookup_caps_its_wait() {
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		offers_parsely_prompts();

		$this->assertSame( 5, $this->usage_request_args['timeout'] );
	}

	public function test_the_views_figure_is_cached() {
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$first  = offers_parsely_prompts();
		$second = offers_parsely_prompts();

		$this->assertSame( $first, $second );
		$this->assertSame( 1, $this->usage_requests );
	}

	public function test_a_failed_lookup_is_cached_too() {
		$this->answer_stats_usage_with( new WP_Error( 'no_possible_tokens', 'The site has no blog token.' ) );

		$first  = offers_parsely_prompts();
		$second = offers_parsely_prompts();

		$this->assertSame( $first, $second );
		$this->assertSame( 1, $this->usage_requests );
	}

	public function test_a_failed_lookup_is_retried_sooner_than_an_answer() {
		$this->answer_stats_usage_with( new WP_Error( 'api_error', 'WordPress.com is unavailable.' ) );

		offers_parsely_prompts();
		$timeout = (int) get_option( '_transient_timeout_' . PARSELY_PROMPTS_VIEWS_TRANSIENT );

		$this->assertGreaterThan( time(), $timeout );
		$this->assertLessThanOrEqual( time() + PARSELY_PROMPTS_VIEWS_RETRY_TTL, $timeout );
	}

	public function test_an_answer_stands_longer_than_a_failure() {
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		offers_parsely_prompts();
		$timeout = (int) get_option( '_transient_timeout_' . PARSELY_PROMPTS_VIEWS_TRANSIENT );

		$this->assertGreaterThan( time() + PARSELY_PROMPTS_VIEWS_RETRY_TTL, $timeout );
		$this->assertLessThanOrEqual( time() + PARSELY_PROMPTS_VIEWS_TTL, $timeout );
	}

	public function test_a_cache_of_another_shape_is_refetched() {
		set_transient( PARSELY_PROMPTS_VIEWS_TRANSIENT, array( 'an earlier shape' => 150000 ), PARSELY_PROMPTS_VIEWS_TTL );
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertTrue( offers_parsely_prompts() );
		$this->assertSame( 1, $this->usage_requests );
	}

	public function test_exactly_the_threshold_offers_the_prompts() {
		$this->answer_stats_usage_with( self::usage_with_views( 100000 ) );

		$this->assertTrue( offers_parsely_prompts() );
	}

	public function test_below_the_threshold_does_not_offer_the_prompts() {
		$this->answer_stats_usage_with( self::usage_with_views( 99999 ) );

		$this->assertFalse( offers_parsely_prompts() );
	}

	/**
	 * WordPress.com sends the counts as JSON numbers today, but a payload quoting them must still
	 * be read as traffic rather than skipped as unreadable.
	 */
	public function test_views_sent_as_a_numeric_string_still_qualify() {
		$this->answer_stats_usage_with( self::usage_with_views( '150000' ) );

		$this->assertTrue( offers_parsely_prompts() );
	}

	public function test_the_quietest_whole_month_decides() {
		$this->answer_stats_usage_with( self::usage_with_monthly_views( array( 150000, 99999 ) ) );

		$this->assertFalse( offers_parsely_prompts() );
	}

	public function test_a_site_with_no_whole_month_on_record_does_not_offer_the_prompts() {
		$this->answer_stats_usage_with( self::usage_with_monthly_views( array() ) );

		$this->assertFalse( offers_parsely_prompts() );
	}

	/**
	 * Only a paid Stats plan qualifies.
	 *
	 * @dataProvider provide_stats_tiers
	 *
	 * @param string $tier     One of the STATS_TIER_* values.
	 * @param bool   $expected Whether the site qualifies.
	 */
	#[DataProvider( 'provide_stats_tiers' )]
	public function test_only_paid_tiers_offer_the_prompts( $tier, $expected ) {
		remove_all_filters( STATS_PLAN_TIER_FILTER );
		add_filter(
			STATS_PLAN_TIER_FILTER,
			static function () use ( $tier ) {
				return $tier;
			}
		);
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertSame( $expected, offers_parsely_prompts() );
		$this->assertSame( $expected ? 1 : 0, $this->usage_requests, 'An unqualified tier is answered before the request.' );
	}

	/**
	 * @return array<string, array{0: string, 1: bool}>
	 */
	public static function provide_stats_tiers() {
		return array(
			'commercial'   => array( STATS_TIER_COMMERCIAL, true ),
			'paid'         => array( STATS_TIER_PAID, true ),
			'legacy free'  => array( STATS_TIER_LEGACY_FREE, false ),
			'legacy basic' => array( STATS_TIER_LEGACY_BASIC, false ),
			'free'         => array( STATS_TIER_FREE, false ),
			'jetpack free' => array( STATS_TIER_JETPACK_FREE, false ),
			'unknown'      => array( STATS_TIER_UNKNOWN, false ),
		);
	}

	public function test_the_flag_closes_the_gate_without_a_request() {
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Parsely_Prompts::FLAG );
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertFalse( offers_parsely_prompts() );
		$this->assertSame( 0, $this->usage_requests );
	}

	public function test_a_user_without_manage_options_does_not_offer_the_prompts() {
		$subscriber = wp_insert_user(
			array(
				'user_login' => 'parsely_prompts_subscriber',
				'user_pass'  => 'pass',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber );
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertFalse( offers_parsely_prompts() );
		$this->assertSame( 0, $this->usage_requests, 'The capability is answered before the request.' );
	}

	public function test_wpcom_simple_does_not_offer_the_prompts() {
		Constants::set_constant( 'IS_WPCOM', true );
		Cache::clear();
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertFalse( offers_parsely_prompts() );
		$this->assertSame( 0, $this->usage_requests, 'The platform is answered before the request.' );
	}

	public function test_a_parsely_customer_does_not_offer_the_prompts() {
		update_option( 'parsely', array( 'apikey' => 'example.com' ) );
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertFalse( offers_parsely_prompts() );
		$this->assertSame( 0, $this->usage_requests, 'A customer is answered before the request.' );
	}

	public function test_an_empty_parsely_api_key_is_not_a_customer() {
		update_option( 'parsely', array( 'apikey' => '' ) );
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertTrue( offers_parsely_prompts() );
	}

	public function test_a_parsely_api_key_that_is_not_a_string_is_not_a_customer() {
		update_option( 'parsely', array( 'apikey' => array( 'example.com' ) ) );
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertTrue( offers_parsely_prompts() );
	}

	public function test_a_configured_parsely_plugin_is_a_customer() {
		$GLOBALS['parsely'] = self::parsely_plugin_reporting_site_id( true );
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertFalse( offers_parsely_prompts() );
		$this->assertSame( 0, $this->usage_requests, 'A customer is answered before the request.' );
	}

	public function test_an_unconfigured_parsely_plugin_is_not_a_customer() {
		$GLOBALS['parsely'] = self::parsely_plugin_reporting_site_id( false );
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertTrue( offers_parsely_prompts() );
	}

	public function test_a_parsely_plugin_that_cannot_answer_falls_back_to_the_option() {
		$GLOBALS['parsely'] = new \stdClass();
		update_option( 'parsely', array( 'apikey' => 'example.com' ) );
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$this->assertFalse( offers_parsely_prompts() );
	}

	/**
	 * A stand-in for wp-parsely's own plugin object.
	 *
	 * @param bool $site_id_is_set What the plugin reports about its Site ID.
	 * @return object
	 */
	private static function parsely_plugin_reporting_site_id( $site_id_is_set ) {
		return new class( $site_id_is_set ) {
			/**
			 * @var bool
			 */
			private $site_id_is_set;

			/**
			 * @param bool $site_id_is_set What to report.
			 */
			public function __construct( $site_id_is_set ) {
				$this->site_id_is_set = $site_id_is_set;
			}

			/**
			 * @return bool
			 */
			public function site_id_is_set() {
				return $this->site_id_is_set;
			}
		};
	}

	/**
	 * A 200 carrying something that is not an object at all, which reaches the reader as a string
	 * rather than the array its signature takes.
	 */
	public function test_a_usage_response_that_is_not_a_payload_does_not_offer_the_prompts() {
		$this->answer_stats_usage_with( 'not a payload' );

		$this->assertFalse( offers_parsely_prompts() );
	}

	public function test_a_usage_error_does_not_offer_the_prompts() {
		$this->answer_stats_usage_with( new WP_Error( 'api_error', 'WordPress.com is unavailable.' ) );

		$this->assertFalse( offers_parsely_prompts() );
	}

	/**
	 * A payload the views cannot be read from leaves the site unqualified.
	 *
	 * @dataProvider provide_unusable_usage_payloads
	 *
	 * @param array $payload The usage response.
	 */
	#[DataProvider( 'provide_unusable_usage_payloads' )]
	public function test_an_unusable_usage_payload_does_not_offer_the_prompts( $payload ) {
		$this->answer_stats_usage_with( $payload );

		$this->assertFalse( offers_parsely_prompts() );
	}

	/**
	 * @return array<string, array{0: array}>
	 */
	public static function provide_unusable_usage_payloads() {
		return array(
			'empty'              => array( array() ),
			'views null'         => array( array( 'recent_usages' => array( array( 'views_count' => null ) ) ) ),
			'views not a number' => array( array( 'recent_usages' => array( array( 'views_count' => '150000 views' ) ) ) ),
			'views an array'     => array( array( 'recent_usages' => array( array( 'views_count' => array( 150000 ) ) ) ) ),
			'a month not a row'  => array( array( 'recent_usages' => array( 'not a month' ) ) ),
		);
	}

	/**
	 * An unreadable month is skipped, not fatal to the set: the remaining months still decide.
	 */
	public function test_an_unreadable_month_does_not_discard_the_months_beside_it() {
		$this->answer_stats_usage_with(
			array(
				'recent_usages' => array(
					array( 'views_count' => 'not a number' ),
					array( 'views_count' => 150000 ),
				),
			)
		);

		$this->assertTrue( offers_parsely_prompts() );
	}

	public function test_the_filter_overrides_the_computed_answer() {
		remove_all_filters( STATS_PLAN_TIER_FILTER );
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_FREE );
		add_filter( OFFERS_PARSELY_PROMPTS_FILTER, '__return_true' );

		$this->assertTrue( offers_parsely_prompts() );
	}

	public function test_the_filter_can_withhold_the_prompts_from_a_qualifying_site() {
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );
		add_filter( OFFERS_PARSELY_PROMPTS_FILTER, '__return_false' );

		$this->assertFalse( offers_parsely_prompts() );
	}

	public function test_the_flag_is_registered_off_by_default() {
		Parsely_Prompts::register_feature_flag();

		$this->assertSame( false, Feature_Flags::get( Parsely_Prompts::FLAG )['default'] ?? null );
	}

	/**
	 * Put the request on the dashboard page, which is the only place the key is published.
	 */
	private function enter_dashboard() {
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );
	}

	public function test_the_dashboard_carries_the_answer() {
		$this->enter_dashboard();
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$data = inject_parsely_prompts_script_data( array() );

		$this->assertTrue( $data['premium_analytics']['offers_parsely_prompts'] );
	}

	public function test_an_unqualified_site_carries_false() {
		$this->enter_dashboard();
		remove_all_filters( STATS_PLAN_TIER_FILTER );
		add_filter( STATS_PLAN_TIER_FILTER, static fn() => STATS_TIER_FREE );

		$data = inject_parsely_prompts_script_data( array() );

		$this->assertFalse( $data['premium_analytics']['offers_parsely_prompts'] );
	}

	public function test_another_admin_page_carries_nothing() {
		$_GET['page'] = 'jetpack';
		set_current_screen( 'toplevel_page_jetpack' );

		$this->assertArrayNotHasKey( 'premium_analytics', inject_parsely_prompts_script_data( array() ) );
	}

	public function test_existing_premium_analytics_data_survives() {
		$this->enter_dashboard();
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$data = inject_parsely_prompts_script_data( array( 'premium_analytics' => array( 'csv_exports_enabled' => true ) ) );

		$this->assertTrue( $data['premium_analytics']['csv_exports_enabled'] );
		$this->assertTrue( $data['premium_analytics']['offers_parsely_prompts'] );
	}

	/**
	 * A filter running before this one can leave anything under the key.
	 */
	public function test_a_premium_analytics_value_that_is_not_an_array_is_replaced() {
		$this->enter_dashboard();
		$this->answer_stats_usage_with( self::usage_with_views( 150000 ) );

		$data = inject_parsely_prompts_script_data( array( 'premium_analytics' => 'not an array' ) );

		$this->assertTrue( $data['premium_analytics']['offers_parsely_prompts'] );
	}

	public function test_configure_adds_the_script_data_filter() {
		configure_parsely_prompts();

		$this->assertSame( 20, has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_parsely_prompts_script_data' ) );
	}
}
