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
		unset( $_GET['step'], $_GET['showCouponRedemption'] );
		wp_set_current_user( 0 );
		Jetpack_Options::delete_option( array( 'id', 'blog_token', 'master_user', 'user_tokens', Partner_Coupon::$coupon_option ) );
		remove_all_filters( 'jetpack_partner_coupon_supported_partners' );
		remove_all_filters( 'jetpack_partner_coupon_supported_presets' );
		remove_all_filters( 'jetpack_partner_coupon_products' );
		remove_all_filters( 'jetpack_my_jetpack_should_initialize' );
		remove_all_filters( 'jetpack_offline_mode' );

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

		$location = $this->capture_admin_init_redirect(
			static function () use ( $hook ) {
				do_action( 'load-' . $hook ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- WordPress core page-load hook.
			}
		);

		$this->assertNotNull( $location, 'Expected the page load to reach admin_init().' );
		$this->assertStringContainsString( 'step=onboarding', $location );
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
			'available, disconnected, no step: redirect to onboarding' => array( '', false, true, $to_onboarding ),
			'available, disconnected, on onboarding: stay' => array( 'onboarding', false, true, null ),
			'available, connected, no step: stay'          => array( '', true, true, null ),
			'available, connected, on onboarding: redirect home' => array( 'onboarding', true, true, $to_home ),
			'unavailable, disconnected, no step: stay'     => array( '', false, false, null ),
			'unavailable, disconnected, on onboarding: redirect home' => array( 'onboarding', false, false, $to_home ),
			'unavailable, connected, no step: stay'        => array( '', true, false, null ),
			'unavailable, connected, on onboarding: redirect home' => array( 'onboarding', true, false, $to_home ),
		);
	}

	/**
	 * The redirect decision is correct for every combination of step,
	 * connection state, and onboarding availability.
	 *
	 * @dataProvider provide_onboarding_redirect_cases
	 *
	 * @param string     $step                 The `step` query param.
	 * @param bool       $is_connected         Whether the site is connected.
	 * @param bool       $onboarding_available Whether onboarding is available on this site.
	 * @param array|null $expected             Expected redirect query args, or null to stay.
	 */
	#[DataProvider( 'provide_onboarding_redirect_cases' )]
	public function test_get_onboarding_redirect_args( $step, $is_connected, $onboarding_available, $expected ) {
		$this->assertSame( $expected, Initializer::get_onboarding_redirect_args( $step, $is_connected, $onboarding_available ) );
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
		$location = $this->capture_admin_init_redirect();

		$this->assertNotNull( $location, 'Expected admin_init() to redirect.' );
		$this->assertStringContainsString( 'page=my-jetpack', $location );
		$this->assertStringContainsString( 'step=onboarding', $location );
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
		Constants::set_constant( 'IS_WPCOM', true );
		$_GET['step'] = 'onboarding';

		$location = $this->capture_admin_init_redirect();

		$this->assertNotNull( $location, 'Expected admin_init() to redirect away from onboarding.' );
		$this->assertStringContainsString( 'page=my-jetpack', $location );
		$this->assertStringNotContainsString( 'step=onboarding', $location );
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
	private function capture_admin_init_redirect( ?callable $trigger = null ) {
		$location = null;
		$capture  =
			/** @return never */
			function ( $redirect_location ) use ( &$location ) {
				$location = $redirect_location;
				throw new \Exception( 'Intercepted redirect to skip exit().' );
			};
		$trigger  = $trigger === null ? array( Initializer::class, 'admin_init' ) : $trigger;

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

		$this->assertNull( $this->capture_admin_init_redirect() );
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

		$this->assertNull( $this->capture_admin_init_redirect() );
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
