<?php
/**
 * Test file for Jetpack Block Manifest functionality.
 *
 * @package Jetpack
 */

require_once dirname( __DIR__, 2 ) . '/tools/build-block-manifest.php';

/**
 * Test case for block manifest generation.
 */
class Block_Manifest_Test extends WP_UnitTestCase {

	/**
	 * Temporary test directory path.
	 *
	 * @var string
	 */
	private $test_dir;

	/**
	 * Track files and directories we create.
	 *
	 * @var array
	 */
	private $cleanup_paths = array();

	/**
	 * Set up the test environment.
	 *
	 * @return void
	 */
	public function set_up() {
		parent::set_up();

		// Create a temporary test directory.
		$this->test_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/jetpack-block-manifest-test-' . uniqid();
		mkdir( $this->test_dir, 0777, true );
		$this->cleanup_paths[] = $this->test_dir;
	}

	/**
	 * Clean up after ourselves.
	 *
	 * @return void
	 */
	public function tear_down() {
		// Remove files first, then directories in reverse order.
		foreach ( array_reverse( $this->cleanup_paths ) as $path ) {
			if ( is_file( $path ) ) {
				unlink( $path );
			} elseif ( is_dir( $path ) ) {
				rmdir( $path );
			}
		}
		parent::tear_down();
	}

	/**
	 * Test that the script fails properly when directory doesn't exist.
	 *
	 * @return void
	 */
	public function test_nonexistent_directory() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'Input directory does not exist: /path/does/not/exist' );
		build_block_manifest( '/path/does/not/exist' );
	}

	/**
	 * Test that the script handles empty directories correctly.
	 *
	 * @return void
	 */
	public function test_empty_directory() {
		$this->expectException( Exception::class );
		$this->expectExceptionMessage( "No block.json files found in: {$this->test_dir}" );
		build_block_manifest( $this->test_dir );
	}

	/**
	 * Test invalid JSON handling.
	 *
	 * @return void
	 */
	public function test_invalid_json() {
		// Create test directory and file.
		$block_dir = $this->test_dir . '/invalid-block';
		mkdir( $block_dir );
		$this->cleanup_paths[] = $block_dir;

		$json_file = $block_dir . '/block.json';
		file_put_contents( $json_file, '{invalid json}' );
		$this->cleanup_paths[] = $json_file;

		$this->expectException( Exception::class );
		$this->expectExceptionMessage( 'No valid block.json files were processed' );
		build_block_manifest( $this->test_dir );
	}

	/**
	 * Test successful manifest generation.
	 *
	 * @return void
	 */
	public function test_successful_manifest_generation() {
		// Create test directories and files.
		$block1_dir = $this->test_dir . '/block1';
		mkdir( $block1_dir );
		$this->cleanup_paths[] = $block1_dir;

		$block1_json = $block1_dir . '/block.json';
		file_put_contents(
			$block1_json,
			wp_json_encode(
				array(
					'name'  => 'test/block1',
					'title' => 'Test Block 1',
				)
			)
		);
		$this->cleanup_paths[] = $block1_json;

		$block2_dir = $this->test_dir . '/block2';
		mkdir( $block2_dir );
		$this->cleanup_paths[] = $block2_dir;

		$block2_json = $block2_dir . '/block.json';
		file_put_contents(
			$block2_json,
			wp_json_encode(
				array(
					'name'  => 'test/block2',
					'title' => 'Test Block 2',
				)
			)
		);
		$this->cleanup_paths[] = $block2_json;

		// Generate manifest.
		$result = build_block_manifest( $this->test_dir );
		$this->assertTrue( $result );

		// Track manifest file for cleanup.
		$manifest_path         = $this->test_dir . '/blocks-manifest.php';
		$this->cleanup_paths[] = $manifest_path;

		// Verify the manifest was created and contains expected data.
		$this->assertFileExists( $manifest_path );

		// Include and check manifest content.
		$manifest = include $manifest_path;
		$this->assertIsArray( $manifest );
		$this->assertArrayHasKey( 'block1', $manifest );
		$this->assertArrayHasKey( 'block2', $manifest );
		$this->assertEquals( 'Test Block 1', $manifest['block1']['title'] );
		$this->assertEquals( 'Test Block 2', $manifest['block2']['title'] );
	}
}
