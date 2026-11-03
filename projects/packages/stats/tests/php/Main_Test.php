<?php
/**
 * Tests Main class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Stats\Main as Stats;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Class to test the Main class.
 *
 * @covers Automattic\Jetpack\Stats\Main
 */
#[CoversClass( Stats::class )]
class Main_Test extends StatsBaseTestCase {

	/**
	 * Reads of the `trusted_ip_header` site option during the last
	 * should_track_with_excluded_ips() call.
	 *
	 * Visitor::get_ip( true ) reads that option before it looks at anything else, so a count
	 * of zero means the visitor address was never resolved. The skip is not observable any
	 * other way from here.
	 *
	 * @var int
	 */
	private $visitor_lookups = 0;
	/**
	 * An instance of Main class.
	 *
	 * @var \Automattic\Jetpack\Stats\Main
	 */
	protected $stats;

	/**
	 * Set up before each test
	 */
	protected function set_up() {
		parent::set_up();

		// PHPUnit 10+ renamed `getName()` to `name()`.
		// @phan-suppress-next-line PhanUndeclaredMethod -- `getName()` exists (PHPUnit <10) if `name()` doesn't (PHPUnit 10+).
		$name = is_callable( array( $this, 'name' ) ) ? $this->name() : $this->getName();
		if ( strpos( $name, 'jp_version_lt_11_5_a_2' ) ) {
			Constants::set_constant( 'JETPACK__VERSION', '11.5-a.1' );
		}

		$this->stats = Stats::init();
	}

	/**
	 * Clean up the testing environment.
	 */
	public function tear_down() {
		parent::tear_down();

		unset( $_SERVER['HTTP_DNT'] );

		// wp_styles() is a global that outlives each test, so a handle enqueued by one would
		// otherwise be seen by the next.
		wp_dequeue_style( 'jetpack-stats' );
		wp_deregister_style( 'jetpack-stats' );

		// Reset the REST server so the lazy-registration test below does not leak its
		// populated server (with the stats route registered) into later tests in the suite.
		global $wp_rest_server;
		$wp_rest_server = null;

		$reflected_class    = new \ReflectionClass( 'Automattic\Jetpack\Stats\Main' );
		$reflected_property = $reflected_class->getProperty( 'instance' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$reflected_property->setAccessible( true );
		}
		$reflected_property = $reflected_property->setValue( null, null );

		$reflected_class    = new \ReflectionClass( 'Automattic\Jetpack\Stats\XMLRPC_Provider' );
		$reflected_property = $reflected_class->getProperty( 'instance' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$reflected_property->setAccessible( true );
		}
		$reflected_property = $reflected_property->setValue( null, null );

		$reflected_class    = new \ReflectionClass( 'Automattic\Jetpack\Stats\REST_Provider' );
		$reflected_property = $reflected_class->getProperty( 'instance' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$reflected_property->setAccessible( true );
		}
		$reflected_property->setValue( null, null );
	}

	/**
	 * Test Main::init does not add the `template_redirect` hook if an older version of the
	 * Jetpack plugin is active.
	 */
	public function test_template_redirect_hook_not_added_with_jp_version_lt_11_5_a_2() {
		$has_action = has_action( 'template_redirect', array( 'Automattic\Jetpack\Stats\Main', 'template_redirect' ) );
		$this->assertFalse( $has_action );
	}

	/**
	 * Test Main::init adds the `template_redirect` hook.
	 */
	public function test_template_redirect_hook() {
		$has_action = has_action( 'template_redirect', array( 'Automattic\Jetpack\Stats\Main', 'template_redirect' ) );
		$this->assertSame( 1, $has_action );
	}

