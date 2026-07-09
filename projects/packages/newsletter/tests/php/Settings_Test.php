<?php
/**
 * Tests for the Settings class.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter\Tests;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Newsletter\Settings;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Settings.
 *
 * @covers \Automattic\Jetpack\Newsletter\Settings
 */
#[CoversClass( Settings::class )]
class Settings_Test extends BaseTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Reset the in-process Host platform cache so per-test constants take effect.
		\Automattic\Jetpack\Status\Cache::clear();

		// Reset the static initialized flag between tests.
		$reflection = new \ReflectionClass( Settings::class );
		$property   = $reflection->getProperty( 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, false );

		// Clear any existing hooks.
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'admin_init' );
		remove_all_actions( 'admin_enqueue_scripts' );
		remove_all_actions( 'current_screen' );
		remove_all_filters( 'jetpack_module_configuration_url_subscriptions' );
		remove_all_filters( 'jetpack_active_modules' );
		remove_all_filters( Settings::MODERNIZATION_FILTER );

		// Clear the load action registered by add_wp_admin_menu on success.
		remove_all_actions( 'load-jetpack_page_jetpack-newsletter' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		unset( $_GET['page'] );
		remove_all_filters( Settings::MODERNIZATION_FILTER );
		remove_all_filters( 'site_url' );
		remove_all_filters( 'home_url' );

		// Dequeue any scripts that may have leaked into globals during the test.
		wp_dequeue_script( 'jp-tracks' );
		wp_dequeue_script( 'jetpack-newsletter' );
		wp_deregister_script( 'jp-tracks' );
		wp_deregister_script( 'jetpack-newsletter' );

		parent::tear_down();
	}

	/**
	 * Test that add_wp_admin_menu does not register the menu when not connected.
	 */
	public function test_add_wp_admin_menu_does_not_register_menu_when_not_connected() {
		// Ensure disconnected state.
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'blog_token' );
		( new Connection_Manager() )->reset_connection_status();

		$settings = new Settings();
		$settings->add_wp_admin_menu();

		$this->assertFalse(
			has_action( 'load-jetpack_page_jetpack-newsletter', array( $settings, 'admin_init' ) ),
			'Newsletter menu should not be registered when site is not connected'
		);
	}

	/**
	 * Test that add_wp_admin_menu registers the menu when connected and the
	 * subscriptions module is active.
	 */
	public function test_add_wp_admin_menu_registers_menu_when_connected() {
		// Simulate connected state.
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'test_token.secret' );
		( new Connection_Manager() )->reset_connection_status();

		add_filter( 'jetpack_active_modules', array( $this, 'mock_subscriptions_active' ) );

		$settings = new Settings();
		$settings->add_wp_admin_menu();

		$this->assertNotFalse(
			has_action( 'load-jetpack_page_jetpack-newsletter', array( $settings, 'admin_init' ) ),
			'Newsletter menu should be registered when site is connected'
		);
	}

	/**
	 * Test that the modernized dashboard skips registering the menu when the
	 * subscriptions module is inactive.
	 */
	public function test_add_wp_admin_menu_does_not_register_menu_when_module_inactive() {
		// Simulate connected state; leave the subscriptions module inactive.
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'test_token.secret' );
		( new Connection_Manager() )->reset_connection_status();

		// Opt into the modernized dashboard (the default is off); with the module
		// inactive the menu must be skipped.
		add_filter( Settings::MODERNIZATION_FILTER, '__return_true' );

		$settings = new Settings();
		$settings->add_wp_admin_menu();

		$this->assertFalse(
			has_action( 'load-jetpack_page_jetpack-newsletter', array( $settings, 'admin_init' ) ),
			'Newsletter menu should not be registered on the modernized dashboard when the subscriptions module is off'
		);
	}

	/**
	 * Test that the legacy (unmodernized) dashboard still registers the menu when
	 * the subscriptions module is inactive — the module gate must not change
	 * non-modernized behavior.
	 */
	public function test_add_wp_admin_menu_registers_menu_when_module_inactive_but_not_modernized() {
		// Simulate connected state; leave the subscriptions module inactive.
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'test_token.secret' );
		( new Connection_Manager() )->reset_connection_status();

		// Opt out of modernization so the legacy code path runs.
		add_filter( Settings::MODERNIZATION_FILTER, '__return_false' );

		$settings = new Settings();
		$settings->add_wp_admin_menu();

		$this->assertNotFalse(
			has_action( 'load-jetpack_page_jetpack-newsletter', array( $settings, 'admin_init' ) ),
			'Legacy Newsletter menu should still register when the subscriptions module is off'
		);
	}

	/**
	 * Mock the subscriptions module being active.
	 *
	 * @return string[]
	 */
	public function mock_subscriptions_active() {
		return array( 'subscriptions' );
	}

	/**
	 * `is_modernized()` is the canonical gate used by `maybe_load_wp_build`,
	 * `add_wp_admin_menu`, and `load_admin_scripts`. The staged rollout is complete:
	 * the modernized experience now defaults on for every site, so the value
	 * `apply_filters` receives must be true.
	 */
	public function test_is_modernized_defaults_to_true() {
		$this->assertTrue(
			self::call_private_static_is_modernized(),
			'Modernization gate must default to true now that the rollout is at 100%.'
		);
	}

	/**
	 * Hosts that need the legacy AdminPage surface back must still be able to
	 * opt out — a single `__return_false` listener has to win over the new default.
	 */
	public function test_is_modernized_can_be_disabled_by_filter() {
		add_filter( Settings::MODERNIZATION_FILTER, '__return_false' );

		$this->assertFalse(
			self::call_private_static_is_modernized(),
			'A consumer filter returning false must take precedence over the modernization default.'
		);
	}

	/**
	 * Regression test for NL-695: on a WordPress install living in a subdirectory,
	 * `site_url` includes the subdirectory path (e.g. `example.com/pages`) while
	 * `home_url` is the bare host (e.g. `example.com`). The "Add plans" URL must be
	 * built from the home host so Calypso receives a valid site slug, not the
	 * subdirectory path.
	 */
	public function test_add_script_data_payment_url_uses_home_host_on_subdirectory_install() {
		add_filter( 'site_url', array( $this, 'mock_subdirectory_site_url' ) );
		add_filter( 'home_url', array( $this, 'mock_subdirectory_home_url' ) );

		$data = ( new Settings() )->add_script_data( array() );

		$this->assertSame(
			'https://cloud.jetpack.com/monetize/payments/example.com',
			$data['newsletter']['setupPaymentPlansUrl'],
			'Add plans URL must use the home host, not the site_url subdirectory path.'
		);
		$this->assertStringNotContainsString(
			'pages',
			$data['newsletter']['setupPaymentPlansUrl'],
			'Add plans URL must not leak the site_url subdirectory segment.'
		);
	}

	/**
	 * Mock `site_url` for a subdirectory install (WordPress lives in `/pages`).
	 *
	 * @return string
	 */
	public function mock_subdirectory_site_url() {
		return 'https://example.com/pages';
	}

	/**
	 * Mock `home_url` for a subdirectory install (the site is served from the root).
	 *
	 * @return string
	 */
	public function mock_subdirectory_home_url() {
		return 'https://example.com';
	}

	/**
	 * Reflection helper for the private static `Settings::is_modernized()`.
	 *
	 * Going through reflection rather than `apply_filters()` ensures we test the
	 * default value baked into the production code, not the value we pass in.
	 *
	 * @return bool
	 */
	private static function call_private_static_is_modernized() {
		$method = new \ReflectionMethod( Settings::class, 'is_modernized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return (bool) $method->invoke( null );
	}

	/**
	 * `load_admin_scripts` must enqueue `jp-tracks` on the modernized surface so the
	 * Tracks transport is loaded for `analytics.initialize`'s queue. The legacy
	 * `jetpack-newsletter` bundle must NOT be enqueued when modernization is on.
	 */
	public function test_load_admin_scripts_enqueues_jp_tracks_on_modernized_surface() {
		// Opt into the modernized surface (the default is off).
		add_filter( Settings::MODERNIZATION_FILTER, '__return_true' );
		( new Settings() )->load_admin_scripts();

		$this->assertTrue(
			wp_script_is( 'jp-tracks', 'enqueued' ),
			'jp-tracks must be enqueued on the modernized chassis so analytics.initialize has its transport.'
		);
		$this->assertFalse(
			wp_script_is( 'jetpack-newsletter', 'enqueued' ),
			'Legacy newsletter bundle must not be enqueued when modernization is on.'
		);
	}

	/**
	 * On the legacy surface (opt-out), `load_admin_scripts` must still enqueue
	 * `jp-tracks` AND the legacy `jetpack-newsletter` bundle.
	 */
	public function test_load_admin_scripts_enqueues_legacy_bundle_when_modernization_disabled() {
		add_filter( Settings::MODERNIZATION_FILTER, '__return_false' );

		( new Settings() )->load_admin_scripts();

		$this->assertTrue(
			wp_script_is( 'jp-tracks', 'enqueued' ),
			'jp-tracks must be enqueued on the legacy surface too.'
		);
		$this->assertTrue(
			wp_script_is( 'jetpack-newsletter', 'enqueued' ),
			'Legacy newsletter bundle must be enqueued when modernization is off.'
		);
	}

	/**
	 * `maybe_load_wp_build` is hooked at admin_menu priority 1 on every request,
	 * but it must short-circuit unless the visitor is on `?page=jetpack-newsletter`.
	 * It registers a `current_screen` listener as the easy-to-observe side effect.
	 */
	public function test_maybe_load_wp_build_short_circuits_off_newsletter_admin_request() {
		unset( $_GET['page'] );

		Settings::maybe_load_wp_build();

		$this->assertFalse(
			has_action( 'current_screen', array( Settings::class, 'alias_screen_id_for_wp_build' ) ),
			'maybe_load_wp_build must not register the screen alias when no admin page is requested.'
		);
	}

	/**
	 * When modernization is filtered off, `maybe_load_wp_build` must skip
	 * registering the screen alias even on the Newsletter admin page.
	 */
	public function test_maybe_load_wp_build_short_circuits_when_modernization_disabled() {
		add_filter( Settings::MODERNIZATION_FILTER, '__return_false' );
		set_current_screen( 'dashboard' );
		$_GET['page'] = 'jetpack-newsletter';

		Settings::maybe_load_wp_build();

		$this->assertFalse(
			has_action( 'current_screen', array( Settings::class, 'alias_screen_id_for_wp_build' ) ),
			'maybe_load_wp_build must not register the screen alias when modernization is disabled.'
		);
	}

	/**
	 * `alias_screen_id_for_wp_build` rewrites the current screen's id so wp-build's
	 * auto-generated `<page>-wp-admin` enqueue check passes. The slug we expose
	 * to admins stays `jetpack-newsletter`, but wp-build expects
	 * `jetpack-newsletter-dashboard` — the alias hides the mismatch.
	 *
	 * @phan-suppress PhanTypeMismatchArgumentProbablyReal -- stdClass stands in for WP_Screen; the production code only requires an object with an `id` property, and instantiating WP_Screen in unit tests is impractical.
	 */
	public function test_alias_screen_id_rewrites_current_screen_id() {
		$screen      = (object) array( 'id' => 'jetpack_page_jetpack-newsletter' );
		$original_id = $screen->id;

		Settings::alias_screen_id_for_wp_build( $screen );

		$this->assertSame(
			'jetpack-newsletter-dashboard',
			$screen->id,
			'alias must rewrite the screen id so wp-build enqueue checks pass.'
		);
		$this->assertNotSame( $original_id, $screen->id );
	}

	/**
	 * The alias is called from the `current_screen` action, which can pass null
	 * before the screen is set. The guard must accept that without warning.
	 *
	 * @phan-suppress PhanTypeMismatchArgumentProbablyReal -- the whole point of this test is to drive non-WP_Screen values through the `is_object()` guard.
	 */
	public function test_alias_screen_id_is_noop_for_non_object_input() {
		// Calling with null/false/string must not warn or throw.
		Settings::alias_screen_id_for_wp_build( null );
		Settings::alias_screen_id_for_wp_build( false );
		Settings::alias_screen_id_for_wp_build( 'not-a-screen' );

		$this->expectNotToPerformAssertions();
	}
}
