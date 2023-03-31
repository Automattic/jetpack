<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests Main class.
 *
 * @package jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Stats\Main as Stats;
use Jetpack_Options;

/**
 * Class to test the Main class.
 *
 * Important! All the *_with_jp_version_lt_11_5_a_2 need to run before their counterpart
 * that test the same hooks but without JP version set to `11.5-a.1`.
 * This happens because the PHP 5.6 unit tests would fail as the global $wp_filter
 * is not being properly reset between tests.
 *
 * @todo Investigate why this happens and fix it.
 *
 * @covers Automattic\Jetpack\Stats\Main
 */
class Test_Main extends StatsBaseTestCase {
	/**
	 * An instance of Main class.
	 *
	 * @var Automattic\Jetpack\Stats\Main
	 */
	protected $stats;

	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::set_up();

		if ( strpos( $this->getName(), 'jp_version_lt_11_5_a_2' ) ) {
			Constants::set_constant( 'JETPACK__VERSION', '11.5-a.1' );
		}

		$this->stats = Stats::init();
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		parent::tear_down();

		unset( $_SERVER['HTTP_DNT'] );

		$reflected_class    = new \ReflectionClass( 'Automattic\Jetpack\Stats\Main' );
		$reflected_property = $reflected_class->getProperty( 'instance' );
		$reflected_property->setAccessible( true );
		$reflected_property = $reflected_property->setValue( null );

		$reflected_class    = new \ReflectionClass( 'Automattic\Jetpack\Stats\XMLRPC_Provider' );
		$reflected_property = $reflected_class->getProperty( 'instance' );
		$reflected_property->setAccessible( true );
		$reflected_property = $reflected_property->setValue( null );
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
	 * Test Main::init does not add the `wp_head` hook if an older version of the
	 * Jetpack plugin is active.
	 */
	public function test_wp_head_hook_not_added_with_jp_version_lt_11_5_a_2() {
		$has_action = has_action( 'wp_head', array( 'Automattic\Jetpack\Stats\Main', 'hide_smile_css' ) );
		$this->assertFalse( $has_action );
	}

	/**
	 * Test Main::init adds the `wp_head` hook.
	 */
	public function test_wp_head_hook() {
		$has_action = has_action( 'wp_head', array( 'Automattic\Jetpack\Stats\Main', 'hide_smile_css' ) );
		$this->assertEquals( 10, $has_action );
	}

	/**
	 * Test Main::init does not add the `wp_head` hook if an older version of the
	 * Jetpack plugin is active.
	 */
	public function test_embed_head_hook_not_added_with_jp_version_lt_11_5_a_2() {
		$has_action = has_action( 'embed_head', array( 'Automattic\Jetpack\Stats\Main', 'hide_smile_css' ) );
		$this->assertFalse( $has_action );
	}

	/**
	 * Test Main::init adds the `embed_head` hook.
	 */
	public function test_embed_head_hook() {
		$has_action = has_action( 'embed_head', array( 'Automattic\Jetpack\Stats\Main', 'hide_smile_css' ) );
		$this->assertEquals( 10, $has_action );
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
		remove_filter( 'jetpack_honor_dnt_header_for_stats', array( __CLASS__, 'filter_jetpack_honor_dnt_header_for_stats' ), 10, 2 );
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
		remove_filter( 'jetpack_honor_dnt_header_for_stats', array( __CLASS__, 'filter_jetpack_honor_dnt_header_for_stats' ), 10, 2 );
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
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		$this->assertTrue( $should_track );
	}

	/**
	 * Test Main::template_redirect adds the `wp_footer` hook.
	 */
	public function test_template_redirect_adds_wp_footer_hook() {
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		Stats::template_redirect();
		$has_action = has_action( 'wp_footer', array( Tracking_Pixel::class, 'add_amp_pixel' ) );
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		$this->assertSame( 101, $has_action );
	}

	/**
	 * Test Main::template_redirect adds the `web_stories_print_analytics` hook.
	 */
	public function test_template_redirect_adds_web_stories_print_analytics_hook() {
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		Stats::template_redirect();
		$has_action = has_action( 'web_stories_print_analytics', array( Tracking_Pixel::class, 'add_amp_pixel' ) );
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		$this->assertSame( 101, $has_action );
	}

	/**
	 * Test Main::template_redirect adds the `wp_enqueue_scripts` hook.
	 */
	public function test_template_redirect_adds_wp_enqueue_scripts_hook() {
		add_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
		Stats::template_redirect();
		$has_action = has_action( 'wp_enqueue_scripts', array( Tracking_Pixel::class, 'enqueue_stats_script' ) );
		remove_filter( 'jetpack_active_modules', array( __CLASS__, 'filter_jetpack_active_modules_add_stats' ), 10, 2 );
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
