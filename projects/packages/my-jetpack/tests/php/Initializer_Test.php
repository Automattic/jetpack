<?php
/**
 * Test the My Jetpack Initializer.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Utils;
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
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_offline_seed_with_copied_credentials_does_not_start_cloud_work() {
		$user = wp_insert_user(
			array(
				'user_login' => 'copied-admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user );
		Utils::init_default_constants();
		Jetpack_Options::update_options(
			array(
				'id'          => 123,
				'blog_token'  => 'copiedkey.copiedsecret',
				'master_user' => $user,
				'user_tokens' => array( $user => 'copied.secret.1' ),
			)
		);
		add_filter( 'jetpack_offline_mode', '__return_true' );
		add_filter( 'jetpack_my_jetpack_offline_features', '__return_true' );
		$attempts = array();
		$tripwire = function ( $response, $args, $url ) use ( &$attempts ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- WordPress HTTP filter signature.
			$attempts[] = $url;
			return new \WP_Error( 'unexpected_http', 'Offline initialization attempted HTTP.' );
		};
		add_filter( 'pre_http_request', $tripwire, 10, 3 );
		$key = Historically_Active_Modules::UPDATE_HISTORICALLY_ACTIVE_JETPACK_MODULES_KEY;
		set_transient( $key, true );
		try {
			Client::wpcom_json_api_request_as_blog( '/sites/123', '1.1' );
			$this->assertCount( 1, $attempts, 'The signed control request must reach the HTTP tripwire.' );
			$attempts     = array();
			$_GET['page'] = 'my-jetpack';
			$_GET['step'] = 'onboarding';
			Initializer::init();
			Initializer::admin_init();
			Initializer::enqueue_scripts();
			do_action( 'rest_api_init' );
			$data = Initializer::add_admin_script_data( array() );
			$this->assertNotEmpty( $data['myJetpack']['offlineFeatures']['mainFeatures']['features'] );
			$this->assertTrue( Initializer::should_initialize() );
			$this->assertSame( 1, did_action( 'my_jetpack_init' ) );
			$this->assertTrue( get_transient( $key ) );
			$this->assertFalse( has_action( 'admin_init', array( Initializer::class, 'setup_historically_active_jetpack_modules_sync' ) ) );
			$this->assertFalse( has_action( 'admin_menu', array( Initializer::class, 'maybe_show_red_bubble' ) ) );
			$this->assertFalse( Initializer::is_onboarding_takeover() );
			$this->assertNull( Initializer::get_partner_coupon_screen() );
			$server = rest_get_server();
			$route  = '/wpcom/v2/my-jetpack/site/features';
			$this->assertSame( Main_Features::get_state( true ), $server->dispatch( new \WP_REST_Request( 'GET', $route ) )->get_data() );
			$request = new \WP_REST_Request( 'POST', $route . '/bulk' );
			$request->set_param( 'active', false );
			$this->assertSame( Main_Features::get_state( true ), $server->dispatch( $request )->get_data()['state'] );
			foreach ( array( '/my-jetpack/v1/site', '/my-jetpack/v1/site/products', '/my-jetpack/v1/site/purchases', '/my-jetpack/v1/site/jetpack-modules', '/my-jetpack/v1/site/notifications', $route . '/banner/dismiss' ) as $absent ) {
				$this->assertArrayNotHasKey( $absent, $server->get_routes() );
			}
			$register_modules = function () {
				register_rest_route(
					'jetpack/v4',
					'module/all',
					array(
						'methods'             => 'GET',
						'permission_callback' => '__return_true',
						'callback'            => function () {
							return rest_ensure_response( array( get_option( 'monitor_receive_notifications', 'does_not_exist' ), get_option( 'post_by_email_address' . get_current_user_id(), 'does_not_exist' ) ) );
						},
					)
				);
			};
			add_action( 'rest_api_init', $register_modules );
			do_action( 'rest_api_init' );
			remove_action( 'rest_api_init', $register_modules );
			$this->assertSame( array( false, false ), $server->dispatch( new \WP_REST_Request( 'GET', '/jetpack/v4/module/all' ) )->get_data() );
			$this->assertSame( 'does_not_exist', get_option( 'monitor_receive_notifications', 'does_not_exist' ) );
			$this->assertSame( 'does_not_exist', get_option( 'post_by_email_address' . get_current_user_id(), 'does_not_exist' ) );
			$this->assertSame( array(), $attempts );
		} finally {
			delete_transient( $key );
			remove_filter( 'pre_http_request', $tripwire, 10 );
		}
	}

	/**
	 * @dataProvider offline_multisite_permissions
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @param bool $network_admin Whether the user manages the network.
	 */
	#[DataProvider( 'offline_multisite_permissions' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_offline_seed_requires_network_management_on_multisite( $network_admin ) {
		require __DIR__ . '/fixtures/offline-multisite.php';
		$user = wp_insert_user(
			array(
				'user_login' => 'offline-network',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user );
		wp_get_current_user()->add_cap( 'manage_network', $network_admin );
		add_filter( 'jetpack_offline_mode', '__return_true' );
		add_filter( 'jetpack_my_jetpack_offline_features', '__return_true' );
		$_GET['page'] = 'my-jetpack';
		$this->assertSame( $network_admin, REST_Main_Features::permissions_callback() );
		$this->assertSame( $network_admin, isset( Initializer::add_admin_script_data( array() )['myJetpack']['offlineFeatures'] ) );
		$this->assertSame( $network_admin, Initializer::should_initialize() );
		Initializer::add_my_jetpack_menu_item();
		$this->assertSame( $network_admin, false !== has_action( 'load-admin_page_my-jetpack', array( Initializer::class, 'admin_init' ) ) );
		$this->assert_offline_page_permission( $network_admin );
	}

	/**
	 * @return array Permission cases.
	 */
	public static function offline_multisite_permissions() {
		return array(
			'site administrator'    => array( false ),
			'network administrator' => array( true ),
		);
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_offline_editor_gets_access_denied_before_enqueuing_features() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'entry-editor',
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);
		add_filter( 'jetpack_offline_mode', '__return_true' );
		add_filter( 'jetpack_my_jetpack_offline_features', '__return_true' );
		$this->assert_offline_page_permission( false );
	}

	private function assert_offline_page_permission( $allowed ) {
		$handler = function () {
			/** @return never */
			return function ( $message ) {
				throw new \RuntimeException( $message );
			};
		};
		add_filter( 'wp_die_handler', $handler );
		try {
			Initializer::admin_init();
			$this->assertTrue( $allowed, 'A denied viewer must not receive an empty Features page.' );
		} catch ( \RuntimeException $error ) {
			$this->assertFalse( $allowed );
			$this->assertSame( 'Sorry, you are not allowed to access this page.', $error->getMessage() );
		} finally {
			remove_filter( 'wp_die_handler', $handler );
		}
		$this->assertSame( $allowed, false !== has_action( 'admin_enqueue_scripts', array( Initializer::class, 'enqueue_scripts' ) ) );
	}

	public function test_offline_initialization_answers_link_callers_for_the_current_user() {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'link-admin',
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);
		add_filter( 'jetpack_offline_mode', '__return_true' );
		add_filter( 'jetpack_my_jetpack_offline_features', '__return_true' );
		$this->assertTrue( Initializer::should_initialize() );
		wp_get_current_user()->add_cap( 'activate_plugins', false );
		$this->assertFalse( Initializer::should_initialize() );
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_true' );
		$this->assertFalse( Initializer::should_initialize(), 'A host opt-in cannot offer a page the viewer cannot use.' );
		remove_all_filters( 'jetpack_offline_mode' );
		StatusCache::clear();
		add_filter( 'jetpack_offline_mode', '__return_false' );
		$this->assertTrue( Initializer::should_initialize(), 'Online link behavior remains unchanged.' );
	}

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
		unset( $_GET['page'], $_GET['step'], $_GET['showCouponRedemption'] );
		wp_set_current_user( 0 );
		Jetpack_Options::delete_option( array( 'id', 'blog_token', 'master_user', 'user_tokens', Partner_Coupon::$coupon_option ) );
		remove_all_filters( 'jetpack_partner_coupon_supported_partners' );
		remove_all_filters( 'jetpack_partner_coupon_supported_presets' );
		remove_all_filters( 'jetpack_partner_coupon_products' );
		remove_all_filters( 'jetpack_my_jetpack_should_initialize' );
		remove_all_filters( 'jetpack_offline_mode' );
		remove_all_filters( 'jetpack_my_jetpack_offline_features' );

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
		$this->log_in_as_admin();

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
		$this->log_in_as_admin();
		Constants::set_constant( 'IS_WPCOM', true );
		$_GET['step'] = 'onboarding';

		$location = $this->capture_admin_init_redirect();

		$this->assertNotNull( $location, 'Expected admin_init() to redirect away from onboarding.' );
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
		$this->assertNull( $this->capture_admin_init_redirect() );
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

		$location = $this->capture_admin_init_redirect();

		$this->assertNotNull( $location, 'Expected a redirect away from onboarding.' );
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
