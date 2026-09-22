<?php
/**
 * Unit tests for where My Jetpack sends someone to manage Backup.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use Automattic\Jetpack\My_Jetpack\Products\Backup as My_Jetpack_Backup;
use Automattic\Jetpack\Redirect;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use function admin_url;
use function update_option;
use function wp_cache_delete;

/**
 * Tests that the Manage link and the menu agree about the in-plugin dashboard.
 *
 * Lives here, not in My Jetpack, because it needs a real `Jetpack_Backup`.
 *
 * @covers \Automattic\Jetpack\Backup\V0005\Jetpack_Backup
 */
#[CoversClass( Jetpack_Backup::class )]
class Backup_Manage_Url_Test extends TestCase {

	/**
	 * Reset state.
	 */
	public function tearDown(): void {
		$this->uninstall_jetpack_plugin();
		WorDBless_Options::init()->clear_options();

		parent::tearDown();
	}

	/**
	 * An entitled site manages Backup in wp-admin.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_an_entitled_site_manages_backup_in_wp_admin() {
		$this->arrange_jetpack_plugin_only();
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( true );

		$this->assertSame( admin_url( 'admin.php?page=jetpack-backup' ), My_Jetpack_Backup::get_manage_url() );
	}

	/**
	 * A site whose plan lacks self-serve Backup is sent to the cloud, not to a page that 403s.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_a_site_without_the_feature_is_sent_to_the_cloud() {
		$this->arrange_jetpack_plugin_only();
		Jetpack_Backup::initialize( array( 'require_backup_plan' => true ) );
		$this->arrange_stored_answer( false );

		$this->assertSame( Redirect::get_url( 'my-jetpack-manage-backup' ), My_Jetpack_Backup::get_manage_url() );
	}

	/**
	 * So is a request that never initialized the package, which registers no page either.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_an_uninitialized_package_is_sent_to_the_cloud() {
		$this->arrange_jetpack_plugin_only();
		$this->arrange_stored_answer( true );

		$this->assertSame( Redirect::get_url( 'my-jetpack-manage-backup' ), My_Jetpack_Backup::get_manage_url() );
	}

	/**
	 * Install and activate a stand-in Jetpack plugin, and nothing else.
	 */
	private function arrange_jetpack_plugin_only() {
		if ( ! is_dir( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		file_put_contents( WP_PLUGIN_DIR . '/jetpack/jetpack.php', "<?php\n/**\n * Plugin Name: Jetpack\n */\n" );

		// `get_plugins()` memoizes its directory scan, which predates the file just written.
		wp_cache_delete( 'plugins', 'plugins' );
		update_option( 'active_plugins', array( 'jetpack/jetpack.php' ) );
	}

	/**
	 * Undo `arrange_jetpack_plugin_only()`, which writes into a shared plugins directory.
	 */
	private function uninstall_jetpack_plugin() {
		if ( file_exists( WP_PLUGIN_DIR . '/jetpack/jetpack.php' ) ) {
			unlink( WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
		}

		// Another suite's fixtures share this directory, and rmdir warns on a full one.
		if ( is_dir( WP_PLUGIN_DIR . '/jetpack' ) && count( scandir( WP_PLUGIN_DIR . '/jetpack' ) ) === 2 ) {
			rmdir( WP_PLUGIN_DIR . '/jetpack' );
		}
		wp_cache_delete( 'plugins', 'plugins' );
	}

	/**
	 * Store an answer as though My Jetpack had just given it.
	 *
	 * @param bool $has_backup The answer to store.
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
