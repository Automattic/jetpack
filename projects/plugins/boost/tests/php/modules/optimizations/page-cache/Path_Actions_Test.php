<?php

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Page_Cache;

use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Filter_Older;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Path_Action;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Rebuild_File;
use Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress\Path_Actions\Simple_Delete;

class Path_Actions_Test extends \PHPUnit\Framework\TestCase {
	private $test_dir;

	public function setUp(): void {
		parent::setUp();
		$this->setup_test_dir();
	}

	public function tearDown(): void {
		parent::tearDown();
		@rmdir( $this->test_dir ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	}

	private function create_file( $path ) {
		file_put_contents( $this->test_dir . '/' . $path, 'test' );
	}

	private function file_exists( $path ) {
		return file_exists( $this->test_dir . '/' . $path );
	}

	private function setup_test_dir() {
		$this->test_dir = sys_get_temp_dir() . '/boost-test-' . uniqid();
		mkdir( $this->test_dir, 0755, true );
	}

	public function test_simple_delete() {
		$this->create_file( 'test.txt' );
		$this->create_file( 'index.html' );

		$action = new Simple_Delete();
		$action->apply_to_path( new \SplFileInfo( $this->test_dir . '/test.txt' ) );
		$this->assertFalse( $this->file_exists( 'test.txt' ) );

		$action->apply_to_path( new \SplFileInfo( $this->test_dir . '/index.html' ) );
		$this->assertTrue( $this->file_exists( 'index.html' ) );

		$action->apply_to_path( new \SplFileInfo( $this->test_dir ) );
		$this->assertFalse( $this->file_exists( 'index.html' ) );
		$this->assertFalse( $this->file_exists( $this->test_dir ) );
	}

	public function test_rebuild_file() {
		$this->create_file( 'test.txt' );

		$action = new Rebuild_File();

		// Applying rebuild to a file should copy the file to a new file with the .rebuild.html extension.
		$action->apply_to_path( new \SplFileInfo( $this->test_dir . '/test.txt' ) );
		$this->assertTrue( $this->file_exists( 'test.txt.rebuild.html' ) );

		// Applying rebuild to a rebuild file should delete the rebuild file.
		$action->apply_to_path( new \SplFileInfo( $this->test_dir . '/test.txt.rebuild.html' ) );
		$this->assertFalse( $this->file_exists( 'test.txt.rebuild.html' ) );

		$this->create_file( 'test.txt' );
		$this->create_file( 'index.html' );

		$this->assertTrue( $this->file_exists( 'index.html' ) );
		// Applying the action on index.html should do nothing.
		$action->apply_to_path( new \SplFileInfo( $this->test_dir . '/index.html' ) );
		$this->assertTrue( $this->file_exists( 'index.html' ) );

		// Applying the action on an empty directory(with index.html) should delete the index.html file and directory.
		@unlink( $this->test_dir . '/test.txt' ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		$action->apply_to_path( new \SplFileInfo( $this->test_dir ) );
		$this->assertFalse( $this->file_exists( 'index.html' ) );
		$this->assertFalse( $this->file_exists( '' ) );
	}

	public function test_filter_older() {
		// Create a custom action that logs all calls to apply_to_path
		$logged_paths  = array();
		$custom_action = new class( $logged_paths ) implements Path_Action {
			private $logged_paths;

			public function __construct( &$logged_paths ) {
				$this->logged_paths = &$logged_paths;
			}

			public function apply_to_path( \SplFileInfo $file ) {
				$this->logged_paths[] = $file->getPathname();
				return 0;
			}
		};

		$this->create_file( 'test.txt' );
		$this->create_file( 'test2.txt' );

		// Set the timestamps for the files
		$old_time = time() - 1500;
		$new_time = time() - 500;
		touch( $this->test_dir . '/test.txt', $old_time );
		touch( $this->test_dir . '/test2.txt', $new_time );

		$filter_older = new Filter_Older( time() - 1000, $custom_action );

		// Create a directory and verify it's processed regardless of age
		mkdir( $this->test_dir . '/test_dir' );

		// Apply the filter to all files and the directory
		$filter_older->apply_to_path( new \SplFileInfo( $this->test_dir . '/test.txt' ) );
		$filter_older->apply_to_path( new \SplFileInfo( $this->test_dir . '/test2.txt' ) );
		$filter_older->apply_to_path( new \SplFileInfo( $this->test_dir . '/test_dir' ) );

		// Verify that both the old file and the directory were processed
		$this->assertCount( 2, $logged_paths, 'Expected exactly 2 paths to be processed' );
		$this->assertContains( $this->test_dir . '/test.txt', $logged_paths, 'Old file should be processed' );
		$this->assertContains( $this->test_dir . '/test_dir', $logged_paths, 'Directory should be processed' );
		$this->assertNotContains( $this->test_dir . '/test2.txt', $logged_paths, 'New file should not be processed' );
	}
}
