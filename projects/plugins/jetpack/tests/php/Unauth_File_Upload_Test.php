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

	/**
	 * The token is deterministic for the same file ID and expiry.
	 */
	public function test_generate_download_token_is_deterministic() {
		$expires = time() + DAY_IN_SECONDS;
		$this->assertSame(
			\Automattic\Jetpack\UnauthFileUpload\generate_download_token( 123, $expires ),
			\Automattic\Jetpack\UnauthFileUpload\generate_download_token( 123, $expires )
		);
	}

	/**
	 * The token changes when the file ID changes.
	 */
	public function test_generate_download_token_varies_by_file_id() {
		$expires = time() + DAY_IN_SECONDS;
		$this->assertNotSame(
			\Automattic\Jetpack\UnauthFileUpload\generate_download_token( 123, $expires ),
			\Automattic\Jetpack\UnauthFileUpload\generate_download_token( 124, $expires )
		);
	}

	/**
	 * The token changes when the expiry changes.
	 */
	public function test_generate_download_token_varies_by_expiry() {
		$this->assertNotSame(
			\Automattic\Jetpack\UnauthFileUpload\generate_download_token( 123, 1000 ),
			\Automattic\Jetpack\UnauthFileUpload\generate_download_token( 123, 2000 )
		);
	}

	/**
	 * A matching token verifies; tampered or mismatched inputs do not.
	 */
	public function test_verify_download_token() {
		$file_id = 123;
		$expires = time() + DAY_IN_SECONDS;
		$token   = \Automattic\Jetpack\UnauthFileUpload\generate_download_token( $file_id, $expires );

		$this->assertTrue( \Automattic\Jetpack\UnauthFileUpload\verify_download_token( $file_id, $expires, $token ) );

		// Tampered token.
		$this->assertFalse( \Automattic\Jetpack\UnauthFileUpload\verify_download_token( $file_id, $expires, $token . '0' ) );
		// Wrong file ID.
		$this->assertFalse( \Automattic\Jetpack\UnauthFileUpload\verify_download_token( 999, $expires, $token ) );
		// Wrong expiry (e.g. tampered to extend the lifetime).
		$this->assertFalse( \Automattic\Jetpack\UnauthFileUpload\verify_download_token( $file_id, $expires + 1, $token ) );
		// Empty token.
		$this->assertFalse( \Automattic\Jetpack\UnauthFileUpload\verify_download_token( $file_id, $expires, '' ) );
	}

	/**
	 * The generated download URL carries a signed, ~7-day token that verifies.
	 */
	public function test_filter_get_download_url_round_trip() {
		$file_id = 456;
		$before  = time();
		$url     = \Automattic\Jetpack\UnauthFileUpload\filter_get_download_url( '', $file_id );

		$query = wp_parse_url( $url, PHP_URL_QUERY );
		parse_str( (string) $query, $args );

		$this->assertSame( 'jetpack_unauth_file_download', $args['action'] );
		$this->assertSame( (string) $file_id, (string) $args['file_id'] );

		// Expiry is roughly 7 days out.
		$this->assertGreaterThanOrEqual( $before + 7 * DAY_IN_SECONDS, (int) $args['expires'] );
		$this->assertLessThanOrEqual( time() + 7 * DAY_IN_SECONDS, (int) $args['expires'] );

		// The token in the URL validates for the file ID and expiry it was issued with.
		$this->assertTrue(
			\Automattic\Jetpack\UnauthFileUpload\verify_download_token( $file_id, (int) $args['expires'], $args['token'] )
		);
	}
}
