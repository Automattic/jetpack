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
		unset( $GLOBALS['jetpack_newsletter_test_is_automattician'] );
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
	 * `add_wp_admin_menu`, and `load_admin_scripts`. Its default — the value
	 * `apply_filters` receives — is the staged-rollout cohort. With the percentage
	 * cohort held at 0% and no Automattician in the test environment, the default
	 * must be false.
	 */
	public function test_is_modernized_defaults_to_false_outside_rollout() {
		$this->assertFalse(
			self::call_private_static_is_modernized(),
			'Modernization gate must default to false when the site is not in the rollout cohort.'
		);
	}

	/**
	 * The rollout now spans *all* sites: removing the old wpcom-platform gate means a
	 * self-hosted (non-wpcom) Jetpack site with a resolvable wpcom blog ID enters the
	 * percentage cohort just like Simple/WoA, bucketed on its stored wpcom ID. At the
	 * current 0% it is not enrolled; once the percentage is raised it would be, which
	 * is exactly the "all sites" behavior this asserts against the live constant.
	 */
	public function test_self_hosted_connected_site_bucketed_on_wpcom_id() {
		\Jetpack_Options::update_option( 'id', 200 ); // Non-wpcom site, but a connected wpcom blog ID.

		try {
			$this->assertSame(
				( 200 % 100 ) < Settings::MODERNIZATION_ROLLOUT_PERCENTAGE,
				Settings::is_modernization_rollout_enabled(),
				'A self-hosted connected Jetpack site must be bucketed on its wpcom blog ID against the rollout percentage.'
			);
		} finally {
			\Jetpack_Options::delete_option( 'id' );
		}
	}

	/**
	 * Simple sites can be upgraded to Atomic (WoA). The cohort keys on the wpcom blog
	 * ID, which is preserved across the transfer (read from `jetpack_options['id']` on
	 * WoA, not the current blog ID), so a site's enrollment decision is identical
	 * before and after the upgrade — it never silently flips on transfer. Asserted
	 * against the live percentage so it holds at 0% and after a bump alike.
	 */
	public function test_woa_site_bucketed_on_stable_wpcom_blog_id() {
		$this->set_woa_constants();
		\Jetpack_Options::update_option( 'id', 200 ); // 200 % 100 = 0.

		try {
			$this->assertSame(
				( 200 % 100 ) < Settings::MODERNIZATION_ROLLOUT_PERCENTAGE,
				Settings::is_modernization_rollout_enabled(),
				'A WoA site must be bucketed on its stable wpcom blog ID against the rollout percentage.'
			);
		} finally {
			$this->clear_woa_constants();
		}
	}

	/**
	 * On a site where the wpcom blog ID can't be resolved (e.g. a freshly transferred
	 * WoA site before its connection settles, or a disconnected self-hosted site), the
	 * site must not be bucketed as blog ID 0 and enrolled by accident once the
	 * percentage is non-zero. This holds regardless of the percentage.
	 */
	public function test_rollout_disabled_when_wpcom_blog_id_unavailable() {
		$this->set_woa_constants();
		\Jetpack_Options::delete_option( 'id' );

		try {
			$this->assertFalse(
				Settings::is_modernization_rollout_enabled(),
				'A site with no resolvable wpcom blog ID must not be enrolled.'
			);
		} finally {
			$this->clear_woa_constants();
		}
	}

	/**
	 * Mark the environment as a WordPress.com on Atomic (WoA) site: Atomic platform
	 * constants plus the wpcomsh marker `Host::is_woa_site()` keys on. Clears the
	 * Host cache so the freshly-set constants are observed.
	 */
	private function set_woa_constants() {
		\Automattic\Jetpack\Constants::set_constant( 'ATOMIC_SITE_ID', 12345 );
		\Automattic\Jetpack\Constants::set_constant( 'ATOMIC_CLIENT_ID', 70 );
		\Automattic\Jetpack\Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/wpcomsh/wpcomsh.php' );
		\Automattic\Jetpack\Status\Cache::clear();
	}

	/**
	 * Undo `set_woa_constants()` and any wpcom blog ID stored for the WoA scenario.
	 */
	private function clear_woa_constants() {
		\Automattic\Jetpack\Constants::clear_single_constant( 'ATOMIC_SITE_ID' );
		\Automattic\Jetpack\Constants::clear_single_constant( 'ATOMIC_CLIENT_ID' );
		\Automattic\Jetpack\Constants::clear_single_constant( 'WPCOMSH__PLUGIN_FILE' );
		\Automattic\Jetpack\Status\Cache::clear();
		\Jetpack_Options::delete_option( 'id' );
	}

	/**
	 * A WordPress.com Simple site is bucketed on its current blog ID (not the stored
	 * `jetpack_options['id']`). WorDBless reports blog ID 1, so this verifies the
	 * Simple branch feeds the right ID into the bucket math. Asserted against the live
	 * percentage so it holds at 0% and after a bump alike.
	 */
	public function test_wpcom_simple_site_bucketed_on_current_blog_id() {
		\Automattic\Jetpack\Constants::set_constant( 'IS_WPCOM', true );

		try {
			$this->assertSame(
				( (int) get_current_blog_id() % 100 ) < Settings::MODERNIZATION_ROLLOUT_PERCENTAGE,
				Settings::is_modernization_rollout_enabled(),
				'A WordPress.com Simple site must be bucketed on its current blog ID against the rollout percentage.'
			);
		} finally {
			\Automattic\Jetpack\Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	/**
	 * Automatticians get the modernized experience by default so they can dogfood it
	 * outside the percentage cohort. On Simple this rides the `is_automattician()`
	 * global, which enrolls a11ns regardless of whether the site's blog ID falls in
	 * the percentage bucket — the only path that enrolls anyone while the percentage
	 * is held at 0%.
	 *
	 * The Atomic half of the carve-out — `Visitor::is_automattician_feature_flags_only()`,
	 * driven by `AT_PROXIED_REQUEST` — is intentionally not given a dedicated test: its
	 * *true* path is `Visitor`'s own contract (covered in the jetpack-status package), and
	 * setting `AT_PROXIED_REQUEST` requires an irreversible `define()` that would need
	 * `@runInSeparateProcess` (which trips a PHP 7.x WP-core bootstrap warning under
	 * `failOnWarning`). Its *false* path — that the `Visitor` call is wired in and doesn't
	 * fatal — is already exercised by every non-a11n cohort test below, where the `||`
	 * does not short-circuit and so evaluates the `Visitor` branch.
	 */
	public function test_rollout_enabled_for_automattician() {
		$GLOBALS['jetpack_newsletter_test_is_automattician'] = true;

		$this->assertTrue(
			Settings::is_modernization_rollout_enabled(),
			'Automatticians must be enrolled in the modernization rollout by default.'
		);
	}

	/**
	 * The a11n enrollment is only the filter *default*: an Automattician who wants
	 * the legacy view back must still be able to force it with `__return_false`,
	 * so the check has to live in the default fed to `apply_filters`, never as a
	 * post-filter override.
	 */
	public function test_automattician_default_is_still_overridable_by_filter() {
		$GLOBALS['jetpack_newsletter_test_is_automattician'] = true;
		add_filter( Settings::MODERNIZATION_FILTER, '__return_false' );

		$this->assertFalse(
			self::call_private_static_is_modernized(),
			'An Automattician must be able to opt back into the legacy view with __return_false.'
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
