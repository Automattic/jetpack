<?php
/**
 * Tests for the bundled Premium Analytics feature flag.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PremiumAnalytics\Classic_Stats;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'class-jetpack-stats-dashboard-widget.php';
require_once JETPACK__PLUGIN_DIR . 'modules/stats.php';

/**
 * Tests for Jetpack::is_premium_analytics_enabled().
 *
 * @covers \Jetpack
 * @covers \Jetpack_Stats_Feature_Flags
 */
#[CoversClass( Jetpack::class )]
#[CoversClass( Jetpack_Stats_Feature_Flags::class )]
class Jetpack_Premium_Analytics_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );
		self::reset_flag_cache();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		delete_option( 'jetpack_premium_analytics_enabled' );
		unregister_setting( 'general', 'jetpack_premium_analytics_enabled' );
		Jetpack_Options::delete_option( 'active_modules' );
		self::reset_flag_cache();
		remove_action( 'jetpack_admin_menu', 'stats_admin_menu' );
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Classic_Stats::RETIRED_FLAG );
		remove_all_filters( 'jetpack_premium_analytics_enabled' );
		parent::tear_down();
	}

	/**
	 * Forget the once-per-request answer so each test resolves the flag itself.
	 */
	private static function reset_flag_cache() {
		$cache = new ReflectionProperty( Jetpack::class, 'premium_analytics_enabled' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$cache->setAccessible( true );
		}
		$cache->setValue( null, null );
	}

	/**
	 * A flag that is on but cannot be honoured keeps the Stats UI and says why.
	 *
	 * The package ships with the plugin, so the only way to model a build without
	 * it is to take the autoloaders away for the duration of the call. That works
	 * once per process: `class_exists()` loads the class for good, so this has to
	 * run before any test here that turns the flag on. Hence its position at the
	 * top of the file — PHPUnit runs methods in declaration order.
	 */
	public function test_flag_on_without_the_package_stays_disabled_and_warns() {
		if ( class_exists( 'Automattic\Jetpack\PremiumAnalytics\Analytics', false ) ) {
			$this->markTestSkipped( 'Premium Analytics is already loaded in this process; a missing package cannot be modelled.' );
		}

		update_option( 'jetpack_premium_analytics_enabled', 1 );

		$notice      = '';
		$notices     = 0;
		$autoloaders = spl_autoload_functions();

		foreach ( $autoloaders as $autoloader ) {
			spl_autoload_unregister( $autoloader );
		}

		// wp_trigger_error() raises an E_USER_NOTICE, which this suite is configured to fail on.
		set_error_handler( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.prevent_path_disclosure_set_error_handler
			function ( $errno, $errstr ) use ( &$notice, &$notices ) {
				$notice = $errstr;
				++$notices;
				return true;
			},
			E_USER_NOTICE
		);

		try {
			$enabled = Jetpack::is_premium_analytics_enabled();
		} finally {
			restore_error_handler();
			foreach ( $autoloaders as $autoloader ) {
				spl_autoload_register( $autoloader );
			}
		}

		$this->assertFalse( $enabled );
		$this->assertSame( 1, $notices );
		$this->assertStringContainsString( 'Premium Analytics package is not loadable', $notice );
	}

	/**
	 * Off unless something turns it on.
	 */
	public function test_disabled_by_default() {
		$this->assertFalse( get_option( 'jetpack_premium_analytics_enabled' ) );
		$this->assertFalse( Jetpack::is_premium_analytics_enabled() );
	}

	/**
	 * The option turns it on, and the bundled package is loadable.
	 */
	public function test_enabled_by_the_option() {
		update_option( 'jetpack_premium_analytics_enabled', 1 );

		$this->assertTrue( Jetpack::is_premium_analytics_enabled() );
	}

	/**
	 * Off while the Stats module is inactive, without even consulting the flag; back once it is active again.
	 */
	public function test_follows_the_stats_module() {
		update_option( 'jetpack_premium_analytics_enabled', 1 );
		Jetpack_Options::update_option( 'active_modules', array() );

		$not_consulted = function () {
			$this->fail( 'The flag must not be consulted while the Stats module is inactive.' );
		};
		add_filter( 'jetpack_premium_analytics_enabled', $not_consulted );

		try {
			$this->assertFalse( Jetpack::is_premium_analytics_enabled() );
		} finally {
			remove_filter( 'jetpack_premium_analytics_enabled', $not_consulted );
		}

		self::reset_flag_cache();
		Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );

		$this->assertTrue( Jetpack::is_premium_analytics_enabled() );
	}

	/**
	 * The answer is resolved once, so every caller in a request sees the same one.
	 */
	public function test_answer_is_resolved_once_per_request() {
		$this->assertFalse( Jetpack::is_premium_analytics_enabled() );

		update_option( 'jetpack_premium_analytics_enabled', 1 );

		$this->assertFalse( Jetpack::is_premium_analytics_enabled(), 'A later option change should not be picked up mid-request.' );
	}

	/**
	 * The filter is only consulted while the answer is unresolved.
	 */
	public function test_filter_registered_after_resolution_is_ignored() {
		$this->assertFalse( Jetpack::is_premium_analytics_enabled() );

		add_filter( 'jetpack_premium_analytics_enabled', '__return_true' );

		try {
			$this->assertFalse( Jetpack::is_premium_analytics_enabled() );
		} finally {
			remove_filter( 'jetpack_premium_analytics_enabled', '__return_true' );
		}
	}

	/**
	 * The Stats dashboard widget always carries on to its own visibility check:
	 * Stats v2 adds a menu rather than replacing the legacy widget, on any site.
	 */
	public function test_dashboard_widget_runs_when_enabled() {
		update_option( 'jetpack_premium_analytics_enabled', 1 );

		$reached = false;
		$spy     = function () use ( &$reached ) {
			$reached = true;
			// Stop here: the rest of wp_dashboard_setup() is not what this test is about.
			return false;
		};
		add_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );
		add_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );

		try {
			Jetpack_Stats_Dashboard_Widget::wp_dashboard_setup();
		} finally {
			remove_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );
			remove_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );
		}

		$this->assertTrue( $reached, 'wp_dashboard_setup() should reach its own visibility check regardless of the flag.' );
	}

	/**
	 * With the flag off the widget carries on to its own visibility check.
	 */
	public function test_dashboard_widget_runs_when_disabled() {
		$reached = false;
		$spy     = function () use ( &$reached ) {
			$reached = true;
			// Stop here: the rest of wp_dashboard_setup() is not what this test is about.
			return false;
		};
		add_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );
		add_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );

		try {
			Jetpack_Stats_Dashboard_Widget::wp_dashboard_setup();
		} finally {
			remove_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );
			remove_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );
		}

		$this->assertTrue( $reached );
	}

	/**
	 * The classic Stats menu goes only once the page is retired and Stats v2 is there to replace it.
	 *
	 * Calling stats_load() also registers other hooks that tear_down() doesn't remove; only the menu matters here.
	 *
	 * @param bool $retired   Whether the classic page is retired.
	 * @param bool $v2_on     What the `jetpack_premium_analytics_enabled` filter answers.
	 * @param bool $kept      Whether the classic menu is registered.
	 * @dataProvider provide_stats_admin_menu_cases
	 */
	#[PHPUnit\Framework\Attributes\DataProvider( 'provide_stats_admin_menu_cases' )]
	public function test_stats_admin_menu( $retired, $v2_on, $kept ) {
		add_filter( 'jetpack_feature_flag_enabled_' . Classic_Stats::RETIRED_FLAG, $retired ? '__return_true' : '__return_false' );
		add_filter( 'jetpack_premium_analytics_enabled', $v2_on ? '__return_true' : '__return_false' );

		stats_load();

		$this->assertSame( $kept, false !== has_action( 'jetpack_admin_menu', 'stats_admin_menu' ) );
	}

	/**
	 * Data for test_stats_admin_menu.
	 *
	 * @return array
	 */
	public static function provide_stats_admin_menu_cases() {
		return array(
			'kept alongside Stats v2'    => array( false, true, true ),
			'retired'                    => array( true, true, false ),
			'kept while Stats v2 is off' => array( true, false, true ),
		);
	}

	/**
	 * The opt-in is exposed while the dashboard is still off — it is the setting that turns it on,
	 * so registering it behind the flag would leave nothing able to flip it.
	 */
	public function test_enablement_setting_is_registered_while_the_dashboard_is_off() {
		$this->assertFalse( Jetpack::is_premium_analytics_enabled() );

		Jetpack::register_premium_analytics_enablement_setting();

		$this->assertArrayHasKey( 'jetpack_premium_analytics_enabled', get_registered_settings() );
	}
}
