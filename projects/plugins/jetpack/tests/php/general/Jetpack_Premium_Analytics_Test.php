<?php
/**
 * Tests for the bundled Premium Analytics feature flag.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'class-jetpack-stats-dashboard-widget.php';

/**
 * Tests for Jetpack::is_premium_analytics_enabled() and the Stats UI it replaces.
 *
 * @covers \Jetpack
 */
#[CoversClass( Jetpack::class )]
class Jetpack_Premium_Analytics_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		self::reset_flag_cache();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		delete_option( 'jetpack_premium_analytics_enabled' );
		self::reset_flag_cache();
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
	 * An option value that is present but falsy is still off.
	 */
	public function test_disabled_by_a_falsy_option() {
		update_option( 'jetpack_premium_analytics_enabled', 0 );

		$this->assertFalse( Jetpack::is_premium_analytics_enabled() );
	}

	/**
	 * The filter wins over the option, in both directions.
	 *
	 * @param bool $option   Stored option value.
	 * @param bool $filtered What the filter returns.
	 * @param bool $expected Expected answer.
	 * @dataProvider provide_filter_overrides
	 */
	#[PHPUnit\Framework\Attributes\DataProvider( 'provide_filter_overrides' )]
	public function test_filter_overrides_the_option( $option, $filtered, $expected ) {
		update_option( 'jetpack_premium_analytics_enabled', $option ? 1 : 0 );

		$filter = function () use ( $filtered ) {
			return $filtered;
		};
		add_filter( 'jetpack_premium_analytics_enabled', $filter );

		try {
			$this->assertSame( $expected, Jetpack::is_premium_analytics_enabled() );
		} finally {
			remove_filter( 'jetpack_premium_analytics_enabled', $filter );
		}
	}

	/**
	 * Data for test_filter_overrides_the_option.
	 *
	 * @return array
	 */
	public static function provide_filter_overrides() {
		return array(
			'filter turns it on'  => array( false, true, true ),
			'filter turns it off' => array( true, false, false ),
		);
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
	 * The Stats dashboard widget bows out before any of its own checks run.
	 */
	public function test_dashboard_widget_is_skipped_when_enabled() {
		update_option( 'jetpack_premium_analytics_enabled', 1 );

		$reached = false;
		$spy     = function ( $show ) use ( &$reached ) {
			$reached = true;
			return $show;
		};
		add_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );

		try {
			Jetpack_Stats_Dashboard_Widget::wp_dashboard_setup();
		} finally {
			remove_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );
		}

		$this->assertFalse( $reached, 'wp_dashboard_setup() should return before filtering widget visibility.' );
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

		try {
			Jetpack_Stats_Dashboard_Widget::wp_dashboard_setup();
		} finally {
			remove_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );
		}

		$this->assertTrue( $reached );
	}

	/**
	 * On WordPress.com Simple the widget never asks about the flag.
	 *
	 * The jetpack-mu-wpcom package requires this file on its own there, into an environment
	 * where `Jetpack` is wpcom's class rather than the plugin's — asking would be
	 * a call to an undefined method, and it takes wp-admin down with it. Nothing
	 * in this suite can stand in for that class, so what is pinned here is the
	 * guard: on Simple the widget carries on regardless of the flag.
	 */
	public function test_dashboard_widget_ignores_the_flag_on_wpcom_simple() {
		update_option( 'jetpack_premium_analytics_enabled', 1 );
		Constants::set_constant( 'IS_WPCOM', true );

		$reached = false;
		$spy     = function () use ( &$reached ) {
			$reached = true;
			// Stop here: the rest of wp_dashboard_setup() is not what this test is about.
			return false;
		};
		add_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );

		try {
			Jetpack_Stats_Dashboard_Widget::wp_dashboard_setup();
		} finally {
			remove_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );
			Constants::clear_single_constant( 'IS_WPCOM' );
		}

		$this->assertTrue( $reached, 'wp_dashboard_setup() should not consult the flag on Simple sites.' );
	}
}
