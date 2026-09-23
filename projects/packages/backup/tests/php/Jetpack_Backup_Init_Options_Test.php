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
use WP_REST_Server;
use function do_action;
use function has_action;
use function has_filter;
use function rest_get_server;

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
	 * A host that owns the connection gets the dashboard without the standalone's connection wiring.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_host_owned_connection_skips_the_standalone_wiring() {
		Jetpack_Backup::initialize( array( 'manage_connection' => false ) );

		$this->assertFalse( $this->has_connection_wiring() );
		$this->assertNotFalse( has_action( 'admin_menu', array( Jetpack_Backup::class, 'add_wp_admin_submenu' ) ) );
		$this->assertTrue( $this->has_backup_route() );
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

		$this->assertTrue( $this->has_connection_wiring() );
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
		Jetpack_Backup::initialize( array( 'manage_connection' => false ) );

		Jetpack_Backup::initialize();

		$this->assertFalse( $this->has_connection_wiring() );
	}

	/**
	 * Whether the standalone plugin's connection wiring was added; the license filter stands in for it.
	 *
	 * @return bool
	 */
	private function has_connection_wiring() {
		return false !== has_filter( 'jetpack_connection_user_has_license', array( Jetpack_Backup::class, 'jetpack_check_user_licenses' ) )
			&& false !== has_action( 'plugins_loaded', array( Jetpack_Backup::class, 'maybe_upgrade_db' ) );
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
}
