<?php
/**
 * Test the My Jetpack Initializer.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Partner_Coupon;
use Automattic\Jetpack\Status\Cache as StatusCache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Tests for the Initializer class.
 */
class Initializer_Test extends BaseTestCase {
	/**
	 * Set up before each test.
	 */
	public function set_up() {
		$this->reset_state();

		// WorDBless boots no plugin, so nothing has run Manager::configure(). Without its
		// mapping, `jetpack_connect` resolves to no capability at all, for every user.
		add_filter( 'map_meta_cap', array( new Connection_Manager(), 'jetpack_connection_custom_caps' ), 1, 4 );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		$this->reset_state();
	}

	/**
	 * Reset every piece of global state these tests touch, so each test starts
	 * from a clean slate regardless of what ran before it in the shared process.
	 *
	 * Runs from both set_up() and tear_down() so the two can't drift.
	 */
	private function reset_state() {
		Constants::clear_constants();
		StatusCache::clear();
		unset(
			$_GET['page'],
			$_GET['step'],
			$_GET['showCouponRedemption'],
			$_GET['action'],
			$_GET['connect_url_redirect'],
			$_GET['from'],
			$_GET['skip_pricing'],
			$_GET['redirect_after_auth']
		);
		wp_set_current_user( 0 );
		Jetpack_Options::delete_option(
			array(
				'id',
				'blog_token',
				'master_user',
				'user_tokens',
				'unique_registrations',
				Partner_Coupon::$coupon_option,
			)
		);
		remove_all_filters( 'jetpack_partner_coupon_supported_partners' );
		remove_all_filters( 'jetpack_partner_coupon_supported_presets' );
		remove_all_filters( 'jetpack_partner_coupon_products' );
		remove_all_filters( 'jetpack_my_jetpack_should_initialize' );
		remove_all_filters( 'jetpack_offline_mode' );
		remove_all_filters( 'jetpack_feature_flag_enabled_my-jetpack-onboarding-wizard' );

		// Connection_Manager memoizes is_connected() in a process-wide static that
		// WorDBless teardown does not reset. The admin_init tests that depend on that
		// memo run in their own process (see #[RunInSeparateProcess]), so isolation,
		// not this line, is what keeps them from reading a sibling test's connection
		// state. The reset is kept as defense-in-depth for any future shared-process
		// test in this file that reads connection state.
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * An editor with no Jetpack parent menu still reaches admin_init() through the fallback hook.
	 *
	 * The page is hand-registered with no jetpack parent, which is what makes core fall back to the
	 * admin_page_ name; without the Jetpack plugin, admin-ui registers that parent for every editor.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_editor_page_loads_without_a_jetpack_parent_menu() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'my_jetpack_editor',
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);
		add_filter( 'jetpack_offline_mode', '__return_false' );
		$GLOBALS['menu']             = array();
		$GLOBALS['submenu']          = array();
		$GLOBALS['admin_page_hooks'] = array();
		Initializer::add_my_jetpack_menu_item();
		$hook = add_submenu_page( 'jetpack', 'My Jetpack', 'My Jetpack', 'edit_posts', 'my-jetpack', array( Initializer::class, 'admin_page' ) );
		$this->assertSame( 'admin_page_my-jetpack', $hook );
		$enqueue = array( Initializer::class, 'enqueue_scripts' );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', $enqueue ) );

		do_action( 'load-' . $hook ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- WordPress core page-load hook.

		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', $enqueue ), 'Expected the page load to reach admin_init().' );
	}

	/**
	 * Onboarding is available on regular (non-Simple) sites.
	 */
	public function test_onboarding_is_available_by_default() {
		$this->assertTrue( Initializer::is_onboarding_available() );
	}

