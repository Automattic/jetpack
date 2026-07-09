<?php
/**
 * Tests for VideoPressUploader\Tus_File.
 *
 * @package automattic/jetpack-videopress
 */
// phpcs:ignoreFile WordPress.Files.FileName.NotHyphenatedLowercase, WordPress.Files.FileName.InvalidClassFileName -- PHPUnit test files use class-matching names.

namespace VideoPressUploader;

use WorDBless\BaseTestCase;

require_once __DIR__ . '/class-out-of-range-exception.php';

/**
 * Tus_File test suite.
 */
class Tus_File_Test extends BaseTestCase {

	/**
	 * Initialize the WordPress filesystem before each test.
	 */
	protected function set_up() {
		global $wp_filesystem;

		if ( ! function_exists( 'WP_Filesystem' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$this->assertTrue( WP_Filesystem() );
		$this->assertInstanceOf( \WP_Filesystem_Base::class, $wp_filesystem );
	}

	/**
	 * Tests that corrupt uploads throw the global third-party exception.
	 */
	public function test_upload_throws_global_out_of_range_exception_when_upload_exceeds_total_bytes() {
		global $wp_filesystem;

		$input_file  = tempnam( sys_get_temp_dir(), 'videopress-tus-input-' );
		$output_file = tempnam( sys_get_temp_dir(), 'videopress-tus-output-' );
		$cache       = new Transient_Store( 1 );
		$key         = 'test-upload';

		try {
			$this->assertNotFalse( $input_file );
			$this->assertNotFalse( $output_file );

			$this->assertTrue( $wp_filesystem->put_contents( $input_file, 'test' ) );
			set_transient( $cache->build_key( $key ), wp_json_encode( array(), JSON_UNESCAPED_SLASHES ) );

			$file = new Tus_File( $key, $cache );
			$file->set_key( $key );
			$file->set_meta( 0, 4, $output_file );
			Tus_File::set_input_stream( $input_file );

			$file->upload( 3 );
			$this->fail( 'Expected an Out_Of_Range_Exception to be thrown.' );
		} catch ( \Out_Of_Range_Exception $exception ) {
			$this->assertSame( 'The uploaded file is corrupt.', $exception->getMessage() );
		} finally {
			Tus_File::set_input_stream( Tus_File::INPUT_STREAM );
			delete_transient( $cache->build_key( $key ) );

			if ( is_string( $input_file ) && file_exists( $input_file ) ) {
				wp_delete_file( $input_file );
			}

			if ( is_string( $output_file ) && file_exists( $output_file ) ) {
				wp_delete_file( $output_file );
			}
		}
	}

	/**
	 * Tests that a successful upload writes the full body and persists the final offset once.
	 */
	public function test_upload_writes_body_and_persists_final_offset() {
		global $wp_filesystem;

		$input_file  = tempnam( sys_get_temp_dir(), 'videopress-tus-input-' );
		$output_file = tempnam( sys_get_temp_dir(), 'videopress-tus-output-' );
		$key         = 'test-upload-success';
		$contents    = 'hello videopress';

		// A cache that counts set() calls, to assert the offset is persisted only once per upload.
		$cache = new class( 1 ) extends Transient_Store {
			/**
			 * Number of times set() was called.
			 *
			 * @var int
			 */
			public $set_calls = 0;

			/**
			 * Count and delegate.
			 *
			 * @param string      $key   The key.
			 * @param array|mixed $value The value.
			 *
			 * @return bool
			 */
			public function set( $key, $value ) {
				++$this->set_calls;
				return parent::set( $key, $value );
			}
		};

		try {
			$this->assertNotFalse( $input_file );
			$this->assertNotFalse( $output_file );

			$this->assertTrue( $wp_filesystem->put_contents( $input_file, $contents ) );
			set_transient( $cache->build_key( $key ), wp_json_encode( array(), JSON_UNESCAPED_SLASHES ) );

			$file = new Tus_File( $key, $cache );
			$file->set_key( $key );
			$file->set_meta( 0, strlen( $contents ), $output_file );
			Tus_File::set_input_stream( $input_file );

			$offset = $file->upload( strlen( $contents ) );

			$this->assertSame( strlen( $contents ), $offset );
			$this->assertSame( $contents, $wp_filesystem->get_contents( $output_file ) );

			$cached = $cache->get( $key );
			$this->assertIsArray( $cached );
			$this->assertSame( strlen( $contents ), $cached['offset'] );
			$this->assertSame( 1, $cache->set_calls, 'The offset should be persisted exactly once per upload.' );
		} finally {
			Tus_File::set_input_stream( Tus_File::INPUT_STREAM );
			$cache->delete( $key );

			if ( is_string( $input_file ) && file_exists( $input_file ) ) {
				wp_delete_file( $input_file );
			}

			if ( is_string( $output_file ) && file_exists( $output_file ) ) {
				wp_delete_file( $output_file );
			}
		}
	}

	/**
	 * Tests that folding chunks in as they arrive yields the same digest as hashing the whole file.
	 */
	public function test_incremental_md5_matches_whole_file_digest() {
		global $wp_filesystem;

		if ( PHP_VERSION_ID < 80100 ) {
			$this->markTestSkipped( 'Serializing a HashContext between requests requires PHP 8.1+.' );
		}

		$chunks   = array( 'hello ', 'brave ', 'new ', 'world!' );
		$contents = implode( '', $chunks );

		$output_file = tempnam( sys_get_temp_dir(), 'videopress-tus-output-' );
		$cache       = new Transient_Store( 1 );
		$key         = 'test-incremental-md5';

		try {
			$this->seed_rolling_md5( $cache, $key );

			$offset = 0;
			foreach ( $chunks as $i => $chunk ) {
				$offset = $this->upload_chunk( $cache, $key, $output_file, $chunk, $offset, strlen( $contents ) );

				$cached = $cache->get( $key );
				$this->assertIsArray( $cached );
				if ( $offset < strlen( $contents ) ) {
					$this->assertArrayHasKey( 'md5_state', $cached, "Chunk $i should carry rolling state forward." );
					$this->assertArrayNotHasKey( 'md5', $cached, "Chunk $i should not emit a digest yet." );
				}
			}

			$this->assertSame( $contents, $wp_filesystem->get_contents( $output_file ) );

			$cached = $cache->get( $key );
			$this->assertIsArray( $cached );
			$this->assertSame( md5( $contents ), $cached['md5'], 'The incremental digest should match the whole-file md5.' );
			$this->assertFalse( isset( $cached['md5_state'] ), 'Rolling state should be cleared once the digest is final.' );
		} finally {
			Tus_File::set_input_stream( Tus_File::INPUT_STREAM );
			$cache->delete( $key );
			$this->cleanup_file( $output_file );
		}
	}

	/**
	 * Tests that a single chunk larger than the read buffer is hashed across multiple read iterations.
	 */
	public function test_incremental_md5_handles_chunk_larger_than_read_buffer() {
		global $wp_filesystem;

		if ( PHP_VERSION_ID < 80100 ) {
			$this->markTestSkipped( 'Serializing a HashContext between requests requires PHP 8.1+.' );
		}

		// Several times CHUNK_SIZE (8192) so upload()'s read loop runs many iterations in one request.
		$contents = str_repeat( 'abcdefgh', 4096 );

		$output_file = tempnam( sys_get_temp_dir(), 'videopress-tus-output-' );
		$cache       = new Transient_Store( 1 );
		$key         = 'test-large-chunk-md5';

		try {
			$this->seed_rolling_md5( $cache, $key );

			$this->upload_chunk( $cache, $key, $output_file, $contents, 0, strlen( $contents ) );

			$this->assertSame( $contents, $wp_filesystem->get_contents( $output_file ) );

			$cached = $cache->get( $key );
			$this->assertIsArray( $cached );
			$this->assertSame( md5( $contents ), $cached['md5'] );
		} finally {
			Tus_File::set_input_stream( Tus_File::INPUT_STREAM );
			$cache->delete( $key );
			$this->cleanup_file( $output_file );
		}
	}

	/**
	 * Tests that no digest is emitted when the upload was not seeded for incremental hashing.
	 */
	public function test_no_md5_emitted_without_seeded_state() {
		$output_file = tempnam( sys_get_temp_dir(), 'videopress-tus-output-' );
		$cache       = new Transient_Store( 1 );
		$key         = 'test-no-md5';
		$contents    = 'no hash please';

		try {
			set_transient( $cache->build_key( $key ), wp_json_encode( array( 'offset' => 0 ), JSON_UNESCAPED_SLASHES ) );

			$this->upload_chunk( $cache, $key, $output_file, $contents, 0, strlen( $contents ) );

			$cached = $cache->get( $key );
			$this->assertIsArray( $cached );
			$this->assertArrayNotHasKey( 'md5', $cached );
			$this->assertArrayNotHasKey( 'md5_state', $cached );
		} finally {
			Tus_File::set_input_stream( Tus_File::INPUT_STREAM );
			$cache->delete( $key );
			$this->cleanup_file( $output_file );
		}
	}

	/**
	 * Tests that an unusable rolling state is ignored and no digest is emitted.
	 */
	public function test_md5_falls_back_on_unusable_state() {
		global $wp_filesystem;

		$output_file = tempnam( sys_get_temp_dir(), 'videopress-tus-output-' );
		$cache       = new Transient_Store( 1 );
		$key         = 'test-md5-unusable';
		$contents    = 'whole thing in one go';

		try {
			// Well-formed payload that is not a HashContext, to exercise the guard without warnings.
			$state = base64_encode( serialize( 'broken' ) );
			set_transient( $cache->build_key( $key ), wp_json_encode( array( 'offset' => 0, 'md5_state' => $state ), JSON_UNESCAPED_SLASHES ) );

			$offset = $this->upload_chunk( $cache, $key, $output_file, $contents, 0, strlen( $contents ) );

			$this->assertSame( strlen( $contents ), $offset );
			$this->assertSame( $contents, $wp_filesystem->get_contents( $output_file ) );

			$cached = $cache->get( $key );
			$this->assertIsArray( $cached );
			$this->assertArrayNotHasKey( 'md5', $cached, 'Unusable rolling state must not yield a digest.' );
		} finally {
			Tus_File::set_input_stream( Tus_File::INPUT_STREAM );
			$cache->delete( $key );
			$this->cleanup_file( $output_file );
		}
	}

	/**
	 * Seed a fresh rolling MD5 state on the cache, as the server does when a normal upload is created.
	 *
	 * @param Tus_Abstract_Cache $cache The cache shared across the upload.
	 * @param string             $key   The upload key.
	 *
	 * @return void
	 */
	private function seed_rolling_md5( $cache, $key ) {
		$state = base64_encode( serialize( hash_init( 'md5' ) ) );
		set_transient( $cache->build_key( $key ), wp_json_encode( array( 'offset' => 0, 'md5_state' => $state ), JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * Upload a single chunk through a fresh Tus_File, as the server does per PATCH request.
	 *
	 * @param Tus_Abstract_Cache $cache       The cache shared across the upload.
	 * @param string             $key         The upload key.
	 * @param string             $output_file The destination file (appended across chunks).
	 * @param string             $chunk       The bytes for this request.
	 * @param int                $offset      The current write offset.
	 * @param int                $total       The total upload size.
	 *
	 * @return int The new offset after the chunk.
	 */
	private function upload_chunk( $cache, $key, $output_file, $chunk, $offset, $total ) {
		global $wp_filesystem;

		$input_file = tempnam( sys_get_temp_dir(), 'videopress-tus-input-' );

		try {
			$this->assertTrue( $wp_filesystem->put_contents( $input_file, $chunk ) );
			Tus_File::set_input_stream( $input_file );

			$file = new Tus_File( $key, $cache );
			$file->set_key( $key );
			$file->set_meta( $offset, $total, $output_file );

			return $file->upload( $total );
		} finally {
			$this->cleanup_file( $input_file );
		}
	}

	/**
	 * Delete a temp file if it exists.
	 *
	 * @param string|false $path The file path.
	 *
	 * @return void
	 */
	private function cleanup_file( $path ) {
		if ( is_string( $path ) && file_exists( $path ) ) {
			wp_delete_file( $path );
		}
	}
}
