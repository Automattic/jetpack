<?php
/**
 * Unit tests for Jetpack_Backup::initialize() options.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Server;
use function do_action;
use function has_action;
use function has_filter;
use function rest_get_server;
use function update_option;
use function wp_insert_user;
use function wp_rand;
use function wp_set_current_user;

/**
 * Tests for how a host plugin initializes the package.
 *
 * Every test runs in a child process, because `initialize()` runs once per process.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\Jetpack_Backup
 */
#[CoversClass( Jetpack_Backup::class )]
class Jetpack_Backup_Init_Options_Test extends TestCase {

	/**
	 * The `load-` hook the package registers only once its menu page exists.
	 *
	 * @var string
	 */
	const MENU_LOAD_HOOK = 'load-jetpack_page_jetpack-backup';

	/**
	 * Reset state.
	 */
	public function tearDown(): void {
		wp_set_current_user( 0 );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * The standalone plugin's menu and routes do not depend on what WordPress.com says.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_ungated_dashboard_ignores_the_feature() {
		Jetpack_Backup::initialize();
		$this->arrange_stored_answer( false );

		$this->assertTrue( $this->has_backup_menu() );
		$this->assertTrue( $this->has_backup_route() );
	}

	/**
	 * A host that gates on the plan draws nothing for a site whose plan lacks Backup.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_gated_dashboard_is_absent_without_the_feature() {
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( false );
		$this->sign_in( 'administrator' );

		$this->assertFalse( $this->has_backup_menu() );
		$this->assertFalse( $this->has_backup_route() );
	}

	/**
	 * The same host draws both once the site's plan includes Backup.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_gated_dashboard_is_present_with_the_feature() {
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( true );
		$this->sign_in( 'administrator' );

		$this->assertTrue( $this->has_backup_menu() );
		$this->assertTrue( $this->has_backup_route() );
	}

	/**
	 * Gated routes are skipped for anyone their permission checks would refuse anyway.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_gated_rest_routes_are_absent_for_a_non_admin() {
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( true );
		$this->sign_in( 'subscriber' );

		$this->assertFalse( $this->has_backup_route() );
	}

	/**
	 * A host that owns the connection does not get the standalone's connection wiring.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_host_owned_connection_skips_the_standalone_wiring() {
		Jetpack_Backup::initialize( array( 'manage_connection' => false ) );

		$this->assertFalse( has_filter( 'jetpack_connection_user_has_license', array( Jetpack_Backup::class, 'jetpack_check_user_licenses' ) ) );
		$this->assertFalse( has_action( 'plugins_loaded', array( Jetpack_Backup::class, 'maybe_upgrade_db' ) ) );
	}

	/**
	 * The standalone plugin still gets it.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_standalone_keeps_the_connection_wiring() {
		Jetpack_Backup::initialize();

		$this->assertNotFalse( has_filter( 'jetpack_connection_user_has_license', array( Jetpack_Backup::class, 'jetpack_check_user_licenses' ) ) );
		$this->assertNotFalse( has_action( 'plugins_loaded', array( Jetpack_Backup::class, 'maybe_upgrade_db' ) ) );
	}

	/**
	 * With both plugins active, the first `initialize()` wins, which is always the standalone's.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_second_initialize_does_not_re_apply_options() {
		Jetpack_Backup::initialize();

		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( false );

		$this->assertTrue( $this->has_backup_menu() );
	}

	/**
	 * Build the admin menu and report whether Backup added its page.
	 *
	 * @return bool
	 */
	private function has_backup_menu() {
		Jetpack_Backup::add_wp_admin_submenu();

		return false !== has_action( self::MENU_LOAD_HOOK, array( Jetpack_Backup::class, 'admin_init' ) );
	}

	/**
	 * Fire `rest_api_init` against a fresh server and report whether Backup answered.
	 *
	 * @return bool
	 */
	private function has_backup_route() {
		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		do_action( 'rest_api_init' );

		return array_key_exists( '/jetpack/v4/has-backup-plan', rest_get_server()->get_routes() );
	}

	/**
	 * Sign in a new user with this role.
	 *
	 * @param string $role The user's role.
	 */
	private function sign_in( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . '_' . wp_rand( 1, PHP_INT_MAX ),
				'user_pass'  => 'dummy_pass',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Store an answer as though My Jetpack had just given it.
	 *
	 * @param bool $has_backup Whether the site's plan includes Backup.
	 */
	private function arrange_stored_answer( $has_backup ) {
		update_option(
			Backup_Feature_Check::OPTION,
			array(
				'has_backup'  => $has_backup,
				'stale_after' => time() + Backup_Feature_Check::TTL,
			),
			false
		);
	}
}
