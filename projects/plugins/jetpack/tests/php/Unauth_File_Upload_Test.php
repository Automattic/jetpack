<?php
/**
 * Test the Unauthenticated File Upload functions.
 *
 * @package Automattic/jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Testing class for Unauthenticated File Upload functions.
 */
class Unauth_File_Upload_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up before tests.
	 */
	public function set_up() {
		parent::set_up();
		require_once JETPACK__PLUGIN_DIR . 'unauth-file-upload.php';
	}

	/**
	 * Test the is_file_type_previable function with various MIME types.
	 *
	 * @dataProvider provider_is_file_type_previable
	 */
	#[DataProvider( 'provider_is_file_type_previable' )]
	public function is_file_type_previewable( $mime_type, $expected ) {
		$this->assertEquals( $expected, \Automattic\Jetpack\UnauthFileUpload\is_file_type_previewable( $mime_type ) );
	}

	/**
	 * Data provider for test_is_file_type_previable.
	 *
	 * @return array Test cases with MIME types and expected results.
	 */
	public static function provider_is_file_type_previable() {
		return array(
			// Previable image types
			array( 'image/jpeg', true ),
			array( 'image/png', true ),
			array( 'image/gif', true ),
			array( 'image/webp', true ),

			// Previable document type
			array( 'application/pdf', true ),

			// Non-previable image types
			array( 'image/svg+xml', false ),
			array( 'image/bmp', false ),
			array( 'image/tiff', false ),

			// Non-previable document types
			array( 'application/msword', false ),
			array( 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', false ),
			array( 'application/vnd.ms-excel', false ),
			array( 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', false ),

			// Other common non-previable types
			array( 'application/zip', false ),
			array( 'application/x-zip-compressed', false ),
			array( 'text/plain', false ),
			array( 'text/html', false ),
			array( 'application/json', false ),
			array( 'video/mp4', false ),
			array( 'audio/mpeg', false ),

			// Edge cases
			array( '', false ),
			array( 'application/octet-stream', false ),
			array( 'invalid/type', false ),
		);
	}
}
