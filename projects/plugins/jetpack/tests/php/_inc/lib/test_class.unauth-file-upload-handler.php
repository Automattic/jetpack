<?php

namespace Automattic\Jetpack;

use WorDBless\BaseTestCase;

/**
 * Unit tests for Unauth_File_Upload_Handler class
 *
 * @package automattic/jetpack
 */
class Test_Unauth_File_Upload_Handler extends BaseTestCase {
	/**
	 * Handler instance.
	 *
	 * @var Unauth_File_Upload_Handler
	 */
	private $handler;

	/**
	 * Temporary test upload directory
	 *
	 * @var string
	 */
	private $test_upload_dir;

	/**
	 * Set up before each test
	 */
	public function set_up() {
		parent::set_up();
		if ( ! class_exists( 'Unauth_File_Upload_Handler' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-unauth-file-upload-handler.php';
		}

		$this->handler = new Unauth_File_Upload_Handler();

		// Create a temporary upload directory for testing
		$this->test_upload_dir = get_temp_dir() . 'jetpack-test-uploads-' . rand();
		mkdir( $this->test_upload_dir, 0777, true );

		// Mock wp_upload_dir() return value with both temp and WP paths
		add_filter(
			'upload_dir',
			function ( $uploads ) {
				return array(
					'path'    => $this->test_upload_dir,
					'basedir' => $this->test_upload_dir,
					'url'     => 'http://example.org/wp-content/uploads',
					'baseurl' => 'http://example.org/wp-content/uploads',
					'subdir'  => '',
					'error'   => false,
				);
			}
		);

		// Clean up any existing uploads directory
		$wp_upload_dir = '/var/www/html/wp-content/uploads/2024';
		if ( is_dir( $wp_upload_dir ) ) {
			$files = new \RecursiveIteratorIterator(
				new \RecursiveDirectoryIterator( $wp_upload_dir, \RecursiveDirectoryIterator::SKIP_DOTS ),
				\RecursiveIteratorIterator::CHILD_FIRST
			);
			foreach ( $files as $file ) {
				if ( $file->isDir() ) {
					rmdir( $file->getRealPath() );
				} else {
					unlink( $file->getRealPath() );
				}
			}
			rmdir( $wp_upload_dir );
		}

		// Add default mime types
		add_filter(
			'jetpack_unauth_upload_mime_types',
			function ( $types ) {
				return array(
					'image/jpeg' => 'jpg|jpeg|jpe',
					'image/png'  => 'png',
					'image/gif'  => 'gif',
				);
			},
			1
		);
	}

	/**
	 * Clean up after each test
	 */
	public function tear_down() {
		// Clean up test upload directory
		if ( is_dir( $this->test_upload_dir ) ) {
			$files = new \RecursiveIteratorIterator(
				new \RecursiveDirectoryIterator( $this->test_upload_dir, \RecursiveDirectoryIterator::SKIP_DOTS ),
				\RecursiveIteratorIterator::CHILD_FIRST
			);
			foreach ( $files as $file ) {
				if ( $file->isDir() ) {
					rmdir( $file->getRealPath() );
				} else {
					unlink( $file->getRealPath() );
				}
			}
			rmdir( $this->test_upload_dir );
		}

		// Clean up WP upload directory
		$wp_upload_dir = wp_upload_dir()['basedir'];
		if ( is_dir( $wp_upload_dir ) ) {
			$files = new \RecursiveIteratorIterator(
				new \RecursiveDirectoryIterator( $wp_upload_dir, \RecursiveDirectoryIterator::SKIP_DOTS ),
				\RecursiveIteratorIterator::CHILD_FIRST
			);
			foreach ( $files as $file ) {
				if ( $file->isDir() ) {
					rmdir( $file->getRealPath() );
				} else {
					unlink( $file->getRealPath() );
				}
			}
			rmdir( $wp_upload_dir );
		}

		remove_all_filters( 'upload_dir' );
		remove_all_filters( 'jetpack_unauth_upload_mime_types' );
		remove_all_filters( 'wp_check_filetype_and_ext' );
		remove_all_filters( 'wp_check_filetype' );
		remove_all_filters( 'move_uploaded_file' );
		parent::tear_down();
	}

	/**
	 * Test file upload with basic upload error
	 */
	public function test_handle_local_file_upload_with_upload_error() {
		$temp_file = tempnam( sys_get_temp_dir(), 'test' );
		touch( $temp_file ); // Ensure the file exists

		$file = array(
			'error'    => UPLOAD_ERR_NO_FILE,
			'name'     => 'test.jpg',
			'size'     => 1000,
			'tmp_name' => $temp_file,
			'type'     => 'image/jpeg',
		);

		$result = $this->handler->handle_local_file_upload( $file, 'test' );

		// Clean up
		if ( file_exists( $temp_file ) ) {
			unlink( $temp_file );
		}

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'upload_error', $result->get_error_code() );
		$this->assertEquals( 'No file was uploaded.', $result->get_error_message() );
	}

