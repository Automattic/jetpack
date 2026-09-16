<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\My_Jetpack\Products\Activity_Log;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the Activity Log product.
 *
 * Isolated because these read the module state through `Modules`, whose
 * available-module list is a function static: the first test in the process to
 * ask fixes it for every test after, and this class sorts first in the suite.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Products\Activity_Log
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Activity_Log_Product_Test extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->install_mock_plugins();
		wp_cache_delete( 'plugins', 'plugins' );
		activate_plugins( 'jetpack/jetpack.php' );

		// Manager memoizes the connection owner across tests in the same process.
		$owner_id = new \ReflectionProperty( Connection_Manager::class, 'connection_owner_id' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$owner_id->setAccessible( true );
		}
		$owner_id->setValue( null, null );

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );

		// Modules::get_active() intersects against the available modules, which
		// come from a different filter depending on whether the Jetpack plugin is
		// present. Register both so the tests read the module state either way.
		add_filter( 'jetpack_get_available_modules', array( $this, 'add_activity_log_module' ) );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_standalone_activity_log_module' ) );
	}

	/**
	 * Available modules as the Jetpack plugin reports them: slug => version.
	 *
	 * @param array $modules Available modules.
	 * @return array
	 */
	public function add_activity_log_module( $modules ) {
		$modules['activity-log'] = '0.0.0';

		return $modules;
	}

	/**
	 * Available modules as a standalone plugin reports them: a list of slugs.
	 *
	 * @param array $modules Available module slugs.
	 * @return array
	 */
	public function add_standalone_activity_log_module( $modules ) {
		$modules[] = 'activity-log';

		return array_values( array_unique( $modules ) );
	}

	/**
	 * Installs the Jetpack mock plugin from the test assets folder.
	 *
	 * @return void
	 */
	public function install_mock_plugins() {
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		$this->set_plan_cache( null );
		remove_filter( 'jetpack_get_available_modules', array( $this, 'add_activity_log_module' ) );
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'add_standalone_activity_log_module' ) );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Activity Log is a free Security feature backed by the activity-log module.
	 */
	public function test_product_metadata() {
		$this->assertSame( 'activity-log', Activity_Log::$slug );
		$this->assertSame( 'security', Activity_Log::$category );
		$this->assertSame( 'activity-log', Activity_Log::$module_name );
		$this->assertTrue( Activity_Log::$is_feature );
		$this->assertTrue( Activity_Log::$has_free_offering );
		$this->assertFalse( Activity_Log::$has_standalone_plugin );
		$this->assertTrue( Activity_Log::$requires_user_connection );
	}

	/**
	 * The product is registered so callers can look it up by slug.
	 */
	public function test_product_is_registered() {
		$this->assertSame( Activity_Log::class, Products::get_products_classes()['activity-log'] );
	}

	/**
	 * The whole point of the module: is_active() has to follow the toggle, not
	 * just the presence of the Jetpack plugin.
	 */
	public function test_is_active_follows_module_state() {
		$this->set_active_modules( array() );
		$this->assertFalse( Activity_Log::is_active() );

		$this->set_active_modules( array( 'activity-log' ) );
		$this->assertTrue( Activity_Log::is_active() );
	}

	/**
	 * Without a connected owner the user-connection requirement wins, so the
	 * module state is only reachable once one exists.
	 */
	public function test_status_requires_a_connected_owner() {
		$this->set_active_modules( array( 'activity-log' ) );
		$this->assertSame( Products::STATUS_USER_CONNECTION_ERROR, Activity_Log::get_status() );
	}

	/**
	 * A disabled module is reported as disabled rather than merely inactive.
	 */
	public function test_status_follows_module_state() {
		$this->connect_owner();

		$this->set_active_modules( array() );
		$this->assertSame( Products::STATUS_MODULE_DISABLED, Activity_Log::get_status() );

		$this->set_active_modules( array( 'activity-log' ) );
		$this->assertSame( Products::STATUS_ACTIVE, Activity_Log::get_status() );
	}

	/**
	 * Activation has to write the shared module option rather than route through
	 * the Jetpack plugin, which a standalone install does not have.
	 */
	public function test_activation_switches_the_module_on() {
		$this->set_active_modules( array() );
		$this->support_activity_log_on_the_current_plan();

		$this->assertTrue( Activity_Log::do_product_specific_activation( true ) );
		$this->assertContains( 'activity-log', ( new Modules() )->get_active() );
		$this->assertTrue( Activity_Log::is_active() );
	}

	/**
	 * And deactivation likewise, so the toggle does not report a success it did
	 * not achieve.
	 */
	public function test_deactivation_switches_the_module_off() {
		$this->set_active_modules( array( 'activity-log' ) );

		$this->assertTrue( Activity_Log::deactivate() );
		$this->assertNotContains( 'activity-log', ( new Modules() )->get_active() );
		$this->assertFalse( Activity_Log::is_active() );
	}

	/**
	 * Modules::activate() asks Current_Plan whether the plan covers the module.
	 * On a real site the answer is yes, because the module header carries no
	 * `Plan Classes` and so defaults to free -- but that is read through the
	 * Jetpack plugin's generated module registry, which the mock has not got.
	 * Prime the plan cache instead of teaching the mock to fake that registry.
	 *
	 * @return void
	 */
	private function support_activity_log_on_the_current_plan() {
		$plan             = Current_Plan::get();
		$plan['supports'] = array_merge( $plan['supports'], array( 'activity-log' ) );
		$this->set_plan_cache( $plan );
	}

	/**
	 * Writes Current_Plan's request-scoped cache, which has no setter.
	 *
	 * @param array|null $plan Plan details, or null to clear.
	 * @return void
	 */
	private function set_plan_cache( $plan ) {
		$cache = new \ReflectionProperty( Current_Plan::class, 'active_plan_cache' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$cache->setAccessible( true );
		}
		$cache->setValue( null, $plan );
	}

	/**
	 * Sets the module state where every plugin reads it, rather than on the mock
	 * Jetpack plugin: a standalone install has no Jetpack plugin to ask.
	 *
	 * @param array $modules Module slugs.
	 * @return void
	 */
	private function set_active_modules( array $modules ) {
		Jetpack_Options::update_option( 'active_modules', $modules );
	}

	/**
	 * Gives the current user a connection token so it counts as the connected owner.
	 *
	 * @return void
	 */
	private function connect_owner() {
		( new Tokens() )->update_blog_token( 'test.test.1' );
		( new Tokens() )->update_user_token( self::$user_id, 'test.test.' . self::$user_id, true );
		Jetpack_Options::update_option( 'id', 123 );
	}

	/**
	 * Tests the product name and title.
	 */
	public function test_name_and_title() {
		$this->assertSame( 'Activity Log', Activity_Log::get_name() );
		$this->assertSame( 'Activity Log', Activity_Log::get_title() );
	}

	/**
	 * Tests the product descriptions.
	 */
	public function test_descriptions() {
		$this->assertNotEmpty( Activity_Log::get_description() );
		$this->assertNotEmpty( Activity_Log::get_long_description() );
	}

	/**
	 * Activity Log has a free tier.
	 */
	public function test_pricing_is_free() {
		$pricing = Activity_Log::get_pricing_for_ui();
		$this->assertTrue( $pricing['available'] );
		$this->assertTrue( $pricing['is_free'] );
	}

	/**
	 * The manage URL points at the native Activity Log page.
	 */
	public function test_manage_url() {
		$this->assertSame( admin_url( 'admin.php?page=jetpack-activity-log' ), Activity_Log::get_manage_url() );
	}

	/**
	 * Activity Log uses the Jetpack plugin.
	 */
	public function test_plugin_installed_and_active() {
		$this->assertTrue( Activity_Log::is_plugin_installed() );
		$this->assertTrue( Activity_Log::is_plugin_active() );
	}
}
