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

			if ( ! function_exists( 'WP_Filesystem' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}

			$this->assertTrue( WP_Filesystem() );
			$this->assertInstanceOf( \WP_Filesystem_Base::class, $wp_filesystem );
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
		$cache       = new Transient_Store( 1 );
		$key         = 'test-upload-success';
		$contents    = 'hello videopress';

		try {
			$this->assertNotFalse( $input_file );
			$this->assertNotFalse( $output_file );

			if ( ! function_exists( 'WP_Filesystem' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}

			$this->assertTrue( WP_Filesystem() );
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
}