	/**
	 * Onboarding is never available on WordPress.com Simple sites.
	 */
	public function test_onboarding_is_not_available_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertFalse( Initializer::is_onboarding_available() );
	}

	/**
	 * Onboarding stays available on WordPress.com Atomic (WoA) sites: only
	 * Simple sites are excluded, not the whole WordPress.com platform.
	 *
	 * The constants below make Host::is_woa_site() true, which no other test
	 * sets up, so this is the only test that would catch a broadening of the
	 * exclusion from is_wpcom_simple() to is_wpcom_platform(). Don't delete it
	 * as a duplicate of the by-default test: that one sets no constants and
	 * can't tell the two classifiers apart.
	 */
	public function test_onboarding_is_available_on_woa() {
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 123 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/tmp/wpcomsh/wpcomsh.php' );
		StatusCache::clear();

		$this->assertTrue( Initializer::is_onboarding_available() );
	}

	/**
	 * Turn the setup wizard's feature flag on for one test.
	 */
	private function enable_wizard_flag() {
		add_filter( 'jetpack_feature_flag_enabled_my-jetpack-onboarding-wizard', '__return_true' );
	}

	/**
	 * With its flag on, the wizard runs on a self-hosted site.
	 */
	public function test_wizard_is_enabled_on_self_hosted_with_the_flag_on() {
		$this->enable_wizard_flag();

		$this->assertTrue( Initializer::is_onboarding_wizard_enabled() );
		$this->assertNotNull( Initializer::get_onboarding_wizard_state() );
	}

	/**
	 * The wizard is off by default, flag or no platform.
	 */
	public function test_wizard_is_disabled_by_default() {
		$this->assertFalse( Initializer::is_onboarding_wizard_enabled() );
		$this->assertNull( Initializer::get_onboarding_wizard_state() );
	}

	/**
	 * The wizard never runs on WordPress.com Simple, even with its flag on: the
	 * platform owns the connection and nobody chose to install Jetpack there.
	 */
	public function test_wizard_is_disabled_on_wpcom_simple() {
		$this->enable_wizard_flag();
		Constants::set_constant( 'IS_WPCOM', true );
		StatusCache::clear();

		$this->assertFalse( Initializer::is_onboarding_wizard_enabled() );
		$this->assertNull( Initializer::get_onboarding_wizard_state() );
	}

	/**
	 * The wizard never runs on WordPress.com Atomic either, and this is the case
	 * that matters: wpcomsh filters `jetpack_is_connection_ready` to require a
	 * connection owner, so a WoA site that lost its owner reports disconnected and
	 * is redirected into onboarding while WordPress.com still manages it.
	 *
	 * Note this deliberately differs from is_onboarding_available(), which stays
	 * true on WoA — only the wizard is gated, the existing takeover is untouched.
	 */
	public function test_wizard_is_disabled_on_woa() {
		$this->enable_wizard_flag();
		Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 123 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/tmp/wpcomsh/wpcomsh.php' );
		StatusCache::clear();

		$this->assertFalse( Initializer::is_onboarding_wizard_enabled() );
		$this->assertNull( Initializer::get_onboarding_wizard_state() );
		// The existing onboarding is unaffected by the wizard's gate.
		$this->assertTrue( Initializer::is_onboarding_available() );
	}

	/**
	 * Data provider for the onboarding redirect decision.
	 *
	 * @return array
	 */
	public static function provide_onboarding_redirect_cases() {
		$to_onboarding = array(
			'page' => 'my-jetpack',
			'step' => 'onboarding',
		);
		$to_home       = array( 'page' => 'my-jetpack' );

		return array(
			'available, disconnected, no step: redirect to onboarding' => array( '', false, true, false, $to_onboarding ),
			'available, disconnected, on onboarding: stay' => array( 'onboarding', false, true, false, null ),
			'available, connected, no step: stay'          => array( '', true, true, false, null ),
			'available, connected, on onboarding: redirect home' => array( 'onboarding', true, true, false, $to_home ),
			'unavailable, disconnected, no step: stay'     => array( '', false, false, false, null ),
			'unavailable, disconnected, on onboarding: redirect home' => array( 'onboarding', false, false, false, $to_home ),
			'unavailable, connected, no step: stay'        => array( '', true, false, false, null ),
			'unavailable, connected, on onboarding: redirect home' => array( 'onboarding', true, false, false, $to_home ),
			// The wizard sends the user to WordPress.com and back, so it has to survive connecting.
			'wizard, connected, on onboarding: stay'       => array( 'onboarding', true, true, true, null ),
			'wizard, disconnected, on onboarding: stay'    => array( 'onboarding', false, true, true, null ),
			'wizard, disconnected, no step: redirect to onboarding' => array( '', false, true, true, $to_onboarding ),
			'wizard, connected, no step: stay'             => array( '', true, true, true, null ),
			// Availability still wins: the wizard cannot render where onboarding does not.
			'wizard, connected, unavailable, on onboarding: redirect home' => array( 'onboarding', true, false, true, $to_home ),
		);
	}

	/**
	 * Data provider for the decision once setup has been settled.
	 *
	 * @return array
	 */
	public static function provide_settled_onboarding_cases() {
		return array(
			// The whole point: no more interrupting someone who has been through it.
			'settled, disconnected, no step: stay'       => array( '', false, null ),
			// Asking for it by its own URL still works, so a skip is reversible and a
			// second admin the site-wide flag does not cover can still run it.
			'settled, disconnected, on onboarding: stay' => array( 'onboarding', false, null ),
			// Connecting still ends it, exactly as it does for anyone else.
			'settled, connected, on onboarding: redirect home' => array( 'onboarding', true, array( 'page' => 'my-jetpack' ) ),
		);
	}

	/**
	 * A user who has finished or skipped setup is not sent back into it.
	 *
	 * @dataProvider provide_settled_onboarding_cases
	 *
	 * @param string     $step            The `step` query param.
	 * @param bool       $connection_done Whether the connection setup asks for is in place.
	 * @param array|null $expected        Expected redirect query args, or null to stay.
	 */
	#[DataProvider( 'provide_settled_onboarding_cases' )]
	public function test_settled_onboarding_is_not_offered_again( $step, $connection_done, $expected ) {
		$this->assertSame(
			$expected,
			Initializer::get_onboarding_redirect_args( $step, $connection_done, true, false, true )
		);
	}

	/**
	 * Settling is two facts, and only one of them is site-wide.
	 */
	public function test_completion_is_site_wide_and_skipping_is_not() {
		$this->assertFalse( Initializer::is_onboarding_settled() );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'wizard_skipper',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		update_user_meta( $user_id, Initializer::ONBOARDING_DISMISSED_USER_META, true );

		$this->assertTrue( Initializer::is_onboarding_settled(), 'the user who skipped is settled' );

		$other_id = wp_insert_user(
			array(
				'user_login' => 'wizard_newcomer',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $other_id );

		$this->assertFalse(
			Initializer::is_onboarding_settled(),
			'one admin skipping must not answer for the next'
		);

		\Jetpack_Options::update_option( 'onboarding_completed', true );

		$this->assertTrue(
			Initializer::is_onboarding_settled(),
			'finishing it settles the site, not just the person who did it'
		);
	}

	/**
	 * Nothing else gets to talk over the takeover.
	 */
	public function test_notice_channels_are_emptied_on_the_takeover() {
		$channels = array( 'admin_notices', 'all_admin_notices', 'network_admin_notices', 'user_admin_notices' );

		foreach ( $channels as $channel ) {
			add_action( $channel, '__return_true' );
		}

		$_GET['step'] = 'onboarding';
		Initializer::silence_onboarding_notices();

		foreach ( $channels as $channel ) {
			$this->assertFalse( has_action( $channel ), "$channel should be empty on the takeover" );
		}
	}

	/**
	 * Every other screen keeps its notices, including My Jetpack itself.
	 */
	public function test_notice_channels_are_left_alone_everywhere_else() {
		add_action( 'admin_notices', '__return_true' );

		unset( $_GET['step'] );
		Initializer::silence_onboarding_notices();

		$this->assertNotFalse( has_action( 'admin_notices' ) );
		remove_action( 'admin_notices', '__return_true' );
	}

	/**
	 * JITMs are opted out of by their own filter, not left to the notice sweep,
	 * so they never enqueue their assets in the first place.
	 */
	public function test_jitms_are_hidden_on_the_takeover_only() {
		// The takeover and the dashboard share this screen id, so it cannot decide.
		$screen = 'jetpack_page_my-jetpack';

		$_GET['step'] = 'onboarding';
		$this->assertFalse( Initializer::hide_onboarding_jitms( true, $screen ) );

		unset( $_GET['step'] );
		$this->assertTrue( Initializer::hide_onboarding_jitms( true, $screen ) );

		// A screen that had already opted out stays opted out.
		$_GET['step'] = 'onboarding';
		$this->assertFalse( Initializer::hide_onboarding_jitms( false, $screen ) );
		unset( $_GET['step'] );
		$this->assertFalse( Initializer::hide_onboarding_jitms( false, $screen ) );
	}

	/**
	 * The full-screen class is appended, not glued onto whatever came before it.
	 */
	public function test_the_full_screen_body_class_survives_an_earlier_filter() {
		$this->assertSame(
			'wp-admin jetpack-admin-full-screen',
			Initializer::add_onboarding_admin_body_class( 'wp-admin' )
		);
	}

	/**
	 * The takeover reaches My Jetpack and nothing else, with the flag on or off.
	 */
	public function test_the_takeover_reaches_my_jetpack_only() {
		$this->assertSame( array( 'my-jetpack' ), Initializer::get_onboarding_screens() );

		$this->enable_wizard_flag();
		$this->assertSame( array( 'my-jetpack' ), Initializer::get_onboarding_screens() );

		add_filter( 'jetpack_my_jetpack_onboarding_screens', fn () => array( 'jetpack-boost' ) );
		$this->assertSame( array( 'jetpack-boost' ), Initializer::get_onboarding_screens() );
		remove_all_filters( 'jetpack_my_jetpack_onboarding_screens' );
	}

	/**
	 * The redirect decision is correct for every combination of step,
	 * connection state, and onboarding availability.
	 *
	 * @dataProvider provide_onboarding_redirect_cases
	 *
	 * @param string     $step                 The `step` query param.
	 * @param bool       $connection_done      Whether the connection setup asks for is in place.
	 * @param bool       $onboarding_available Whether onboarding is available on this site.
	 * @param bool       $wizard_enabled       Whether the takeover renders the wizard.
	 * @param array|null $expected             Expected redirect query args, or null to stay.
	 */
	#[DataProvider( 'provide_onboarding_redirect_cases' )]
	public function test_get_onboarding_redirect_args( $step, $connection_done, $onboarding_available, $wizard_enabled, $expected ) {
		$this->assertSame( $expected, Initializer::get_onboarding_redirect_args( $step, $connection_done, $onboarding_available, $wizard_enabled ) );

		if ( ! $wizard_enabled ) {
			// Omitting the argument has to decide exactly as passing it false does,
			// so every existing caller keeps its behaviour.
			$this->assertSame( $expected, Initializer::get_onboarding_redirect_args( $step, $connection_done, $onboarding_available ) );
		}
	}

	/**
	 * The admin page renders the onboarding container when onboarding is requested and available.
	 */
	public function test_admin_page_renders_the_onboarding_container_when_available() {
		$_GET['step'] = 'onboarding';

		ob_start();
		Initializer::admin_page();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="my-jetpack-container"', $output );
	}

	/**
	 * The admin page never renders the onboarding container on WordPress.com Simple sites,
	 * even when the redirect did not run.
	 */
	public function test_admin_page_does_not_render_the_onboarding_container_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$_GET['step'] = 'onboarding';

		ob_start();
		Initializer::admin_page();
		$output = ob_get_clean();

		$this->assertStringNotContainsString( 'my-jetpack-container', $output );
	}

	/**
	 * A disconnected site with no step is funneled into onboarding by admin_init().
	 *
	 * Calls admin_init() itself (not the extracted helper) so the call-site
	 * wiring is covered: the argument order passed to
	 * get_onboarding_redirect_args() and the redirect performed on its result.
	 *
	 * Runs in a separate process. admin_init() makes a real is_connected() call,
	 * which registers Connection_Manager's memo-invalidation hooks once per
	 * process and sets a process-wide "added" flag. WorDBless teardown restores
	 * the hook table but cannot reset that private flag, so a later test in the
	 * same process would find the flag set but the hooks gone and never
	 * reinstall them, leaving its own token writes unable to clear the connection
	 * memo. Isolation keeps that mutation out of the shared process.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_redirects_disconnected_site_to_onboarding() {
		$this->log_in_as_admin();

		$location = $this->capture_onboarding_redirect();

		$this->assertNotNull( $location, 'Expected a redirect.' );
		$this->assertStringContainsString( 'page=my-jetpack', $location );
		$this->assertStringContainsString( 'step=onboarding', $location );
	}

	/**
	 * A connected user stays on the onboarding page when the wizard is enabled,
	 * because connecting happens halfway through it: they authorize on
	 * WordPress.com and are sent back here to finish.
	 *
	 * Separate process for the same reason as the tests around it: admin_init()'s
	 * real is_connected() call leaks Connection_Manager's invalidation-hook
	 * registration flag across tests in a shared process.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_keeps_a_connected_user_on_the_wizard() {
		$user_id = $this->log_in_as_admin();
		$this->connect_owner( $user_id );
		$this->enable_wizard_flag();
		$_GET['step'] = 'onboarding';

		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * With the wizard off, the same connected user is still sent home: the flag
	 * is the only thing that changes this decision.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_still_redirects_a_connected_user_home_without_the_wizard() {
		$user_id = $this->log_in_as_admin();
		$this->connect_owner( $user_id );
		$_GET['step'] = 'onboarding';

		$location = $this->capture_onboarding_redirect();

		$this->assertNotNull( $location );
		$this->assertStringContainsString( 'page=my-jetpack', $location );
		$this->assertStringNotContainsString( 'step=onboarding', $location );
	}

	/**
	 * An onboarding request on a WordPress.com Simple site is redirected home
	 * by admin_init() instead of letting the onboarding screen load.
	 *
	 * Separate process for the same reason as the disconnected test above:
	 * admin_init()'s real is_connected() call leaks Connection_Manager's
	 * invalidation-hook registration flag across tests in a shared process.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_redirects_onboarding_request_home_on_wpcom_simple() {
		$this->log_in_as_admin();
		Constants::set_constant( 'IS_WPCOM', true );
		$_GET['step'] = 'onboarding';

		$location = $this->capture_onboarding_redirect();

		$this->assertNotNull( $location, 'Expected a redirect away from onboarding.' );
		$this->assertStringContainsString( 'page=my-jetpack', $location );
		$this->assertStringNotContainsString( 'step=onboarding', $location );
	}

	/**
	 * A user who cannot connect the site is left on the dashboard instead of onboarding.
	 *
	 * Onboarding's only action is the register endpoint, which answers anyone without
	 * `jetpack_connect` with a 403 — so sending them there would be a dead end.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_keeps_a_user_who_cannot_connect_off_onboarding() {
		$this->log_in_as_editor();

		$this->assertFalse( current_user_can( 'jetpack_connect' ) );
		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * A user who cannot connect is sent back to the dashboard if they ask for onboarding.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_bounces_a_user_who_cannot_connect_off_an_onboarding_request() {
		$this->log_in_as_editor();
		$_GET['step'] = 'onboarding';

		$location = $this->capture_onboarding_redirect();

		$this->assertNotNull( $location, 'Expected a redirect away from onboarding.' );
		$this->assertStringContainsString( 'page=my-jetpack', $location );
		$this->assertStringNotContainsString( 'step=onboarding', $location );
	}

	/**
	 * The route that settles setup only exists where the wizard does.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_the_settle_route_is_registered_only_with_the_wizard() {
		$this->assertArrayNotHasKey( '/my-jetpack/v1/site/onboarding/settled', $this->capture_rest_routes() );

		$this->enable_wizard_flag();

		$this->assertArrayHasKey( '/my-jetpack/v1/site/onboarding/settled', $this->capture_rest_routes() );
	}

	/**
	 * Register My Jetpack's REST routes against a fresh server and return them.
	 *
	 * @return array The registered routes, keyed by path.
	 */
	private function capture_rest_routes() {
		$register = array( Initializer::class, 'register_rest_endpoints' );
		// A fresh server, and through the action: core warns about routes registered
		// anywhere else, and the warning fails the run.
		$GLOBALS['wp_rest_server'] = null;
		add_action( 'rest_api_init', $register );
		$routes = rest_get_server()->get_routes();
		remove_action( 'rest_api_init', $register );

		return $routes;
	}

	/**
	 * A plain visit to the Jetpack dashboard is not ours to take over, flag on.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_leaves_a_plain_jetpack_page_visit_alone() {
		$this->log_in_as_admin();
		$this->enable_wizard_flag();
		$_GET['page'] = 'jetpack';

		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * With the flag off, page=jetpack is not ours to take over either.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_leaves_the_jetpack_page_alone_without_the_wizard() {
		$this->log_in_as_admin();
		$_GET['page'] = 'jetpack';

		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * Network admin is left alone: its Jetpack links are plain and belong to the network.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_leaves_network_admin_alone() {
		$this->log_in_as_admin();
		$this->enable_wizard_flag();
		unset( $GLOBALS['current_screen'] );
		define( 'WP_NETWORK_ADMIN', true );

		$this->assertTrue( is_network_admin() );
		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * `action=register` belongs to Jetpack::admin_page_load(), which runs on a later hook.
	 *
	 * Answering it here sends an unregistered site to onboarding instead of to
	 * WordPress.com, and rebuilds the URL without the `redirect` and `from` it carried.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_leaves_a_register_request_to_the_jetpack_plugin() {
		$this->log_in_as_admin();
		$this->enable_wizard_flag();
		$_GET['page']   = 'jetpack';
		$_GET['action'] = 'register';
		$_GET['from']   = 'jetpack-settings';

		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * `connect_url_redirect` belongs to the connection package's Webhooks, likewise.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_leaves_a_connect_url_redirect_to_the_webhooks() {
		$this->log_in_as_admin();
		$this->enable_wizard_flag();
		$_GET['page']                 = 'jetpack';
		$_GET['connect_url_redirect'] = '1';
		$_GET['from']                 = 'checkout';
		$_GET['skip_pricing']         = '1';
		$_GET['redirect_after_auth']  = 'https://example.org/wp-admin/admin.php?page=jetpack';

		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * My Jetpack's own arguments must not call off the redirect.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_still_redirects_my_jetpack_carrying_other_args() {
		$this->log_in_as_admin();
		$_GET['page']                 = 'my-jetpack';
		$_GET['showCouponRedemption'] = '1';

		$location = $this->capture_onboarding_redirect();

		$this->assertNotNull( $location, 'Expected My Jetpack to stay exempt.' );
		$this->assertStringContainsString( 'step=onboarding', $location );
	}

	/**
	 * A site only a standalone plugin has registered still gets the wizard.
	 *
	 * The gate reads `unique_registrations`, which the Jetpack plugin alone writes, so the
	 * blog ID Boost, Protect or Social left behind is not Jetpack history.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_the_wizard_runs_for_a_standalone_plugin_user() {
		$this->enable_wizard_flag();
		// A blog ID with no token: registered by a standalone plugin, not connected now.
		Jetpack_Options::update_option( 'id', 1234 );
		( new Connection_Manager() )->reset_connection_status();

		$this->assertTrue( Initializer::has_never_registered_jetpack() );
		$this->assertTrue( Initializer::is_onboarding_wizard_enabled() );
		$this->assertNotNull( Initializer::get_onboarding_wizard_state() );
	}

	/**
	 * A site the Jetpack plugin has registered before does not get the wizard.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_previous_jetpack_registration_closes_the_wizard() {
		$this->enable_wizard_flag();
		Jetpack_Options::update_option( 'unique_registrations', 2 );

		$this->assertFalse( Initializer::has_never_registered_jetpack() );
		$this->assertFalse( Initializer::is_onboarding_wizard_enabled() );
		$this->assertNull( Initializer::get_onboarding_wizard_state() );
	}

	/**
	 * Connecting mid-run does not close the wizard on the user doing it.
	 *
	 * The wizard registers the site at its first step, and registration is where the
	 * Jetpack plugin counts it. Without the connected site exempting itself, the trip back
	 * from WordPress.com would land on the plain connection screen instead of step two.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_connecting_mid_run_does_not_close_the_wizard() {
		$user_id = $this->log_in_as_admin();
		$this->enable_wizard_flag();
		$this->connect_owner( $user_id );
		Jetpack_Options::update_option( 'unique_registrations', 1 );

		$this->assertFalse( Initializer::has_never_registered_jetpack() );
		$this->assertTrue( Initializer::is_onboarding_wizard_enabled() );
		$this->assertNotNull( Initializer::get_onboarding_wizard_state() );
	}

	/**
	 * A site-only connection is not a finished setup, so the user is sent back into it.
	 *
	 * Leaving at the WordPress.com stage registers the site and connects nobody, which
	 * `is_connected()` reports as connected for good.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_sends_a_site_only_connection_back_into_setup() {
		$this->log_in_as_admin();
		$this->enable_wizard_flag();
		$this->connect_site_only();

		$this->assertTrue( ( new Connection_Manager() )->is_connected() );
		$this->assertFalse( ( new Connection_Manager() )->has_connected_owner() );

		$location = $this->capture_onboarding_redirect();

		$this->assertNotNull( $location, 'Expected a redirect back into setup.' );
		$this->assertStringContainsString( 'step=onboarding', $location );
	}

	/**
	 * With the wizard off, the same site-only connection is left where it is.
	 *
	 * The single screen's one control registers a site that is already registered, and it
	 * hides the admin menu, the toolbar and the footer, so arriving there is a dead end.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_leaves_a_site_only_connection_alone_without_the_wizard() {
		$this->log_in_as_admin();
		$this->connect_site_only();

		$this->assertFalse( Initializer::is_onboarding_wizard_enabled() );
		$this->assertTrue( ( new Connection_Manager() )->is_connected() );
		$this->assertFalse( ( new Connection_Manager() )->has_connected_owner() );

		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * An onboarding request on that site is sent home, so nobody stays stranded on it.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_bounces_a_site_only_connection_out_of_setup_without_the_wizard() {
		$this->log_in_as_admin();
		$this->connect_site_only();
		$_GET['step'] = 'onboarding';

		$location = $this->capture_onboarding_redirect();

		$this->assertNotNull( $location, 'Expected a redirect out of setup.' );
		$this->assertStringContainsString( 'page=my-jetpack', $location );
		$this->assertStringNotContainsString( 'step=onboarding', $location );
	}

	/**
	 * A connection whose owner was removed is left alone too, with the wizard off.
	 *
	 * The owner resolves through `get_userdata()`, so deleting that user makes a fully
	 * connected site answer no, on any host and not just the Atomic one the wizard's
	 * gate describes.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_leaves_a_connection_without_an_owner_alone_without_the_wizard() {
		$this->log_in_as_admin();
		// Reporting the missing owner is a request to WordPress.com.
		$this->block_http();
		$removed_id = 4242;
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'master_user', $removed_id );
		Jetpack_Options::update_option( 'user_tokens', array( $removed_id => "honey.badger.$removed_id" ) );
		( new Connection_Manager() )->reset_connection_status();

		$this->assertFalse( get_userdata( $removed_id ) );
		$this->assertTrue( ( new Connection_Manager() )->is_connected() );
		$this->assertFalse( ( new Connection_Manager() )->has_connected_owner() );

		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * Run Initializer::admin_init() and capture the redirect it attempts.
	 *
	 * The wp_redirect filter throws so the exit() that follows the redirect
	 * call never runs; the location is captured before the throw.
	 *
	 * @param callable|null $trigger What reaches admin_init(), for callers testing a route into it.
	 *                               Defaults to calling it directly.
	 * @return string|null The redirect location, or null when no redirect happened.
	 */
	private function capture_onboarding_redirect( ?callable $trigger = null ) {
		$location = null;
		$capture  =
			/** @return never */
			function ( $redirect_location ) use ( &$location ) {
				$location = $redirect_location;
				throw new \Exception( 'Intercepted redirect to skip exit().' );
			};
		$trigger  = $trigger === null ? array( Initializer::class, 'maybe_redirect_to_onboarding' ) : $trigger;

		// The redirect reads `page` and answers nothing but a GET.
		$_GET['page']            ??= 'my-jetpack';
		$_SERVER['REQUEST_METHOD'] = 'GET';

		add_filter( 'wp_redirect', $capture );
		try {
			$trigger();
		} catch ( \Exception $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- Expected: thrown by the capture filter above.
		} finally {
			remove_filter( 'wp_redirect', $capture );
		}

		return $location;
	}

	/**
	 * The AI card keeps its legacy action without a compatible Jetpack plugin.
	 */
	public function test_my_jetpack_flags_hide_the_ai_module_toggle_without_compatible_jetpack() {
		$this->assertFalse( Initializer::get_my_jetpack_flags()['showAiModuleToggle'] );
	}

	/**
	 * No coupon, no coupon screen.
	 */
	public function test_partner_coupon_screen_is_null_without_a_coupon() {
		$this->log_in_as_admin();
		$this->pretend_jetpack_plugin_is_active();

		$this->assertNull( Initializer::get_partner_coupon_screen() );
	}

	/**
	 * An unregistered site with a coupon gets the screen, with the Jetpack plugin's images.
	 */
	public function test_partner_coupon_screen_shows_while_no_owner_is_connected() {
		$this->log_in_as_admin();
		$this->pretend_jetpack_plugin_is_active();
		$this->set_up_partner_coupon();

		$screen = Initializer::get_partner_coupon_screen();

		$this->assertIsArray( $screen );
		$this->assertSame( 'JPTST_JPTA_abc123', $screen['coupon']['coupon_code'] );
		$this->assertSame( plugins_url( '', WP_PLUGIN_DIR . '/jetpack/jetpack.php' ), $screen['assetBaseUrl'] );
	}

	/**
	 * A blog token without a connected owner still gets the screen (the gate is has_connected_owner()).
	 */
	public function test_partner_coupon_screen_shows_with_a_blog_token_but_no_owner() {
		$this->log_in_as_admin();
		$this->pretend_jetpack_plugin_is_active();
		$this->set_up_partner_coupon();
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		( new Connection_Manager() )->reset_connection_status();

		$this->assertNotNull( Initializer::get_partner_coupon_screen() );
	}

	/**
	 * A connected owner only sees the screen when a link asks for it.
	 */
	public function test_partner_coupon_screen_is_null_for_a_connected_owner_without_the_param() {
		$this->connect_owner( $this->log_in_as_admin() );
		$this->pretend_jetpack_plugin_is_active();
		$this->set_up_partner_coupon();

		$this->assertNull( Initializer::get_partner_coupon_screen() );
	}

	/**
	 * The JITM and partner links carry showCouponRedemption for connected owners.
	 */
	public function test_partner_coupon_screen_shows_for_a_connected_owner_with_the_param() {
		$this->connect_owner( $this->log_in_as_admin() );
		$this->pretend_jetpack_plugin_is_active();
		$this->set_up_partner_coupon();
		$_GET['showCouponRedemption'] = '1';

		$this->assertNotNull( Initializer::get_partner_coupon_screen() );
	}

	/**
	 * Only administrators can redeem.
	 */
	public function test_partner_coupon_screen_is_null_for_non_admins() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'coupon_editor',
					'user_pass'  => 'pass',
					'role'       => 'editor',
				)
			)
		);
		$this->pretend_jetpack_plugin_is_active();
		$this->set_up_partner_coupon();

		$this->assertNull( Initializer::get_partner_coupon_screen() );
	}

	/**
	 * Where My Jetpack is off (WoA non-classic, VIP, host filters) the coupon screen is dropped.
	 */
	public function test_partner_coupon_screen_is_null_where_my_jetpack_is_off() {
		$this->log_in_as_admin();
		$this->pretend_jetpack_plugin_is_active();
		$this->set_up_partner_coupon();
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );

		$this->assertNull( Initializer::get_partner_coupon_screen() );
	}

	/**
	 * Offline sites never show the coupon screen.
	 */
	public function test_partner_coupon_screen_is_null_offline() {
		$this->log_in_as_admin();
		$this->pretend_jetpack_plugin_is_active();
		$this->set_up_partner_coupon();
		add_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();

		$this->assertNull( Initializer::get_partner_coupon_screen() );
	}

	/**
	 * Without the Jetpack plugin there are no coupon images to show.
	 *
	 * Separate process: the mock Jetpack plugin other tests activate defines the constant for real.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_partner_coupon_screen_is_null_without_the_jetpack_plugin() {
		$this->log_in_as_admin();
		$this->set_up_partner_coupon();

		$this->assertFalse( defined( 'JETPACK__PLUGIN_FILE' ) );
		$this->assertNull( Initializer::get_partner_coupon_screen() );
	}

	/**
	 * The coupon's connect screen replaces onboarding.
	 */
	public function test_onboarding_yields_to_the_partner_coupon_screen() {
		$this->log_in_as_admin();
		$this->pretend_jetpack_plugin_is_active();
		$this->set_up_partner_coupon();

		$this->assertFalse( Initializer::is_onboarding_available() );
	}

	/**
	 * An unregistered coupon site stays on My Jetpack instead of going to onboarding.
	 *
	 * Separate process for the same reason as the other admin_init() tests.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_keeps_an_unconnected_coupon_site_off_onboarding() {
		$this->log_in_as_admin();
		$this->pretend_jetpack_plugin_is_active();
		$this->set_up_partner_coupon();
		$this->block_http();

		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * The showCouponRedemption param no longer bounces to the legacy dashboard.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_init_no_longer_bounces_coupon_redemption_to_page_jetpack() {
		$this->connect_owner( $this->log_in_as_admin() );
		$this->pretend_jetpack_plugin_is_active();
		$this->set_up_partner_coupon();
		$this->block_http();
		$_GET['showCouponRedemption'] = '1';

		$this->assertNull( $this->capture_onboarding_redirect() );
	}

	/**
	 * Log in as a fresh administrator.
	 *
	 * @return int The user ID.
	 */
	private function log_in_as_admin() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'coupon_admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Log in as a fresh editor, who has the page's capability but not the connection's.
	 *
	 * @return int The user ID.
	 */
	private function log_in_as_editor() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'my_jetpack_editor',
				'user_pass'  => 'pass',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Pretend the Jetpack plugin is active, which is what supplies the coupon's images.
	 */
	private function pretend_jetpack_plugin_is_active() {
		Constants::set_constant( 'JETPACK__PLUGIN_FILE', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
	}

	/**
	 * Store a coupon that Partner_Coupon::get_coupon() accepts.
	 */
	private function set_up_partner_coupon() {
		add_filter(
			'jetpack_partner_coupon_supported_partners',
			static function () {
				return array(
					'JPTST' => array(
						'name' => 'Jetpack Test Partner',
						'logo' => array(
							'src'    => '/images/ionos-logo.jpg',
							'width'  => 119,
							'height' => 32,
						),
					),
				);
			}
		);
		add_filter(
			'jetpack_partner_coupon_supported_presets',
			static function () {
				return array( 'JPTA' => 'jetpack_backup_daily' );
			}
		);
		add_filter(
			'jetpack_partner_coupon_products',
			static function () {
				return array(
					array(
						'title'       => 'Jetpack Backup',
						'slug'        => 'jetpack_backup_daily',
						'description' => 'Backups.',
						'features'    => array( 'Daily backups' ),
					),
				);
			}
		);
		Jetpack_Options::update_option( Partner_Coupon::$coupon_option, 'JPTST_JPTA_abc123' );
	}

	/**
	 * Register the site and connect nobody: the state leaving setup early produces.
	 */
	private function connect_site_only() {
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Register the site and connect the given user as its owner.
	 *
	 * @param int $user_id The owner.
	 */
	private function connect_owner( $user_id ) {
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'master_user', $user_id );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "honey.badger.$user_id" ) );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Fail every HTTP request fast.
	 */
	private function block_http() {
		add_filter(
			'pre_http_request',
			static function () {
				return new \WP_Error( 'http_blocked', 'Blocked in tests.' );
			}
		);
	}
}
