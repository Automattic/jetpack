<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use ReflectionProperty;

/**
 * Unit tests for the Dashbaord class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Dashboard_Test extends Stats_TestCase {
	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		remove_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		wp_dequeue_script( 'jp-stats-dashboard' );
		wp_deregister_script( 'jp-stats-dashboard' );
		wp_dequeue_script( 'jp-stats-dashboard-bootstrap' );
		wp_deregister_script( 'jp-stats-dashboard-bootstrap' );
		parent::tearDown();
	}

	/**
	 * Reset the shared menu state Admin_Menu carries between registrations.
	 */
	public function setUp(): void {
		parent::setUp();
		global $menu, $submenu;
		$menu    = array();
		$submenu = array();
		remove_all_filters( 'jetpack_admin_menu_visibility' );
		Admin_Menu::set_visibility_resolver( null );
		// A connected site grants view_stats from the stats package, which this bootstrap
		// does not load, so the menu's own capability would keep every item out.
		add_filter( 'user_has_cap', array( $this, 'grant_view_stats' ) );
		$this->reset_admin_menu_state();
		wp_dequeue_style( Admin_Menu::HIDE_CORE_NOTICES_HANDLE );
		wp_deregister_style( Admin_Menu::HIDE_CORE_NOTICES_HANDLE );
	}

	/**
	 * Grants view_stats to whoever the test logged in as.
	 *
	 * @param array $caps The current user's capabilities.
	 * @return array
	 */
	public function grant_view_stats( $caps ) {
		$caps['view_stats'] = true;
		return $caps;
	}

	/**
	 * Empty Admin_Menu's registration queues so each test starts from an empty sidebar.
	 */
	private function reset_admin_menu_state() {
		foreach ( array( 'menu_items', 'top_level_items', 'hidden_top_level_slugs', 'hidden_menu_slugs' ) as $name ) {
			$property = new ReflectionProperty( Admin_Menu::class, $name );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$property->setValue( null, array() );
		}
	}

	/**
	 * Fires the two hooks between which the sidebar is built and then trimmed for rendering.
	 */
	private function render_menu() {
		do_action( 'admin_menu' );
		ob_start(); // Core prints head markup on admin_head.
		do_action( 'admin_head' );
		ob_end_clean();
	}

	/**
	 * Returns the slugs currently registered at the sidebar's top level.
	 *
	 * @return array
	 */
	private function get_top_level_slugs() {
		global $menu;

		return array_column( $menu ?? array(), 2 );
	}

	/**
	 * Stats keeps its top level slot, now registered through Admin_Menu.
	 */
	public function test_stats_registers_a_top_level_menu() {
		wp_set_current_user( $this->admin_id );

		( new Dashboard() )->add_wp_admin_menu();
		$this->render_menu();

		$this->assertContains( 'stats', $this->get_top_level_slugs() );
	}

	/**
	 * A host can take Stats out of the sidebar, and the page still loads for links into it.
	 */
	public function test_a_host_can_hide_the_stats_menu() {
		global $_registered_pages, $pagenow, $plugin_page;

		wp_set_current_user( $this->admin_id );
		$_registered_pages = array();
		add_filter(
			'jetpack_admin_menu_visibility',
			function ( $states ) {
				$states['jetpack-stats'] = Admin_Menu::VISIBILITY_HIDDEN;
				return $states;
			}
		);

		( new Dashboard() )->add_wp_admin_menu();
		do_action( 'admin_menu' );

		$pagenow     = 'admin.php'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$plugin_page = 'stats'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$this->assertArrayHasKey( 'toplevel_page_stats', $_registered_pages );
		$this->assertTrue( user_can_access_admin_page() );

		ob_start();
		do_action( 'admin_head' );
		ob_end_clean();

		$this->assertNotContains( 'stats', $this->get_top_level_slugs() );

		$pagenow     = null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$plugin_page = null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}

	/**
	 * The dashboard renders full bleed, so core notices stacked above it are hidden.
	 */
	public function test_the_stats_page_hides_core_admin_notices() {
		wp_set_current_user( $this->admin_id );

		( new Dashboard() )->add_wp_admin_menu();
		do_action( 'load-toplevel_page_stats' ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- core's own hook name.

		$this->assertTrue( wp_style_is( Admin_Menu::HIDE_CORE_NOTICES_HANDLE, 'enqueued' ) );
	}

	/**
	 * The page still does its own set-up when the screen loads.
	 */
	public function test_the_stats_page_runs_admin_init_on_load() {
		wp_set_current_user( $this->admin_id );

		$dashboard = new Dashboard();
		$dashboard->add_wp_admin_menu();

		$this->assertNotFalse( has_action( 'load-toplevel_page_stats', array( $dashboard, 'admin_init' ) ) );
	}

	/**
	 * Test that init sets $initialized.
	 */
	public function test_init_sets_initialized() {
		Dashboard::init();

		$rp = new ReflectionProperty( Dashboard::class, 'initialized' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$rp->setAccessible( true );
		}
		$this->assertTrue( $rp->getValue() );
	}

	/**
	 * Test has root dom.
	 */
	public function test_render() {
		$this->expectOutputRegex( '/<div id="wpcom" class="jp-stats-dashboard".*>/i' );
		( new Dashboard() )->render();
	}

	/**
	 * The view count decides when to ask what the user makes of the dashboard, so a page that
	 * only offered them a plan must not count towards it.
	 */
	public function test_render_does_not_count_views_before_the_site_is_connected() {
		$this->disconnect_site();

		$this->expectOutputRegex( '/<div id="wpcom"/i' );
		( new Dashboard() )->render();

		$this->assertSame( 0, intval( Stats_Options::get_option( 'views' ) ) );
	}

	/**
	 * The app is served from our CDN and cannot bundle the connection package, so it registers the
	 * site through the connection REST API using the state printed alongside it.
	 */
	public function test_load_admin_scripts_prints_the_connection_state() {
		$this->disconnect_site();

		( new Dashboard() )->load_admin_scripts();

		$inline_scripts = implode( '', (array) wp_scripts()->get_data( 'jp-stats-dashboard', 'before' ) );

		$this->assertStringContainsString( 'JP_CONNECTION_INITIAL_STATE', $inline_scripts );
	}

	/**
	 * A connected site reads connection status over REST, so the blob is not printed there.
	 */
	public function test_load_admin_scripts_does_not_print_the_connection_state_when_connected() {
		( new Dashboard() )->load_admin_scripts();

		$inline_scripts = implode( '', (array) wp_scripts()->get_data( 'jp-stats-dashboard', 'before' ) );

		$this->assertStringNotContainsString( 'JP_CONNECTION_INITIAL_STATE', $inline_scripts );
	}

	/**
	 * The bootstrap that loads the icon sprite is no longer part of the page markup, so it has to
	 * reach the page through the script queue.
	 */
	public function test_load_admin_scripts_enqueues_the_bootstrap() {
		( new Dashboard() )->load_admin_scripts();

		$inline_scripts = implode( '', (array) wp_scripts()->get_data( 'jp-stats-dashboard-bootstrap', 'after' ) );

		$this->assertTrue( wp_script_is( 'jp-stats-dashboard-bootstrap', 'enqueued' ) );
		$this->assertStringContainsString( 'gridicons', $inline_scripts );
	}

	/**
	 * The bootstrap runs on jQuery, which the Odyssey bundle does not depend on, so it has to say
	 * so itself rather than rely on another admin feature having loaded it.
	 */
	public function test_bootstrap_declares_its_jquery_dependency() {
		( new Dashboard() )->load_admin_scripts();

		$this->assertContains( 'jquery', wp_scripts()->registered['jp-stats-dashboard-bootstrap']->deps );
	}

	/**
	 * The dashboard markup carries no script tag of its own.
	 */
	public function test_render_prints_no_script_tag() {
		ob_start();
		( new Dashboard() )->render();
		$output = ob_get_clean();

		$this->assertStringNotContainsString( '<script', $output );
	}

	/**
	 * Once connected the dashboard is a reporting page, open to anyone allowed to see stats.
	 */
	public function test_capability_when_connected() {
		$this->assertSame( 'view_stats', $this->get_capability() );
	}

	/**
	 * Before that it offers a plan and connects the site, which only a user who can manage the
	 * connection can act on.
	 */
	public function test_capability_when_not_connected() {
		$this->disconnect_site();

		$this->assertSame( 'jetpack_connect', $this->get_capability() );
	}

	/**
	 * Read the capability the dashboard menu is registered with.
	 *
	 * @return string
	 */
	private function get_capability() {
		$dashboard = new Dashboard();
		$method    = new \ReflectionMethod( $dashboard, 'get_capability' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( $dashboard );
	}
}
