<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowerCase
/**
 * File loader test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the Autoloader part that handles file loading.
 */
class WP_Test_File_Loader extends TestCase {

	/**
	 * Tests whether enqueueing adds a file to the global array.
	 */
	public function test_enqueueing_adds_to_the_global_array() {
		enqueue_package_file( 'file_id_10', '1', 'path_to_file.php' );

		global $jetpack_packages_filemap;
		$this->assertTrue( isset( $jetpack_packages_filemap['file_id_10'] ) );
		$this->assertEquals( $jetpack_packages_filemap['file_id_10']['version'], '1' );
		$this->assertEquals( $jetpack_packages_filemap['file_id_10']['path'], 'path_to_file.php' );
	}

	/**
	 * Tests whether enqueueing adds the latest file version to the global array.
	 */
	public function test_enqueueing_adds_the_latest_version_to_the_global_array() {
		enqueue_package_file( 'file_id', '1', 'path_to_file' );
		enqueue_package_file( 'file_id', '2', 'path_to_file_v2' );

		global $jetpack_packages_filemap;
		$this->assertTrue( isset( $jetpack_packages_filemap['file_id'] ) );
		$this->assertEquals( $jetpack_packages_filemap['file_id']['version'], '2' );
		$this->assertEquals( $jetpack_packages_filemap['file_id']['path'], 'path_to_file_v2' );
	}

	/**
	 * Tests whether enqueueing prioritizes the dev version of the file.
	 */
	public function test_enqueueing_always_adds_the_dev_version_to_the_global_array() {

		enqueue_package_file( 'file_id', '1', 'path_to_file' );
		enqueue_package_file( 'file_id', 'dev-howdy', 'path_to_file_dev' );
		enqueue_package_file( 'file_id', '2', 'path_to_file_v2' );

		global $jetpack_packages_filemap;
		$this->assertTrue( isset( $jetpack_packages_filemap['file_id'] ) );
		$this->assertEquals( $jetpack_packages_filemap['file_id']['version'], 'dev-howdy' );
		$this->assertEquals( $jetpack_packages_filemap['file_id']['path'], 'path_to_file_dev' );
	}

	/**
	 * Tests whether enqueueing works with autoloading.
	 */
	public function test_enqueued_file_is_actually_loaded() {

		enqueue_package_file( 'file_id', '1', __DIR__ . '/path_to_file.php' );

		file_loader();
		$this->assertTrue( function_exists( 'if_i_exist_then_this_test_passed' ) );
		$this->assertTrue( if_i_exist_then_this_test_passed() );

		enqueue_package_file( 'file_id', '2', __DIR__ . '/bogus_path_to_file.php' );

		file_loader(); // file_loader should not include same file twice.

		$this->assertTrue( if_i_exist_then_this_test_passed() );
	}
}
