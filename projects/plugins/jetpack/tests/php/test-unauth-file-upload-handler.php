<?php
/**
 * Tests for the Unauth_File_Upload_Handler class.
 *
 * @package automattic/jetpack
 * @group unauthorized-file-upload
 */

use Automattic\Jetpack\Unauth_File_Upload_Handler;

class Test_Unauth_File_Upload_Handler extends WP_UnitTestCase {

	/**
	 * The Unauth_File_Upload_Handler instance.
	 *
	 * @var Unauth_File_Upload_Handler
	 */
	private $upload_handler;

	/**
	 * Set up the test environment.
	 */
	public function setUp() {
		parent::setUp();
		$this->upload_handler = new Unauth_File_Upload_Handler();
	}

	/**
	 * Test handle_local_file_upload method with a valid file.
	 */
	public function test_handle_local_file_upload_valid_file() {
		$file    = array(
			'name'     => 'test-image.jpg',
			'type'     => 'image/jpeg',
			'tmp_name' => DIR_TESTDATA . '/images/test-image.jpg',
			'error'    => UPLOAD_ERR_OK,
			'size'     => filesize( DIR_TESTDATA . '/images/test-image.jpg' ),
		);
		$context = 'test-context';

		$result = $this->upload_handler->handle_local_file_upload( $file, $context );

		$this->assertNotWPError( $result );
		$this->assertArrayHasKey( 'url', $result );
		$this->assertArrayHasKey( 'file', $result );
		$this->assertArrayHasKey( 'type', $result );
		$this->assertArrayHasKey( 'token', $result );
	}

	/**
	 * Test handle_local_file_upload method with an invalid file type.
	 */
	public function test_handle_local_file_upload_invalid_file_type() {
		$file    = array(
			'name'     => 'test-file.txt',
			'type'     => 'text/plain',
			'tmp_name' => DIR_TESTDATA . '/uploads/test-file.txt',
			'error'    => UPLOAD_ERR_OK,
			'size'     => filesize( DIR_TESTDATA . '/uploads/test-file.txt' ),
		);
		$context = 'test-context';

		$result = $this->upload_handler->handle_local_file_upload( $file, $context );

		$this->assertWPError( $result );
		$this->assertEquals( 'invalid_file_type', $result->get_error_code() );
	}

	/**
	 * Test handle_local_file_upload method with a file exceeding size limit.
	 */
	public function test_handle_local_file_upload_file_size_limit() {
		$file    = array(
			'name'     => 'large-image.jpg',
			'type'     => 'image/jpeg',
			'tmp_name' => DIR_TESTDATA . '/images/large-image.jpg',
			'error'    => UPLOAD_ERR_OK,
			'size'     => 10 * 1024 * 1024, // 10 MB
		);
		$context = 'test-context';

		$result = $this->upload_handler->handle_local_file_upload( $file, $context );

		$this->assertWPError( $result );
		$this->assertEquals( 'file_size_limit', $result->get_error_code() );
	}

	/**
	 * Test cleanup_old_uploads method.
	 */
	public function test_cleanup_old_uploads() {
		// Create a temporary file to simulate an old upload
		$upload_dir = wp_upload_dir();
		$temp_file  = $upload_dir['basedir'] . '/jetpack-uploads/test-file.txt';
		file_put_contents( $temp_file, 'test content' );

		// Set the file modification time to 2 days ago
		touch( $temp_file, time() - 2 * DAY_IN_SECONDS );

		$this->upload_handler->cleanup_old_uploads();

		$this->assertFileDoesNotExist( $temp_file );
	}
}
