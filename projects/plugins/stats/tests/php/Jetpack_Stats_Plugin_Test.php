<?php
/**
 * Bootstrap wiring tests for the Jetpack Stats plugin.
 *
 * @package automattic/jetpack-stats-plugin
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Stats\Main as Stats_Main;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Stats_Admin\Dashboard as Stats_Dashboard;
use Automattic\Jetpack\Stats_Plugin\Jetpack_Stats_Plugin;
use WorDBless\BaseTestCase;

/**
 * Test that the plugin shell registers everything the Stats packages expect.
 */
class Jetpack_Stats_Plugin_Test extends BaseTestCase {

	/**
	 * `Connection_Manager::is_connected()` caches its answer in a static, which survives
	 * the per-test database reset. Clear it so a faked connection cannot leak.
	 */
	public function tear_down() {
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Give `Connection_Manager::is_connected()` the blog ID and token it looks for.
	 */
	private function fake_connection() {
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'test.token' );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Record every module that reaches `Modules::activate()`.
	 *
	 * @param array $activated Collected module slugs, by reference.
	 */
	private function record_module_activations( array &$activated ) {
		add_action(
			'jetpack_pre_activate_module',
			function ( $module ) use ( &$activated ) {
				$activated[] = $module;
			}
		);
	}

	/**
	 * The complete set of hooks `bootstrap()` registers, as `hook, method, priority`.
	 */
	private function bootstrap_hooks() {
		return array(
			array( 'plugins_loaded', 'configure_packages', 1 ),
			array( 'plugins_loaded', 'initialize_other_packages', 10 ),
			array( 'activated_plugin', 'handle_plugin_activation', 10 ),
			array( 'jetpack_site_registered', 'activate_stats_module', 10 ),
			array( 'deactivate_jetpack/jetpack.php', 'activate_stats_module', 10 ),
			array( 'plugin_action_links_' . JETPACK_STATS_PLUGIN__FILE_RELATIVE_PATH, 'plugin_page_add_links', 10 ),
			array( 'jetpack_get_available_standalone_modules', 'filter_available_modules_add_stats', 10 ),
		);
	}

	/**
	 * Whether the Odyssey dashboard has claimed the admin menu.
	 *
	 * `Stats_Admin\Dashboard` hooks an instance method, so `has_action()` cannot match it
	 * against a class name.
	 */
	private function dashboard_menu_is_registered() {
		if ( ! isset( $GLOBALS['wp_filter']['admin_menu'] ) ) {
			return false;
		}

		foreach ( $GLOBALS['wp_filter']['admin_menu']->callbacks as $callbacks ) {
			foreach ( $callbacks as $callback ) {
				if ( is_array( $callback['function'] ) && $callback['function'][0] instanceof Stats_Dashboard ) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * `Stats_Admin\Dashboard` records its initialization in a static that survives the
	 * per-test hook restore, and it registers the menu only on the first call. Clear it so a
	 * test that expects the dashboard to register controls its own precondition.
	 */
	private function reset_dashboard_initialization() {
		$initialized = new ReflectionProperty( Stats_Dashboard::class, 'initialized' );

		// Reflection cannot write a private property before PHP 8.1 without this, and the
		// method is deprecated from PHP 8.5. The plugin supports 7.2, so both ends apply.
		if ( PHP_VERSION_ID < 80100 ) {
			$initialized->setAccessible( true );
		}

		$initialized->setValue( null, false );
	}

	/**
	 * `bootstrap()` is the plugin's whole wiring surface, so a hook dropped from it is a
	 * feature silently switched off. Clear the hooks the test bootstrap already registered
	 * before calling it, otherwise the assertions pass on that earlier state and the test
	 * says nothing about `bootstrap()` itself.
	 *
	 * WordPress stores actions as filters, so `has_filter()` and `remove_filter()` cover both.
	 */
	public function test_bootstrap_registers_every_hook() {
		foreach ( $this->bootstrap_hooks() as list( $hook, $method, $priority ) ) {
			remove_filter( $hook, array( Jetpack_Stats_Plugin::class, $method ), $priority );

			$this->assertFalse(
				has_filter( $hook, array( Jetpack_Stats_Plugin::class, $method ) ),
				"$hook still holds $method before bootstrap() runs."
			);
		}

		Jetpack_Stats_Plugin::bootstrap();

		foreach ( $this->bootstrap_hooks() as list( $hook, $method, $priority ) ) {
			$this->assertSame(
				$priority,
				has_filter( $hook, array( Jetpack_Stats_Plugin::class, $method ) ),
				"bootstrap() did not register $method on $hook."
			);
		}
	}

	/**
	 * The Stats module must switch back on when the Jetpack plugin goes away, otherwise
	 * a site that used the module toggle in Jetpack is left with Stats silently off.
	 */
	public function test_bootstrap_reactivates_stats_when_jetpack_is_deactivated() {
		$this->assertSame(
			10,
			has_action( 'deactivate_jetpack/jetpack.php', array( Jetpack_Stats_Plugin::class, 'activate_stats_module' ) )
		);
		$this->assertSame(
			10,
			has_action( 'jetpack_site_registered', array( Jetpack_Stats_Plugin::class, 'activate_stats_module' ) )
		);
	}

	/**
	 * My Jetpack builds its product list from this filter. Without `stats` in it the
	 * plugin has no product card.
	 */
	public function test_stats_is_offered_as_a_standalone_module() {
		$this->assertSame(
			array( 'stats', 'search' ),
			Jetpack_Stats_Plugin::filter_available_modules_add_stats( array( 'search' ) )
		);
	}

	/**
	 * The action link is prepended, not replacing what the plugins screen already added.
	 */
	public function test_plugin_action_links_are_prepended() {
		$links = Jetpack_Stats_Plugin::plugin_page_add_links( array( '<a href="#">Deactivate</a>' ) );

		$this->assertCount( 2, $links );
		$this->assertStringContainsString( 'Deactivate', $links[1] );
	}

	/**
	 * The dashboard registration is skipped while the Jetpack plugin is active, because
	 * Jetpack registers the same `stats` menu slug itself.
	 */
	public function test_jetpack_plugin_detection() {
		$this->assertSame( class_exists( 'Jetpack' ), Jetpack_Stats_Plugin::is_jetpack_plugin_active() );
	}

	/**
	 * `activated_plugin` fires for every plugin. Acting on all of them would switch Stats
	 * back on whenever any other plugin is activated, undoing a deliberate opt-out.
	 */
	public function test_activating_another_plugin_leaves_the_stats_module_alone() {
		$this->fake_connection();
		$activated = array();
		$this->record_module_activations( $activated );

		Jetpack_Stats_Plugin::handle_plugin_activation( 'some-other-plugin/some-other-plugin.php' );

		$this->assertSame( array(), $activated );
	}

	/**
	 * The counterpart: activating this plugin does switch the module on.
	 */
	public function test_activating_this_plugin_activates_the_stats_module() {
		$this->fake_connection();
		$activated = array();
		$this->record_module_activations( $activated );

		Jetpack_Stats_Plugin::handle_plugin_activation( JETPACK_STATS_PLUGIN__FILE_RELATIVE_PATH );

		$this->assertSame( array( 'stats' ), $activated );
	}

	/**
	 * A site with no connection has no token to report stats with, so the module stays off
	 * and the caller is told so rather than the result being discarded.
	 */
	public function test_module_activation_reports_failure_without_a_connection() {
		$this->assertFalse( ( new Connection_Manager() )->is_connected(), 'Test environment is expected to be unconnected.' );
		$this->assertFalse( Jetpack_Stats_Plugin::activate_stats_module() );
	}

	/**
	 * On an unconnected site the Stats menu is still registered, but it is the stand-in
	 * that redirects to the connection flow, not the Odyssey dashboard.
	 */
	public function test_disconnected_site_registers_the_stand_in_menu() {
		Jetpack_Stats_Plugin::initialize_other_packages();

		$this->assertSame(
			999,
			has_action( 'admin_menu', array( Jetpack_Stats_Plugin::class, 'register_disconnected_menu' ) )
		);
	}

	/**
	 * The stand-in menu keeps the `stats` slug so the plugin action link, the post-activation
	 * redirect and any bookmark stay valid across a connection. Opening it without a
	 * connection forwards to My Jetpack onboarding.
	 */
	public function test_stand_in_menu_uses_the_dashboard_slug() {
		$GLOBALS['menu'] = array();

		// `add_menu_page()` checks `view_stats`, which `Stats\Main` maps to `read` for any
		// role listed in the Stats `roles` option.
		Stats_Main::init();
		Stats_Options::set_option( 'roles', array( 'administrator' ) );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'stats_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		Jetpack_Stats_Plugin::register_disconnected_menu();

		$this->assertContains( 'stats', array_column( $GLOBALS['menu'], 2 ) );
		$this->assertNotFalse(
			has_action( 'load-toplevel_page_stats', array( Jetpack_Stats_Plugin::class, 'redirect_to_connection_flow' ) )
		);
	}

	/**
	 * The connected counterpart of the two tests above. Both menus claim the `stats` slug, so
	 * the dashboard must take it and the stand-in must stay out of the way.
	 */
	public function test_connected_site_initializes_the_dashboard() {
		$this->fake_connection();
		$this->reset_dashboard_initialization();

		Jetpack_Stats_Plugin::initialize_other_packages();

		$this->assertTrue( $this->dashboard_menu_is_registered() );
		$this->assertFalse(
			has_action( 'admin_menu', array( Jetpack_Stats_Plugin::class, 'register_disconnected_menu' ) )
		);
	}

	/**
	 * The Odyssey dashboard and the block editor both read stats through the
	 * `jetpack/v4/stats-app` proxy, which `Stats_Admin\REST_Controller` registers. Walk the
	 * real path — `configure_packages()` then the `Config` initializer — so the assertion
	 * covers the plugin's own wiring and not just the presence of the package.
	 */
	public function test_stats_app_rest_proxy_is_registered() {
		global $wp_rest_server;
		$wp_rest_server = new \WP_REST_Server();

		Jetpack_Stats_Plugin::configure_packages();
		do_action( 'plugins_loaded' );
		do_action( 'rest_api_init' );

		$routes = array_keys( $wp_rest_server->get_routes() );

		// Most routes interpolate the connected blog ID into the path rather than matching it,
		// so assert on the namespace as a whole plus the two routes that carry no blog ID.
		$this->assertNotEmpty( preg_grep( '#^/jetpack/v4/stats-app/#', $routes ) );
		$this->assertContains( '/jetpack/v4/stats-app', $routes );
		$this->assertContains( '/jetpack/v4/stats-app/stats/notices', $routes );

		// Odyssey reads `is_commercial` from this route to decide what to paywall, and the
		// Subscribers and Store tabs from the same response.
		$this->assertContains( '/jetpack/v4/site', $routes );
	}
}
