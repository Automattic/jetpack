<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Backup;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Rest_Products
 */
class Test_Product_Multiple_Filenames extends TestCase {

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * The secondary user id.
	 *
	 * @var int
	 */
	private static $secondary_user_id;

	/**
	 * The possible folders for the Backup plugin
	 *
	 * @var int
	 */
	private static $possible_folders = array(
		'backup',
		'jetpack-backup',
		'jetpack-backup-dev',
	);

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {

		if ( version_compare( phpversion(), '5.7', '<=' ) ) {
			$this->markTestSkipped( 'avoid bug in PHP 5.6 that throws strict mode warnings for abstract static methods.' );
		}

		if ( file_exists( WP_PLUGIN_DIR . '/jetpack/jetpack.php' ) ) {
			unlink( WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
			rmdir( WP_PLUGIN_DIR . '/jetpack' );
		}

	}

	/**
	 * Installs the mock plugin present in the test assets folder as if it was the Boost plugin
	 *
	 * @param string $dest_folder The folder destination for the mock backup plugin.
	 *
	 * @return void
	 */
	public function install_mock_plugin( $dest_folder ) {
		$plugin_dir = WP_PLUGIN_DIR . '/' . $dest_folder;
		if ( ! file_exists( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}

		copy( __DIR__ . '/assets/backup-mock-plugin.txt', WP_PLUGIN_DIR . '/' . $dest_folder . '/jetpack-backup.php' );

	}

	/**
	 * Uninstalls the Backup mock plugin
	 *
	 * @return void
	 */
	public function uninstall_mock_plugins() {
		foreach ( self::$possible_folders as $folder ) {
			if ( file_exists( WP_PLUGIN_DIR . '/' . $folder . '/jetpack-backup.php' ) ) {
				unlink( WP_PLUGIN_DIR . '/' . $folder . '/jetpack-backup.php' );
				rmdir( WP_PLUGIN_DIR . '/' . $folder );
			}
		}
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {

		WorDBless_Options::init()->clear_options();

	}

	/**
	 * Data provider for test_installed_plugin_filename
	 *
	 * @return array
	 */
	public function installed_plugin_filename_data() {
		$data = array();
		foreach ( self::$possible_folders as $folder ) {
			$data[ $folder ] = array( $folder );
		}
		$data['invalid'] = array(
			'invalid_folder',
			false,
		);
		return $data;
	}

	/**
	 * Data provider for test_activate
	 *
	 * @return array
	 */
	public function activate_data() {
		$data = array();
		foreach ( self::$possible_folders as $folder ) {
			$data[ $folder ] = array( $folder );
		}
		return $data;
	}

	/**
	 * Tests multiple folders for a plugin
	 *
	 * @param string $folder The folder of the Backup plugin.
	 * @param bool   $success whether we expect to find the plugin or not.
	 *
	 * @dataProvider installed_plugin_filename_data
	 */
	public function test_installed_plugin_filename( $folder, $success = true ) {
		$this->uninstall_mock_plugins();
		$this->install_mock_plugin( $folder );
		wp_cache_delete( 'plugins', 'plugins' );

		$this->assertSame( $success, Backup::is_plugin_installed() );
		$expected_file = $success ? $folder . '/jetpack-backup.php' : null;
		$this->assertSame( $expected_file, Backup::get_installed_plugin_filename() );

	}

	/**
	 * Tests multiple folders for a plugin - activation
	 *
	 * @param string $folder The folder of the Backup plugin.
	 *
	 * @dataProvider activate_data
	 */
	public function test_activate( $folder ) {
		$this->uninstall_mock_plugins();
		$this->install_mock_plugin( $folder );
		wp_cache_delete( 'plugins', 'plugins' );

		$filename = Backup::get_installed_plugin_filename();

		$this->assertFalse( Backup::is_active() );
		$this->assertFalse( is_plugin_active( $filename ) );

		Backup::activate();

		$this->assertTrue( Backup::is_active() );
		$this->assertTrue( is_plugin_active( $filename ) );

	}

}