	/**
	 * Main::init() no longer constructs REST_Provider up front; it defers the load to a
	 * priority-0 `rest_api_init` callback. Guard that firing the hook still registers the
	 * route — the priority-0 callback builds REST_Provider, whose constructor adds the
	 * default-priority callback that registers the route within the same firing. A regression
	 * to that re-entrancy (e.g. bumping the deferred priority) would silently drop the route.
	 */
	public function test_rest_provider_route_registers_lazily_on_rest_api_init() {
		// Reset the REST_Provider singleton so the deferred callback rebuilds it and
		// re-registers its own rest_api_init handler against this test's hook state.
		$reflected_property = ( new \ReflectionClass( REST_Provider::class ) )->getProperty( 'instance' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$reflected_property->setAccessible( true );
		}
		$reflected_property->setValue( null, null );

		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();

		$this->assertArrayNotHasKey(
			'/jetpack/v4/stats/blog',
			$wp_rest_server->get_routes(),
			'Stats REST route should not be registered before rest_api_init fires.'
		);

		do_action( 'rest_api_init' );

		$this->assertArrayHasKey(
			'/jetpack/v4/stats/blog',
			$wp_rest_server->get_routes(),
			'Stats REST route should register on rest_api_init via the deferred REST_Provider load.'
		);
	}

	/**
	 * Test Main::init does not add the stylesheet hook if an older version of the
	 * Jetpack plugin is active.
	 */
	public function test_hide_smile_css_hook_not_added_with_jp_version_lt_11_5_a_2() {
		$has_action = has_action( 'wp_enqueue_scripts', array( 'Automattic\Jetpack\Stats\Main', 'hide_smile_css' ) );
		$this->assertFalse( $has_action );
	}

	/**
	 * Test Main::init adds the stylesheet hook.
	 */
	public function test_hide_smile_css_hook() {
		$has_action = has_action( 'wp_enqueue_scripts', array( 'Automattic\Jetpack\Stats\Main', 'hide_smile_css' ) );
		$this->assertEquals( 10, $has_action );
	}

	/**
	 * The rule that hides the tracking pixel goes through the stylesheet queue rather than
	 * being printed into the page.
	 */
	public function test_hide_smile_css_is_enqueued() {
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		Stats::hide_smile_css();
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10 );

		$this->assertTrue( wp_style_is( 'jetpack-stats', 'enqueued' ) );

		ob_start();
		wp_styles()->do_items( 'jetpack-stats' );
		$output = ob_get_clean();

