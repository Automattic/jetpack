<?php
/**
 * Tests for Jetpack Stats front-end tracking configuration.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Stats\Main as Stats_Main;
use Automattic\Jetpack\Stats\Tracking_Pixel;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Jetpack_Stats_Tracker
 */
#[CoversClass( Jetpack_Stats_Tracker::class )]
class Jetpack_Stats_Tracker_Test extends TestCase {

	/**
	 * Reset singleton state and hooks between tests.
	 */
	protected function setUp(): void {
		parent::setUp();

		Jetpack_Options::update_option( 'active_modules', array() );
		Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();
		$GLOBALS['wp_scripts'] = null;
		$this->set_static_property( Jetpack_Stats_Tracker::class, 'configured', false );

		remove_filter( 'jetpack_get_available_standalone_modules', array( Jetpack_Stats_Tracker::class, 'add_stats_module' ) );
		remove_action( 'jetpack_site_registered', array( Jetpack_Stats_Tracker::class, 'activate_stats_module' ) );
		remove_action( 'plugins_loaded', array( Jetpack_Stats_Tracker::class, 'activate_stats_module_if_connected' ) );
		remove_action( 'wp_enqueue_scripts', array( Tracking_Pixel::class, 'enqueue_stats_script' ), 101 );
	}

	/**
	 * Reset state changed by the test.
	 */
	protected function tearDown(): void {
		Jetpack_Options::update_option( 'active_modules', array() );
		Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();
		$GLOBALS['wp_scripts'] = null;
		$this->set_static_property( Jetpack_Stats_Tracker::class, 'configured', false );

		remove_filter( 'jetpack_get_available_standalone_modules', array( Jetpack_Stats_Tracker::class, 'add_stats_module' ) );
		remove_action( 'jetpack_site_registered', array( Jetpack_Stats_Tracker::class, 'activate_stats_module' ) );
		remove_action( 'plugins_loaded', array( Jetpack_Stats_Tracker::class, 'activate_stats_module_if_connected' ) );
		remove_action( 'wp_enqueue_scripts', array( Tracking_Pixel::class, 'enqueue_stats_script' ), 101 );
		remove_filter( 'wp_script_attributes', array( Tracking_Pixel::class, 'add_low_fetchpriority' ) );
		remove_filter( 'wp_resource_hints', array( Tracking_Pixel::class, 'remove_stats_dns_prefetch' ), 100 );

		parent::tearDown();
	}

	/**
	 * Set a private static property for test isolation.
	 *
	 * @param string $class Class name.
	 * @param string $property Property name.
	 * @param mixed  $value Property value.
	 * @return void
	 */
	private function set_static_property( $class, $property, $value ) {
		$reflection = ( new ReflectionClass( $class ) )->getProperty( $property );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( null, $value );
	}

	/**
	 * Stats is available exactly once in standalone mode.
	 */
	public function test_add_stats_module_is_idempotent() {
		$this->assertSame(
			array( 'search', 'stats' ),
			Jetpack_Stats_Tracker::add_stats_module( array( 'search', 'stats' ) )
		);
	}

	/**
	 * Configuring twice registers the Stats pipeline only once.
	 */
	public function test_configure_is_idempotent() {
		Jetpack_Stats_Tracker::configure();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Repeating the call is the behavior under test.
		Jetpack_Stats_Tracker::configure();

		$this->assertSame( 10, has_filter( 'jetpack_get_available_standalone_modules', array( Jetpack_Stats_Tracker::class, 'add_stats_module' ) ) );
		$this->assertSame( 10, has_action( 'jetpack_site_registered', array( Jetpack_Stats_Tracker::class, 'activate_stats_module' ) ) );
		$this->assertSame( 1, has_action( 'template_redirect', array( Stats_Main::class, 'template_redirect' ) ) );
		$this->assertNotContains( 'stats', Jetpack_Options::get_option( 'active_modules' ) );

		Stats_Main::template_redirect();
		$this->assertFalse( has_action( 'wp_enqueue_scripts', array( Tracking_Pixel::class, 'enqueue_stats_script' ) ) );
	}

	/**
	 * Activating Stats in standalone mode makes the existing should_track gate pass its module check.
	 */
	public function test_activate_stats_module() {
		add_filter( 'jetpack_get_available_standalone_modules', array( Jetpack_Stats_Tracker::class, 'add_stats_module' ) );

		Jetpack_Stats_Tracker::activate_stats_module();

		$this->assertContains( 'stats', Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * An active Jetpack plugin owns the module setting, including a user's choice to disable Stats.
	 */
	public function test_activate_stats_module_respects_jetpack_setting() {
		require_once __DIR__ . '/fixtures/class-jetpack-stats-tracker-with-jetpack-stub.php';

		Jetpack_Stats_Tracker_With_Jetpack_Stub::activate_stats_module();

		$this->assertNotContains( 'stats', Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * A site connected after configuration activates Stats through the connection hook.
	 */
	public function test_site_registration_activates_stats_module() {
		Jetpack_Stats_Tracker::configure();

		do_action( 'jetpack_site_registered' );

		$this->assertContains( 'stats', Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * Repeated initialization still emits one Stats view payload.
	 */
	public function test_repeated_configuration_enqueues_one_view_payload() {
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();

		Jetpack_Stats_Tracker::configure();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Simulate another integration configuring the same tracker.
		Jetpack_Stats_Tracker::configure();

		// Simulate another Stats integration reaching the same request hook.
		Stats_Main::template_redirect();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Repeating the hook registration is the behavior under test.
		Stats_Main::template_redirect();

		do_action( 'wp_enqueue_scripts' );

		$inline_scripts = wp_scripts()->get_data( 'jetpack-stats', 'before' );
		$this->assertIsArray( $inline_scripts );
		$this->assertSame( 1, substr_count( implode( "\n", $inline_scripts ), '_stq.push([ "view"' ) );
	}
}
