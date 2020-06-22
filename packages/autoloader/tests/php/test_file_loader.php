<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Testing file for the autoloader package.
 *
 * @package automattic/jetpack-autoloader
 */

use Automattic\Jetpack\Autoloader as Autoloader;
use PHPUnit\Framework\TestCase;

/**
 * Class WP_Test_File_Loader
 */
class WP_Test_File_Loader extends TestCase {
	/**
	 * Jetpack Package files.
	 *
	 * @var $jetpack_packages_files
	 */
	public static $jetpack_packages_files;

	/**
	 * Test setup.
	 */
	public function setup() {
		parent::setup();
		global $jetpack_packages_files;
		self::$jetpack_packages_files = $jetpack_packages_files;
		$jetpack_packages_files       = array();
	}

	/**
	 * Test tear down.
	 */
	public function tearDown() {
		parent::tearDown();
		// re-apply the global.
		global $jetpack_packages_files;
		$jetpack_packages_files = self::$jetpack_packages_files;
	}

	/**
	 * Does enqueuing add to the global array?
	 */
	public function test_enqueueing_adds_to_the_global_array() {
		Autoloader\enqueue_package_file( 'file_id_10', '1', 'path_to_file.php' );

		global $jetpack_packages_files;
		$this->assertTrue( isset( $jetpack_packages_files['file_id_10'] ) );
		$this->assertEquals( $jetpack_packages_files['file_id_10']['version'], '1' );
		$this->assertEquals( $jetpack_packages_files['file_id_10']['path'], 'path_to_file.php' );
	}

	/**
	 * Tests that latest version is added to the global array.
	 */
	public function test_enqueueing_adds_the_latest_version_to_the_global_array() {
		Autoloader\enqueue_package_file( 'file_id', '1', 'path_to_file' );
		Autoloader\enqueue_package_file( 'file_id', '2', 'path_to_file_v2' );

		global $jetpack_packages_files;
		$this->assertTrue( isset( $jetpack_packages_files['file_id'] ) );
		$this->assertEquals( $jetpack_packages_files['file_id']['version'], '2' );
		$this->assertEquals( $jetpack_packages_files['file_id']['path'], 'path_to_file_v2' );
	}

	/**
	 * Tests that dev version is added to array.
	 */
	public function test_enqueueing_always_adds_the_dev_version_to_the_global_array() {

		Autoloader\enqueue_package_file( 'file_id', '1', 'path_to_file' );
		Autoloader\enqueue_package_file( 'file_id', 'dev-howdy', 'path_to_file_dev' );
		Autoloader\enqueue_package_file( 'file_id', '2', 'path_to_file_v2' );

		global $jetpack_packages_files;
		$this->assertTrue( isset( $jetpack_packages_files['file_id'] ) );
		$this->assertEquals( $jetpack_packages_files['file_id']['version'], 'dev-howdy' );
		$this->assertEquals( $jetpack_packages_files['file_id']['path'], 'path_to_file_dev' );
	}

	/**
	 * Tests that a file is loaded.
	 */
	public function test_enqueued_file_is_actually_loaded() {

		Autoloader\enqueue_package_file( 'file_id', '1', __DIR__ . '/path_to_file.php' );

		Autoloader\file_loader();
		$this->assertTrue( function_exists( 'if_i_exist_then_this_test_passed' ) );
		$this->assertTrue( if_i_exist_then_this_test_passed() );

		Autoloader\enqueue_package_file( 'file_id', '2', __DIR__ . '/bogus_path_to_file.php' );

		Autoloader\file_loader(); // file_loader should not include same file twice.

		$this->assertTrue( if_i_exist_then_this_test_passed() );
	}
}
