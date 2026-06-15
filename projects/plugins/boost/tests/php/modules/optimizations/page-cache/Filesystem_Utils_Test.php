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

		if ( ! defined( 'WP_CONTENT_DIR' ) ) {
			define( 'WP_CONTENT_DIR', '/tmp/wordpress/wp-content' );
		}

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

	public function test_delete_directory_removes_entire_tree() {
		// Mimic the layout of a real boost-cache directory, including index.html
		// placeholder files in every directory, and the logs/ and static/ subdirectories.
		mkdir( $this->boost_cache_dir . '/cache/example.com/some/page', 0755, true );
		mkdir( $this->boost_cache_dir . '/logs', 0755, true );
		mkdir( $this->boost_cache_dir . '/static', 0755, true );

		file_put_contents( $this->boost_cache_dir . '/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/cache/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/cache/example.com/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/cache/example.com/some/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/cache/example.com/some/page/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/cache/example.com/some/page/' . md5( 'request' ) . '.html', 'cached page' );
		file_put_contents( $this->boost_cache_dir . '/logs/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/logs/log-2026-06-11.log.php', 'log data' );
		file_put_contents( $this->boost_cache_dir . '/static/index.html', '' );
		file_put_contents( $this->boost_cache_dir . '/static/file.css', 'css' );

		$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );
		$this->assertTrue( $result );
		$this->assertFalse( file_exists( $this->boost_cache_dir ) );
	}

	public function test_delete_directory_with_deep_and_many_file_tree() {
		// Many files spread across many subdirectories.
		for ( $i = 0; $i < 20; $i++ ) {
			$dir = $this->boost_cache_dir . '/cache/example.com/page-' . $i;
			mkdir( $dir, 0755, true );
			file_put_contents( $dir . '/index.html', '' );
			for ( $j = 0; $j < 50; $j++ ) {
				file_put_contents( $dir . '/file-' . $j . '.html', 'cached content' );
			}
		}

		// A deeply nested directory tree.
		$deep_dir = $this->boost_cache_dir . '/cache/deep';
		for ( $i = 0; $i < 30; $i++ ) {
			$deep_dir .= '/level-' . $i;
		}
		mkdir( $deep_dir, 0755, true );
		file_put_contents( $deep_dir . '/leaf.html', 'cached content' );

		$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );
		$this->assertTrue( $result );
		$this->assertFalse( is_dir( $this->boost_cache_dir ) );
	}

	public function test_delete_directory_refuses_paths_outside_boost_cache() {
		file_put_contents( $this->test_dir . '/test.html', 'Test content' );

		$result = Filesystem_Utils::delete_directory( $this->test_dir );
		$this->assertInstanceOf( Boost_Cache_Error::class, $result );
		$this->assertEquals( 'invalid-directory', $result->get_error_code() );
		$this->assertTrue( is_dir( $this->test_dir ) );
		$this->assertTrue( file_exists( $this->test_dir . '/test.html' ) );
	}

	public function test_delete_directory_refuses_sibling_directory_with_boost_cache_prefix() {
		// A sibling like boost-cache-old passes is_boost_cache_directory()'s
		// substring match, so delete_directory()'s own strict containment
		// check is what must refuse it.
		$sibling = $this->boost_cache_dir . '-old';
		mkdir( $sibling, 0755, true );
		file_put_contents( $sibling . '/test.html', 'Test content' );

		try {
			$result = Filesystem_Utils::delete_directory( $sibling );
			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'invalid-directory', $result->get_error_code() );
			$this->assertTrue( is_dir( $sibling ) );
			$this->assertTrue( file_exists( $sibling . '/test.html' ) );
		} finally {
			$this->recursive_rmdir( $sibling );
		}
	}

	public function test_delete_directory_refuses_file_path() {
		$file = $this->boost_cache_dir . '/cached-page.html';
		file_put_contents( $file, 'cached page' );

		$result = Filesystem_Utils::delete_directory( $file );
		$this->assertInstanceOf( Boost_Cache_Error::class, $result );
		$this->assertEquals( 'not-a-directory', $result->get_error_code() );
		$this->assertTrue( file_exists( $file ) );
	}

	public function test_delete_directory_returns_error_for_unreadable_subdirectory() {
		if ( function_exists( 'posix_geteuid' ) && 0 === posix_geteuid() ) {
			$this->markTestSkipped( 'Directory permission restrictions do not apply when running as root.' );
		}

		$locked = $this->boost_cache_dir . '/cache/locked';
		mkdir( $locked, 0755, true );
		file_put_contents( $locked . '/file.html', 'cached page' );
		chmod( $locked, 0000 );

		try {
			$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );
			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'could-not-delete-directory', $result->get_error_code() );
		} finally {
			chmod( $locked, 0755 );
		}
	}

	public function test_delete_directory_sweeps_readable_entries_despite_unreadable_subdirectory() {
		if ( function_exists( 'posix_geteuid' ) && 0 === posix_geteuid() ) {
			$this->markTestSkipped( 'Directory permission restrictions do not apply when running as root.' );
		}

		// One unreadable subdirectory must not abort the whole cleanup: the walk is
		// best-effort (CATCH_GET_CHILD), so readable siblings are still deleted.
		$readable = $this->boost_cache_dir . '/cache/readable';
		mkdir( $readable, 0755, true );
		file_put_contents( $readable . '/file.html', 'cached page' );

		$locked = $this->boost_cache_dir . '/cache/locked';
		mkdir( $locked, 0755, true );
		file_put_contents( $locked . '/file.html', 'cached page' );
		chmod( $locked, 0000 );

		try {
			$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );

			// The unreadable subtree survives, so the overall result is still an error.
			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'could-not-delete-directory', $result->get_error_code() );
			// ...but the readable sibling was swept rather than left behind.
			$this->assertFalse( is_dir( $readable ) );
		} finally {
			chmod( $locked, 0755 );
		}
	}

	public function test_delete_directory_with_missing_directory() {
		$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir . '/non-existent' );
		$this->assertTrue( $result );
	}

	public function test_delete_directory_unlinks_symlink_without_deleting_target() {
		if ( ! function_exists( 'symlink' ) ) {
			$this->markTestSkipped( 'symlink() is not available on this platform.' );
		}

		// A directory outside boost-cache, with a file in it, that must survive.
		$external_target = $this->test_dir . '/external-target';
		mkdir( $external_target, 0755, true );
		file_put_contents( $external_target . '/keep.txt', 'must survive' );

		// A symlink INSIDE the cache tree that points at the external directory.
		// The deletion loop must unlink the link itself, not follow it.
		if ( ! @symlink( $external_target, $this->boost_cache_dir . '/link-to-outside' ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$this->markTestSkipped( 'Could not create a symlink on this platform.' );
		}
		file_put_contents( $this->boost_cache_dir . '/cached.html', 'cached page' );

		$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );

		$this->assertTrue( $result );
		$this->assertFalse( is_dir( $this->boost_cache_dir ) );
		// The link was removed but its target and contents are untouched.
		$this->assertTrue( is_dir( $external_target ) );
		$this->assertTrue( file_exists( $external_target . '/keep.txt' ) );
	}

	public function test_delete_directory_refuses_symlinked_cache_root() {
		if ( ! function_exists( 'symlink' ) ) {
			$this->markTestSkipped( 'symlink() is not available on this platform.' );
		}

		// A directory outside boost-cache that must survive.
		$external_target = $this->test_dir . '/external-root-target';
		mkdir( $external_target, 0755, true );
		file_put_contents( $external_target . '/keep.txt', 'must survive' );

		// Replace the boost-cache root itself with a symlink to the external
		// directory. realpath() resolves both sides identically, so the
		// containment check passes; the is_link() guard is what must refuse it.
		rmdir( $this->boost_cache_dir );
		if ( ! @symlink( $external_target, $this->boost_cache_dir ) ) { // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			mkdir( $this->boost_cache_dir, 0755, true );
			$this->markTestSkipped( 'Could not create a symlink on this platform.' );
		}

		try {
			$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );

			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'invalid-directory', $result->get_error_code() );
			$this->assertTrue( is_dir( $external_target ) );
			$this->assertTrue( file_exists( $external_target . '/keep.txt' ) );
		} finally {
			// Remove the symlink so tearDown does not follow it into the target.
			if ( is_link( $this->boost_cache_dir ) ) {
				unlink( $this->boost_cache_dir );
			}
		}
	}

	public function test_delete_directory_returns_error_when_root_rmdir_fails() {
		if ( function_exists( 'posix_geteuid' ) && 0 === posix_geteuid() ) {
			$this->markTestSkipped( 'Directory permission restrictions do not apply when running as root.' );
		}

		// Files inside the cache delete fine, but a read-only parent makes the
		// final rmdir() of the root fail. This exercises the post-iteration
		// is_dir() guard, a different code path than the iterator-throw case.
		file_put_contents( $this->boost_cache_dir . '/cached.html', 'cached page' );
		$parent = dirname( $this->boost_cache_dir );
		chmod( $parent, 0555 );

		try {
			$result = Filesystem_Utils::delete_directory( $this->boost_cache_dir );

			$this->assertInstanceOf( Boost_Cache_Error::class, $result );
			$this->assertEquals( 'could-not-delete-directory', $result->get_error_code() );
			// The contents were removed but the root itself could not be.
			$this->assertTrue( is_dir( $this->boost_cache_dir ) );
			$this->assertFalse( file_exists( $this->boost_cache_dir . '/cached.html' ) );
		} finally {
			chmod( $parent, 0755 );
		}
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