		$this->assertMatchesRegularExpression( '/<style id=["\']jetpack-stats-inline-css["\']/', $output );
		$this->assertStringContainsString( 'img#wpstats{display:none}', $output );
	}

	/**
	 * Nothing is enqueued on a request that is not being tracked, which is what the stats
	 * module being inactive means here.
	 */
	public function test_hide_smile_css_is_not_enqueued_when_not_tracking() {
		Stats::hide_smile_css();

		$this->assertFalse( wp_style_is( 'jetpack-stats', 'enqueued' ) );
	}

	/**
	 * Test Main::init does not add the `map_meta_cap` filter if an older version of the
	 * Jetpack plugin is active.
	 */
	public function test_map_meta_cap_filter_not_added_with_jp_version_lt_11_5_a_2() {
		$has_filter = has_filter( 'map_meta_cap', array( 'Automattic\Jetpack\Stats\Main', 'map_meta_caps' ) );
		$this->assertFalse( $has_filter );
	}

	/**
	 * Test Main::init adds the 'map_meta_cap' filter.
	 */
	public function test_map_meta_cap_filter() {
		$has_filter = has_filter( 'map_meta_cap', array( 'Automattic\Jetpack\Stats\Main', 'map_meta_caps' ) );
		$this->assertEquals( 10, $has_filter );
	}

	/**
	 * Test Main::jetpack_is_dnt_enabled.
	 */
	public function test_jetpack_is_dnt_enabled() {
		$_SERVER['HTTP_DNT'] = true;
		add_filter( 'jetpack_honor_dnt_header_for_stats', array( __CLASS__, 'filter_jetpack_honor_dnt_header_for_stats' ), 10, 2 );
		$this->assertTrue( Stats::jetpack_is_dnt_enabled() );
		remove_filter( 'jetpack_honor_dnt_header_for_stats', array( __CLASS__, 'filter_jetpack_honor_dnt_header_for_stats' ), 10 );
	}

	/**
	 * Test Main::jetpack_is_dnt_enabled without the `jetpack_honor_dnt_header_for_stats` filter.
	 */
	public function test_jetpack_is_dnt_enabled_without_filter() {
		$_SERVER['HTTP_DNT'] = true;

		$this->assertFalse( Stats::jetpack_is_dnt_enabled() );
	}

	/**
	 * Test Main::jetpack_is_dnt_enabled without the `jetpack_honor_dnt_header_for_stats` filter.
	 */
	public function test_jetpack_is_dnt_enabled_with_filter_without_header() {
		add_filter( 'jetpack_honor_dnt_header_for_stats', array( __CLASS__, 'filter_jetpack_honor_dnt_header_for_stats' ), 10, 2 );
		$this->assertFalse( Stats::jetpack_is_dnt_enabled() );
		remove_filter( 'jetpack_honor_dnt_header_for_stats', array( __CLASS__, 'filter_jetpack_honor_dnt_header_for_stats' ), 10 );
	}

	/**
	 * Test Main::map_meta_caps
	 */
	public function test_view_stats_meta_mapping() {
		$dummy_user_id = wp_insert_user(
			array(
				'user_login' => 'dummy',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);

		$this->assertTrue( user_can( $dummy_user_id, 'view_stats' ) );
	}

	/**
	 * Test Main::map_meta_caps with multi-role user where admin is not the first role.
	 */
	public function test_view_stats_meta_mapping_multi_role() {
		$dummy_user_id = wp_insert_user(
			array(
				'user_login' => 'dummy_multirole',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);

		// Add administrator as a second role.
		$user = new \WP_User( $dummy_user_id );
		$user->add_role( 'administrator' );

		$this->assertTrue( user_can( $dummy_user_id, 'view_stats' ) );
	}

	/**
	 * Test Main::map_meta_caps does not grant access to a disallowed role.
	 */
	public function test_view_stats_meta_mapping_disallowed_role() {
		$dummy_user_id = wp_insert_user(
			array(
				'user_login' => 'dummy_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);

		$this->assertFalse( user_can( $dummy_user_id, 'view_stats' ) );
	}

	/**
	 * Test Main::should_track
	 */
	public function test_should_track_will_return_false_without_connection() {
		Jetpack_Options::delete_option( 'blog_token' );

		$this->assertFalse( Stats::should_track() );
	}

	/**
	 * Test Main::should_track
	 */
	public function test_should_track_will_return_false_without_active_stats_module() {
		$this->assertFalse( Stats::should_track() );
	}

	/**
	 * Test Main::should_track
	 */
	public function test_should_track_will_return_true_with_active_stats_module() {
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		$should_track = Stats::should_track();
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10 );
		$this->assertTrue( $should_track );
	}

	/**
	 * Test Main::should_track
	 *
	 * Visitor::get_ip() returns a normalized address, so an excluded entry written in an
	 * equivalent form still has to match. '::ffff:203.0.113.5' reaches get_ip() as
	 * '203.0.113.5', and the configured list has to be normalized the same way.
	 *
	 * The lookup count pins the probe the skip test below depends on: should the visitor
	 * address stop being resolved through that option, this case fails rather than the skip
	 * case passing on a measurement that no longer observes anything.
	 */
	public function test_should_track_is_false_for_an_excluded_ip_written_in_another_form() {
		$_SERVER['HTTP_X_FORWARDED_FOR'] = '::ffff:203.0.113.5';

		$should_track = $this->should_track_with_excluded_ips( array( __CLASS__, 'filter_jetpack_stats_excluded_ips' ) );

		$this->assertFalse( $should_track );
		$this->assertGreaterThan( 0, $this->visitor_lookups );
	}

	/**
	 * Test Main::should_track
	 *
	 * A visitor who is not on the excluded list is still counted. The lookup count pins the
	 * probe, as above.
	 */
	public function test_should_track_is_true_for_an_ip_that_is_not_excluded() {
		$_SERVER['HTTP_X_FORWARDED_FOR'] = '198.51.100.9';

		$should_track = $this->should_track_with_excluded_ips( array( __CLASS__, 'filter_jetpack_stats_excluded_ips' ) );

		$this->assertTrue( $should_track );
		$this->assertGreaterThan( 0, $this->visitor_lookups );
	}

	/**
	 * Test Main::should_track
	 *
	 * Every entry of a misconfigured list can normalize away. Resolving the visitor address
	 * reads request headers and a site option, so with nothing left to compare against the
	 * lookup has to be skipped rather than performed and discarded.
	 */
	public function test_should_track_skips_the_visitor_lookup_for_a_list_that_normalizes_to_nothing() {
		$_SERVER['HTTP_X_FORWARDED_FOR'] = '198.51.100.9';

		$should_track = $this->should_track_with_excluded_ips( array( __CLASS__, 'filter_jetpack_stats_unusable_excluded_ips' ) );

		$this->assertTrue( $should_track );
		$this->assertSame( 0, $this->visitor_lookups );
	}

	/**
	 * Calls Main::should_track with the stats module active and the given excluded IP list
	 * configured, recording how often the visitor address was resolved and cleaning up the
	 * filters and the request header afterwards.
	 *
	 * @param callable $excluded_ips Callback returning the excluded IP list.
	 *
	 * @return bool
	 */
	private function should_track_with_excluded_ips( $excluded_ips ) {
		$this->visitor_lookups = 0;

		$counter = function ( $pre ) {
			++$this->visitor_lookups;
			return $pre;
		};

		add_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		add_filter( 'jetpack_stats_excluded_ips', $excluded_ips );
		add_filter( 'pre_site_option_trusted_ip_header', $counter );

		$should_track = Stats::should_track();

		remove_filter( 'pre_site_option_trusted_ip_header', $counter );
		remove_filter( 'jetpack_stats_excluded_ips', $excluded_ips );
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10 );
		unset( $_SERVER['HTTP_X_FORWARDED_FOR'] );

		return $should_track;
	}

	/**
	 * Excludes one address from tracking, written with an IPv4-mapped IPv6 prefix.
	 *
	 * @return array
	 */
	public static function filter_jetpack_stats_excluded_ips() {
		return array( '::ffff:203.0.113.5' );
	}

	/**
	 * Excludes nothing usable: no entry survives normalization.
	 *
	 * @return array
	 */
	public static function filter_jetpack_stats_unusable_excluded_ips() {
		return array( 42, array( '203.0.113.5' ), 'not-an-ip', '' );
	}

	/**
	 * Test Main::template_redirect adds the `wp_footer` hook.
	 */
	public function test_template_redirect_adds_wp_footer_hook() {
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		Stats::template_redirect();
		$has_action = has_action( 'wp_footer', array( Tracking_Pixel::class, 'add_amp_pixel' ) );
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10 );
		$this->assertSame( 101, $has_action );
	}

	/**
	 * Test Main::template_redirect adds the `web_stories_print_analytics` hook.
	 */
	public function test_template_redirect_adds_web_stories_print_analytics_hook() {
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		Stats::template_redirect();
		$has_action = has_action( 'web_stories_print_analytics', array( Tracking_Pixel::class, 'add_amp_pixel' ) );
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10 );
		$this->assertSame( 101, $has_action );
	}

	/**
	 * Test Main::template_redirect adds the `wp_enqueue_scripts` hook.
	 */
	public function test_template_redirect_adds_wp_enqueue_scripts_hook() {
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		Stats::template_redirect();
		$has_action = has_action( 'wp_enqueue_scripts', array( Tracking_Pixel::class, 'enqueue_stats_script' ) );
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10 );
		$this->assertSame( 101, $has_action );
	}

	/**
	 * Filter the option which decides honor DNT or not.
	 *
	 * @return bool
	 */
	public static function filter_jetpack_honor_dnt_header_for_stats() {
		return true;
	}
}