	/**
	 * Test file upload with invalid file type
	 */
	public function test_handle_local_file_upload_with_invalid_file_type() {
		$file = array(
			'error' => UPLOAD_ERR_OK,
			'name'  => 'test.xyz',
			'size'  => 1000,
		);

		$result = $this->handler->handle_local_file_upload( $file, 'test' );
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'invalid_file_type', $result->get_error_code() );
	}

	/**
	 * Test file upload with file size exceeding limit
	 */
	public function test_handle_local_file_upload_exceeding_size_limit() {
		// Create a temporary test file with valid JPEG header
		$temp_file   = tempnam( sys_get_temp_dir(), 'test' );
		$jpeg_header = "\xFF\xD8\xFF\xE0\x00\x10\x4A\x46\x49\x46\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00\xFF\xD9";
		file_put_contents( $temp_file, $jpeg_header );

		// Mock file type checks before creating the file array
		add_filter(
			'wp_check_filetype_and_ext',
			function ( $data, $file, $filename, $mimes ) {
				return array(
					'ext'             => 'jpg',
					'type'            => 'image/jpeg',
					'proper_filename' => $filename,
					'real_mime'       => 'image/jpeg',
				);
			},
			1,
			4
		);

		add_filter(
			'wp_check_filetype',
			function ( $check, $filename = '', $mime = '', $mimes = null ) {
				return array(
					'ext'  => 'jpg',
					'type' => 'image/jpeg',
				);
			},
			1,
			4
		);

		$file = array(
			'error'    => UPLOAD_ERR_OK,
			'name'     => 'test.jpg',
			'size'     => Unauth_File_Upload_Handler::MAX_FILE_SIZE + 1,
			'tmp_name' => $temp_file,
			'type'     => 'image/jpeg',
		);

		$result = $this->handler->handle_local_file_upload( $file, 'test' );

		// Clean up
		unlink( $temp_file );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'file_size_limit', $result->get_error_code() );
	}

	/**
	 * Test successful file upload
	 */
	public function test_successful_file_upload() {
		// Create a small valid JPEG file
		$temp_file   = tempnam( sys_get_temp_dir(), 'test' );
		$jpeg_header = "\xFF\xD8\xFF\xE0\x00\x10\x4A\x46\x49\x46\x00\x01\x01\x01\x00\x48\x00\x48\x00\x00\xFF\xD9";
		file_put_contents( $temp_file, $jpeg_header );

		// Add allowed mime types
		add_filter(
			'jetpack_unauth_upload_mime_types',
			function () {
				return array(
					'image/jpeg' => 'jpg|jpeg|jpe',
				);
			},
			20  // Higher priority
		);

		// Mock wp_check_filetype_and_ext with a more complete response
		add_filter(
			'wp_check_filetype_and_ext',
			function ( $data, $file, $filename, $mimes ) {
				return array(
					'ext'             => 'jpg',
					'type'            => 'image/jpeg',
					'proper_filename' => $filename,
					'real_mime'       => 'image/jpeg',
				);
			},
			10,
			4
		);

		// Mock wp_check_filetype
		add_filter(
			'wp_check_filetype',
			function ( $file ) {
				return array(
					'ext'  => 'jpg',
					'type' => 'image/jpeg',
				);
			},
			10,
			1
		);

		$file = array(
			'error'    => UPLOAD_ERR_OK,
			'name'     => 'test.jpg',
			'size'     => filesize( $temp_file ),
			'tmp_name' => $temp_file,
			'type'     => 'image/jpeg',
		);

		// Mock move_uploaded_file
		add_filter(
			'move_uploaded_file',
			function ( $source, $destination ) {
				return copy( $source, $destination );
			},
			10,
			2
		);

		// Let's add some debug output
		$result = $this->handler->handle_local_file_upload( $file, 'test' );
		if ( is_wp_error( $result ) ) {
			error_log( 'Test error: ' . $result->get_error_code() . ' - ' . $result->get_error_message() );
		}

		// Clean up
		unlink( $temp_file );
		remove_all_filters( 'wp_check_filetype_and_ext' );
		remove_all_filters( 'wp_check_filetype' );
		remove_all_filters( 'move_uploaded_file' );
		remove_all_filters( 'jetpack_unauth_upload_mime_types' );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'token', $result );
		$this->assertNotEmpty( $result['token'] );
	}

	/**
	 * Test file retrieval with invalid token
	 */
	public function test_get_file_by_invalid_token() {
		$result = $this->handler->get_file_by_token( 'invalid_token' );
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'invalid_token', $result->get_error_code() );
	}

	/**
	 * Test successful file retrieval
	 */
	public function test_successful_file_retrieval() {
		// Create a temporary test file
		$temp_file = tempnam( sys_get_temp_dir(), 'test' );
		file_put_contents( $temp_file, 'test content' );

		// Mock file type checks
		add_filter(
			'wp_check_filetype_and_ext',
			function ( $data, $file, $filename, $mimes ) {
				return array(
					'ext'             => 'jpg',
					'type'            => 'image/jpeg',
					'proper_filename' => $filename,
					'real_mime'       => 'image/jpeg',
				);
			},
			1,
			4
		);

		add_filter(
			'wp_check_filetype',
			function ( $check, $filename = '', $mime = '', $mimes = null ) {
				return array(
					'ext'  => 'jpg',
					'type' => 'image/jpeg',
				);
			},
			1,
			4
		);

		$file = array(
			'error'    => UPLOAD_ERR_OK,
			'name'     => 'test.jpg',
			'size'     => filesize( $temp_file ),
			'tmp_name' => $temp_file,
			'type'     => 'image/jpeg',
		);

		// Mock move_uploaded_file
		add_filter(
			'move_uploaded_file',
			function ( $source, $destination ) {
				return copy( $source, $destination );
			},
			1,
			2
		);

		$upload_result = $this->handler->handle_local_file_upload( $file, 'test' );

		// Only proceed if upload was successful
		$this->assertIsArray( $upload_result, 'Upload failed: ' . ( is_wp_error( $upload_result ) ? $upload_result->get_error_message() : '' ) );

		$token  = $upload_result['token'];
		$result = $this->handler->get_file_by_token( $token );

		unlink( $temp_file );

		$this->assertIsArray( $result );
		$this->assertEquals( 'test.jpg', $result['original_name'] );
		$this->assertEquals( 'test', $result['context'] );
		$this->assertArrayHasKey( 'created', $result );
	}

	/**
	 * Test cleanup of old uploads
	 */
	public function test_cleanup_old_uploads() {
		// Create and store an "old" upload
		$old_time = time() - ( 2 * DAY_IN_SECONDS );
		$uploads  = array(
			'test_token' => array(
				'filename'      => 'old.jpg',
				'path'          => $this->test_upload_dir,
				'created'       => $old_time,
				'original_name' => 'original.jpg',
				'context'       => 'test',
			),
		);

		update_option( Unauth_File_Upload_Handler::UNAUTH_UPLOADS_OPTION, $uploads );

		// Create a test file
		$test_file_path = $this->test_upload_dir . '/old.jpg';
		file_put_contents( $test_file_path, 'test content' );

		$this->handler->cleanup_old_uploads();

		// Verify the old file was cleaned up
		$remaining_uploads = get_option( Unauth_File_Upload_Handler::UNAUTH_UPLOADS_OPTION, array() );
		$this->assertEmpty( $remaining_uploads );
		$this->assertFalse( file_exists( $test_file_path ) );
	}

	/**
	 * Test allowed mime types filter
	 */
	public function test_allowed_mime_types_filter() {
		add_filter(
			'jetpack_unauth_upload_mime_types',
			function () {
				return array( 'image/jpeg' => 'jpg' );
			}
		);

		$file = array(
			'error' => UPLOAD_ERR_OK,
			'name'  => 'test.png',
			'size'  => 1000,
		);

		$result = $this->handler->handle_local_file_upload( $file, 'test' );
		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertEquals( 'invalid_file_type', $result->get_error_code() );
	}
}
