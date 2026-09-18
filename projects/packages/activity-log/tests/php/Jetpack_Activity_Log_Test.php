<?php
/**
 * Unit tests for the Jetpack_Activity_Log bootstrap.
 *
 * @package automattic/jetpack-activity-log
 */

namespace Automattic\Jetpack\Activity_Log;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Modules;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

class Jetpack_Activity_Log_Test extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		$this->reset_bootstrap();
	}

	protected function tearDown(): void {
		$this->reset_bootstrap();
		$this->leave_activity_log_admin_request();
		Jetpack_Options::delete_option( array( 'active_modules', Jetpack_Activity_Log::DEFAULT_ACTIVATED_OPTION, 'user_tokens' ) );
		parent::tearDown();
	}

	/**
	 * Unwinds everything initialize() and register_module() leave behind, so each
	 * test starts from a bootstrap that has not run yet.
	 *
	 * @return void
	 */
	private function reset_bootstrap() {
		remove_action( 'admin_menu', array( Jetpack_Activity_Log::class, 'add_wp_admin_submenu' ) );
		remove_action( 'rest_api_init', array( Jetpack_Activity_Log::class, 'register_rest_routes' ) );
		remove_filter( 'jetpack_package_versions', array( Package_Version::class, 'send_package_version_to_tracker' ) );
		remove_filter( 'jetpack_get_available_standalone_modules', array( Jetpack_Activity_Log::class, 'add_standalone_module' ) );
		remove_action( 'plugins_loaded', array( Jetpack_Activity_Log::class, 'activate_standalone_default' ) );
		unset( $GLOBALS['wp_actions']['jetpack_activity_log_initialized'] );
	}

	/**
	 * Marks the module as already defaulted on, so the standalone seed stays out
	 * of the way and the test controls the module state itself.
	 *
	 * @param array $modules Module slugs to store as active.
	 * @return void
	 */
	private function set_active_modules( array $modules ) {
		Jetpack_Options::update_option( Jetpack_Activity_Log::DEFAULT_ACTIVATED_OPTION, true );
		Jetpack_Options::update_option( 'active_modules', $modules );
	}

	/**
	 * Puts a connected administrator on the Activity Log admin page, so add_wp_admin_submenu() gets past is_available().
	 *
	 * @return void
	 */
	private function enter_activity_log_admin_request() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'activity_log_admin_' . wp_rand( 1, PHP_INT_MAX ),
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		Jetpack_Options::update_option( 'user_tokens', array( $user_id => "token.secret.$user_id" ) );

		set_current_screen( 'jetpack_page_jetpack-activity-log' );
		$_GET['page'] = Jetpack_Activity_Log::PAGE_SLUG;
	}

	/**
	 * Undoes enter_activity_log_admin_request() and what add_wp_admin_submenu() registers.
	 *
	 * @return void
	 */
	private function leave_activity_log_admin_request() {
		remove_action( 'admin_enqueue_scripts', array( Jetpack_Activity_Log::class, 'alias_screen_id_for_wp_build' ) );
		remove_action( 'admin_enqueue_scripts', array( Jetpack_Activity_Log::class, 'restore_screen_id_after_wp_build' ) );
		remove_filter( 'jetpack_display_jitms_on_screen', array( Jetpack_Activity_Log::class, 'hide_jitms_on_wp_build_dashboard' ) );
		remove_all_actions( 'load-jetpack_page_jetpack-activity-log' );

		$menu_items = new \ReflectionProperty( Admin_Menu::class, 'menu_items' );
		if ( \PHP_VERSION_ID < 80100 ) {
			// Required to access non-public members before PHP 8.1; deprecated no-op since PHP 8.5.
			$menu_items->setAccessible( true );
		}
		$menu_items->setValue( null, array() );

		unset( $_GET['page'], $GLOBALS['current_screen'] );
		wp_set_current_user( 0 );
	}

	/**
	 * Whether the hooks that serve the admin page and the REST routes are wired.
	 *
	 * @return bool
	 */
	private function is_bootstrapped() {
		return false !== has_action( 'admin_menu', array( Jetpack_Activity_Log::class, 'add_wp_admin_submenu' ) )
			&& false !== has_action( 'rest_api_init', array( Jetpack_Activity_Log::class, 'register_rest_routes' ) );
	}

	/**
	 * Without this the `jetpack_active_modules` option is inert on a site with no
	 * Jetpack plugin, because get_active() intersects it against get_available().
	 */
	public function test_initialize_makes_the_module_available_to_a_standalone_site() {
		Jetpack_Activity_Log::initialize();

		$this->assertContains(
			Jetpack_Activity_Log::MODULE_SLUG,
			( new Modules() )->get_available()
		);
	}

	public function test_initialize_wires_the_page_and_routes_while_the_module_is_on() {
		$this->set_active_modules( array( Jetpack_Activity_Log::MODULE_SLUG ) );

		Jetpack_Activity_Log::initialize();

		$this->assertTrue( $this->is_bootstrapped() );
		$this->assertSame( 1, did_action( 'jetpack_activity_log_initialized' ) );
	}

	/**
	 * The combination this gate exists for: a standalone plugin bootstrapping the
	 * package on a site where the module has been switched off.
	 */
	public function test_initialize_wires_nothing_while_the_module_is_off() {
		$this->set_active_modules( array() );

		Jetpack_Activity_Log::initialize();

		$this->assertFalse( $this->is_bootstrapped() );
		$this->assertSame( 0, did_action( 'jetpack_activity_log_initialized' ) );
	}

	/**
	 * A standalone install has no `Auto Activate: Yes` equivalent, so the package
	 * switches the module on itself the first time it runs.
	 */
	public function test_a_standalone_site_gets_the_module_switched_on() {
		Jetpack_Activity_Log::initialize();

		$this->assertTrue( Jetpack_Activity_Log::is_module_active() );
		$this->assertTrue( $this->is_bootstrapped() );
		$this->assertTrue( (bool) Jetpack_Options::get_option( Jetpack_Activity_Log::DEFAULT_ACTIVATED_OPTION ) );
	}

	/**
	 * The point of recording it: switching the module off has to survive the next
	 * request rather than being undone by the same default.
	 */
	public function test_the_standalone_default_is_not_reapplied_after_an_opt_out() {
		Jetpack_Activity_Log::initialize();
		( new Modules() )->deactivate( Jetpack_Activity_Log::MODULE_SLUG );
		$this->reset_bootstrap();

		Jetpack_Activity_Log::initialize();

		$this->assertFalse( Jetpack_Activity_Log::is_module_active() );
		$this->assertFalse( $this->is_bootstrapped() );
	}

	/**
	 * The Jetpack plugin owns the default there, through `Auto Activate: Yes`.
	 * Seeding as well would undo an opt-out made from its own toggle.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_the_standalone_default_is_skipped_when_the_jetpack_plugin_is_present() {
		require_once __DIR__ . '/mocks/jetpack-plugin-mock.php';

		Jetpack_Activity_Log::initialize();

		$this->assertFalse( (bool) Jetpack_Options::get_option( Jetpack_Activity_Log::DEFAULT_ACTIVATED_OPTION ) );
		$this->assertFalse( Jetpack_Activity_Log::is_module_active() );
		$this->assertFalse( $this->is_bootstrapped() );
	}

	/**
	 * Backup calls initialize() at file scope, where the Jetpack plugin may not
	 * have loaded yet, so the default has to wait for a reliable answer.
	 */
	public function test_the_standalone_default_waits_for_plugins_loaded() {
		$plugins_loaded = $GLOBALS['wp_actions']['plugins_loaded'] ?? 0;
		unset( $GLOBALS['wp_actions']['plugins_loaded'] );

		Jetpack_Activity_Log::initialize();

		$deferred = has_action( 'plugins_loaded', array( Jetpack_Activity_Log::class, 'activate_standalone_default' ) );
		$seeded   = Jetpack_Options::get_option( Jetpack_Activity_Log::DEFAULT_ACTIVATED_OPTION );

		$GLOBALS['wp_actions']['plugins_loaded'] = $plugins_loaded;

		$this->assertNotFalse( $deferred );
		$this->assertFalse( $seeded );
	}

	public function test_add_wp_admin_submenu_hooks_the_screen_alias_around_the_generated_check() {
		$this->enter_activity_log_admin_request();

		Jetpack_Activity_Log::add_wp_admin_submenu();

		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', array( Jetpack_Activity_Log::class, 'alias_screen_id_for_wp_build' ) ) );
		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', array( Jetpack_Activity_Log::class, 'restore_screen_id_after_wp_build' ) ) );
		$this->assertFalse( has_action( 'current_screen', array( Jetpack_Activity_Log::class, 'alias_screen_id_for_wp_build' ) ) );
	}

	/**
	 * JITM reads the screen ID after `admin_enqueue_scripts`, to build its message path.
	 */
	public function test_screen_id_is_restored_after_admin_enqueue_scripts() {
		$this->enter_activity_log_admin_request();

		Jetpack_Activity_Log::add_wp_admin_submenu();
		do_action( 'admin_enqueue_scripts', 'jetpack_page_jetpack-activity-log' );

		$this->assertSame( 'jetpack_page_jetpack-activity-log', get_current_screen()->id );
	}

	/**
	 * The alias and its restore pair up, and do nothing without a screen or an alias to undo.
	 */
	public function test_alias_screen_id_round_trip() {
		unset( $GLOBALS['current_screen'] );
		Jetpack_Activity_Log::alias_screen_id_for_wp_build();
		Jetpack_Activity_Log::restore_screen_id_after_wp_build();

		set_current_screen( 'jetpack_page_jetpack-activity-log' );
		Jetpack_Activity_Log::restore_screen_id_after_wp_build();
		$this->assertSame( 'jetpack_page_jetpack-activity-log', get_current_screen()->id );

		Jetpack_Activity_Log::alias_screen_id_for_wp_build();
		$this->assertSame( Jetpack_Activity_Log::WP_BUILD_PAGE_SLUG, get_current_screen()->id );

		Jetpack_Activity_Log::restore_screen_id_after_wp_build();
		$this->assertSame( 'jetpack_page_jetpack-activity-log', get_current_screen()->id );
	}

	/**
	 * The dashboard opts the screen it registered out of JITMs, and no other.
	 */
	public function test_dashboard_opts_its_screen_out_of_jitms() {
		$this->enter_activity_log_admin_request();

		$page_suffix = Jetpack_Activity_Log::add_wp_admin_submenu();

		$this->assertSame( 'jetpack_page_jetpack-activity-log', $page_suffix );
		$this->assertFalse( apply_filters( 'jetpack_display_jitms_on_screen', true, $page_suffix ) );
		$this->assertTrue( apply_filters( 'jetpack_display_jitms_on_screen', true, 'jetpack_page_jetpack-social' ) );
		$this->assertFalse( apply_filters( 'jetpack_display_jitms_on_screen', false, 'jetpack_page_jetpack-social' ) );
	}
}
