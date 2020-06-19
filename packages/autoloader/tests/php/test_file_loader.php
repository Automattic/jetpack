<?php

use Automattic\Jetpack\Autoloader as Autoloader;
use PHPUnit\Framework\TestCase;

class WP_Test_File_Loader extends TestCase {
	static $jetpack_packages_files;
	function setup() {
		parent::setup();
		global $jetpack_packages_files;
		self::$jetpack_packages_files = $jetpack_packages_files;
		$jetpack_packages_files       = array();
	}

	function tearDown() {
		parent::tearDown();
		// re-apply the global
		global $jetpack_packages_files;
		$jetpack_packages_files = self::$jetpack_packages_files;
	}

	function test_enqueueing_adds_to_the_global_array() {
		Autoloader\enqueue_package_file( 'file_id_10', '1', 'path_to_file.php' );

		global $jetpack_packages_files;
		$this->assertTrue( isset( $jetpack_packages_files['file_id_10'] ) );
		$this->assertEquals( $jetpack_packages_files['file_id_10']['version'], '1' );
		$this->assertEquals( $jetpack_packages_files['file_id_10']['path'], 'path_to_file.php' );
	}

	function test_enqueueing_adds_the_latest_version_to_the_global_array() {
		Autoloader\enqueue_package_file( 'file_id', '1', 'path_to_file' );
		Autoloader\enqueue_package_file( 'file_id', '2', 'path_to_file_v2' );

		global $jetpack_packages_files;
		$this->assertTrue( isset( $jetpack_packages_files['file_id'] ) );
		$this->assertEquals( $jetpack_packages_files['file_id']['version'], '2' );
		$this->assertEquals( $jetpack_packages_files['file_id']['path'], 'path_to_file_v2' );
	}

	function test_enqueueing_always_adds_the_dev_version_to_the_global_array() {

		Autoloader\enqueue_package_file( 'file_id', '1', 'path_to_file' );
		Autoloader\enqueue_package_file( 'file_id', 'dev-howdy', 'path_to_file_dev' );
		Autoloader\enqueue_package_file( 'file_id', '2', 'path_to_file_v2' );

		global $jetpack_packages_files;
		$this->assertTrue( isset( $jetpack_packages_files['file_id'] ) );
		$this->assertEquals( $jetpack_packages_files['file_id']['version'], 'dev-howdy' );
		$this->assertEquals( $jetpack_packages_files['file_id']['path'], 'path_to_file_dev' );
	}

	function test_enqueued_file_is_actually_loaded() {

		Autoloader\enqueue_package_file( 'file_id', '1', __DIR__ . '/path_to_file.php' );

		Autoloader\file_loader();
		$this->assertTrue( function_exists( 'if_i_exist_then_this_test_passed' ) );
		$this->assertTrue( if_i_exist_then_this_test_passed() );

		Autoloader\enqueue_package_file( 'file_id', '2', __DIR__ . '/bogus_path_to_file.php' );

		Autoloader\file_loader(); // file_loader should not include same file twice.

		$this->assertTrue( if_i_exist_then_this_test_passed() );
	}
}
