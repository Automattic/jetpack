<?php

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Boost_Cache_Error;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Filesystem_Utils;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Rebuild_File;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Simple_Delete;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Storage\File_Storage;
use PHPUnit\Framework\TestCase;

class Filesystem_Utils_Test extends TestCase {
	private $test_dir;
	private $boost_cache_dir;

	public function setUp(): void {
		parent::setUp();

		// Create a temporary test directory
		$this->test_dir        = sys_get_temp_dir() . '/boost-test-' . uniqid();
		$this->boost_cache_dir = WP_CONTENT_DIR . '/boost-cache';

		// Create test directories
		mkdir( $this->test_dir, 0755, true );
		mkdir( $this->boost_cache_dir, 0755, true );
	}

	public function tearDown(): void {
		parent::tearDown();

		// Clean up test directories
		$this->recursive_rmdir( $this->test_dir );
		$this->recursive_rmdir( $this->boost_cache_dir );
	}

	private function recursive_rmdir( $dir ) {
		if ( is_dir( $dir ) ) {
			$objects = scandir( $dir );
			foreach ( $objects as $object ) {
				if ( $object !== '.' && $object !== '..' ) {
					if ( is_dir( $dir . '/' . $object ) ) {
						$this->recursive_rmdir( $dir . '/' . $object );
					} else {
						unlink( $dir . '/' . $object );
					}
				}
			}
			rmdir( $dir );
		}
	}

	public function test_is_boost_cache_directory() {
		$this->assertTrue( Filesystem_Utils::is_boost_cache_directory( $this->boost_cache_dir ) );
		$this->assertFalse( Filesystem_Utils::is_boost_cache_directory( $this->test_dir ) );
	}

	public function test_get_request_filename() {
		$parameters = array(
			'url'     => 'https://example.com',
			'cookies' => array( 'test' => 'value' ),
			'get'     => array( 'param' => 'value' ),
		);

		$filename = Filesystem_Utils::get_request_filename( $parameters );
		$this->assertIsString( $filename );
		$this->assertEquals( 32, strlen( md5( json_encode( $parameters ) ) ) );
		$this->assertStringEndsWith( '.html', $filename );
	}

	public function test_is_rebuild_file() {
		$normal_file  = 'test.html';
		$rebuild_file = 'test.html.rebuild.html';

		$this->assertFalse( Filesystem_Utils::is_rebuild_file( $normal_file ) );
		$this->assertTrue( Filesystem_Utils::is_rebuild_file( $rebuild_file ) );
	}

	public function test_create_directory() {
		$new_dir = $this->boost_cache_dir . '/test-dir';

		$this->assertTrue( Filesystem_Utils::create_directory( $new_dir ) );
		$this->assertTrue( is_dir( $new_dir ) );
		$this->assertTrue( file_exists( $new_dir . '/index.html' ) );
	}

	public function test_write_to_file() {
		$test_file = $this->boost_cache_dir . '/test.html';
		$test_data = 'Test content';

		$result = Filesystem_Utils::write_to_file( $test_file, $test_data );
		$this->assertTrue( $result );
		$this->assertTrue( file_exists( $test_file ) );
		$this->assertEquals( $test_data, file_get_contents( $test_file ) );
	}

	public function test_delete_file() {
		$test_file = $this->boost_cache_dir . '/test.html';
		file_put_contents( $test_file, 'Test content' );

		$this->assertTrue( Filesystem_Utils::delete_file( $test_file ) );
		$this->assertFalse( file_exists( $test_file ) );
	}

	public function test_is_dir_empty() {
		$empty_dir     = $this->boost_cache_dir . '/empty-dir';
		$non_empty_dir = $this->boost_cache_dir . '/non-empty-dir';

		mkdir( $empty_dir, 0755, true );
		mkdir( $non_empty_dir, 0755, true );
		file_put_contents( $non_empty_dir . '/test.html', 'Test content' );

		$this->assertTrue( Filesystem_Utils::is_dir_empty( $empty_dir ) );
		$this->assertFalse( Filesystem_Utils::is_dir_empty( $non_empty_dir ) );
	}

	public function test_directory_iteration_delete_all() {
		$test_dir = $this->boost_cache_dir . '/walk-test';
		mkdir( $test_dir, 0755, true );
		file_put_contents( $test_dir . '/test1.html', 'Test 1' );
		file_put_contents( $test_dir . '/test2.html', 'Test 2' );
		mkdir( $test_dir . '/subdir', 0755, true );
		file_put_contents( $test_dir . '/subdir/test3.html', 'Test 3' );

		$result = Filesystem_Utils::iterate_directory( $test_dir, new Simple_Delete() );
		$this->assertTrue( $result === 5 );
		$this->assertFalse( file_exists( $test_dir ) );
	}

	public function test_directory_iteration_rebuild_all() {
		$test_dir = $this->boost_cache_dir . '/rebuild-test';
		mkdir( $test_dir, 0755, true );
		file_put_contents( $test_dir . '/test1.html', 'Test 1' );
		file_put_contents( $test_dir . '/test2.html', 'Test 2' );
		file_put_contents( $test_dir . '/test3.html.rebuild.html', 'Test 3' );

		$result = Filesystem_Utils::iterate_directory( $test_dir, new Rebuild_File() );
		$this->assertTrue( $result === 3 );
		$this->assertTrue( file_exists( $test_dir . '/test1.html.rebuild.html' ) );
		$this->assertTrue( file_exists( $test_dir . '/test2.html.rebuild.html' ) );

		// Trying to rebuild a file that is already a rebuild file should delete it.
		$this->assertFalse( file_exists( $test_dir . '/test3.html.rebuild.html' ) );
	}

	public function test_gc_expired_files() {
		$test_dir = $this->boost_cache_dir . '/cache/gc-test';
		mkdir( $test_dir, 0755, true );

		// Create test files with different modification times
		$file1 = $test_dir . '/test1.html';
		$file2 = $test_dir . '/test2.html';
		file_put_contents( $file1, 'Test 1' );
		file_put_contents( $file2, 'Test 2' );

		// Set file1 to be expired
		touch( $file1, time() - 3600 );

		$storage = new File_Storage( 'gc-test' );
		$count   = $storage->garbage_collect( 1800 );
		$this->assertSame( 1, $count );
		$this->assertFalse( file_exists( $file1 ) );
		$this->assertTrue( file_exists( $file2 ) );
	}

	public function test_invalid_directory_operations() {
		$non_existent_dir = $this->boost_cache_dir . '/non-existent';
		$invalid_dir      = $this->test_dir;

		// Test walk_directory with non-existent directory
		$result = Filesystem_Utils::iterate_directory( $non_existent_dir, new Simple_Delete() );
		$this->assertInstanceOf( Boost_Cache_Error::class, $result );
		$this->assertEquals( 'directory-missing', $result->get_error_code() );

		// Test walk_directory with invalid directory
		$result = Filesystem_Utils::iterate_directory( $invalid_dir, new Simple_Delete() );
		$this->assertInstanceOf( Boost_Cache_Error::class, $result );
		$this->assertEquals( 'invalid-directory', $result->get_error_code() );
	}
}
