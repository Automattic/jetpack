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
use WP_REST_Server;
use function do_action;
use function has_action;
use function has_filter;
use function rest_get_server;
use function update_option;

/**
 * Tests for how a host plugin initializes the package.
 *
 * Every test here runs in a child process: `initialize()` guards on
 * `did_action( 'jetpack_backup_initialized' )`, which a shared process would
 * leave fired for each later test.
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
		WorDBless_Options::init()->clear_options();

		parent::tearDown();
	}

	/**
	 * The standalone plugin's menu does not depend on what WordPress.com says.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_menu_is_unconditional_by_default() {
		Jetpack_Backup::initialize();

		Jetpack_Backup::add_wp_admin_submenu();

		$this->assertNotFalse( has_action( self::MENU_LOAD_HOOK, array( Jetpack_Backup::class, 'admin_init' ) ) );
	}

	/**
	 * A host that gates on the plan draws no menu for a site whose plan lacks Backup.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_gated_menu_is_absent_without_the_feature() {
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( false );

		Jetpack_Backup::add_wp_admin_submenu();

		$this->assertFalse( has_action( self::MENU_LOAD_HOOK, array( Jetpack_Backup::class, 'admin_init' ) ) );
	}

	/**
	 * The same host draws it once the site's plan includes Backup.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_gated_menu_is_present_with_the_feature() {
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( true );

		Jetpack_Backup::add_wp_admin_submenu();

		$this->assertNotFalse( has_action( self::MENU_LOAD_HOOK, array( Jetpack_Backup::class, 'admin_init' ) ) );
	}

	/**
	 * A host that owns the connection does not get the standalone's connection wiring.
	 *
	 * The license filter stands in for that whole block, which `initialize()` adds or
	 * skips together.
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
	 * With both plugins active, whichever initializes first wins and the second is ignored.
	 *
	 * The standalone plugin calls `initialize()` at file scope and the Jetpack plugin on
	 * `plugins_loaded`, so in practice the standalone is always the one that wins.
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
		Jetpack_Backup::add_wp_admin_submenu();

		$this->assertNotFalse( has_action( self::MENU_LOAD_HOOK, array( Jetpack_Backup::class, 'admin_init' ) ) );
	}

	/**
	 * The dashboard's routes answer to the same gate its menu does.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_gated_rest_routes_are_absent_without_the_feature() {
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( false );

		$this->assertFalse( $this->has_backup_route() );
	}

	/**
	 * And register once the site's plan includes Backup.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_gated_rest_routes_are_present_with_the_feature() {
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( true );

		$this->assertTrue( $this->has_backup_route() );
	}

	/**
	 * The standalone plugin registers them whatever WordPress.com says.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_ungated_rest_routes_ignore_the_feature() {
		Jetpack_Backup::initialize();
		$this->arrange_stored_answer( false );

		$this->assertTrue( $this->has_backup_route() );
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
	 * My Jetpack links to the page, so its answer has to track the menu's.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_dashboard_availability_tracks_the_gated_menu() {
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );

		$this->arrange_stored_answer( false );
		$this->assertFalse( Jetpack_Backup::is_dashboard_available() );

		$this->arrange_stored_answer( true );
		$this->assertTrue( Jetpack_Backup::is_dashboard_available() );
	}

	/**
	 * A package that ships with a plugin but was never initialized registers no page.
	 *
	 * The Jetpack plugin only initializes on admin and REST requests, and My Jetpack
	 * must not link to a page that a plain front-end request never registered.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_dashboard_is_unavailable_until_the_package_is_initialized() {
		$this->arrange_stored_answer( true );

		$this->assertFalse( Jetpack_Backup::is_dashboard_available() );
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
