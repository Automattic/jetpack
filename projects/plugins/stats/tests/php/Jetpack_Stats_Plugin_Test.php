<?php
/**
 * Bootstrap wiring tests for the Jetpack Stats plugin.
 *
 * @package automattic/jetpack-stats-plugin
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Stats\Main as Stats_Main;
use Automattic\Jetpack\Stats\Options as Stats_Options;
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
	 * The plugin file registers its hooks on load, in `bootstrap()`. Requiring the
	 * file happens once in the test bootstrap, so the hooks are already in place.
	 */
	public function test_bootstrap_registers_package_configuration() {
		$this->assertSame(
			1,
			has_action( 'plugins_loaded', array( Jetpack_Stats_Plugin::class, 'configure_packages' ) )
		);
		$this->assertSame(
			10,
			has_action( 'plugins_loaded', array( Jetpack_Stats_Plugin::class, 'initialize_other_packages' ) )
		);
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
	 * An unconnected site has no token, so every stats-app route answers 500. Activation
	 * must land on My Jetpack onboarding rather than a dashboard full of failed requests.
	 */
	public function test_activation_lands_on_onboarding_when_not_connected() {
		$this->assertFalse( ( new Connection_Manager() )->is_connected(), 'Test environment is expected to be unconnected.' );
		$this->assertSame( 'my-jetpack', Jetpack_Stats_Plugin::get_post_activation_page() );
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
	 * The stand-in menu keeps the `stats` slug so the plugin action link and any bookmark
	 * stay valid across a connection.
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
