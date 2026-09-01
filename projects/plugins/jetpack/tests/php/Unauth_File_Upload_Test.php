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
		// Download links are signed with the Jetpack blog token; provide a deterministic one.
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		\Jetpack_Options::delete_option( 'blog_token' );
		$_GET = array();
		parent::tear_down();
	}

	/**
	 * Test the is_file_type_previable function with various MIME types.
	 *
	 * @dataProvider provider_is_file_type_previable
	 */
	#[DataProvider( 'provider_is_file_type_previable' )]
	public function test_is_file_type_previewable( $mime_type, $expected ) {
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
		// Token signed under a different scheme version does not verify under the current one.
		$other = \Automattic\Jetpack\UnauthFileUpload\generate_download_token( $file_id, $expires, 'v0' );
		$this->assertFalse( \Automattic\Jetpack\UnauthFileUpload\verify_download_token( $file_id, $expires, $other ) );
	}

	/**
	 * The token changes when the scheme version changes.
	 */
	public function test_generate_download_token_varies_by_version() {
		$expires = time() + DAY_IN_SECONDS;
		$this->assertNotSame(
			\Automattic\Jetpack\UnauthFileUpload\generate_download_token( 123, $expires, 'v1' ),
			\Automattic\Jetpack\UnauthFileUpload\generate_download_token( 123, $expires, 'v2' )
		);
	}

	/**
	 * The generated download URL carries a signed, ~7-day token that verifies.
	 */
	public function test_filter_get_download_url_round_trip() {
		$file_id = 456;
		$before  = time();
		$url     = \Automattic\Jetpack\UnauthFileUpload\filter_get_download_url( '', $file_id );
		$after   = time();

		$query = wp_parse_url( $url, PHP_URL_QUERY );
		parse_str( (string) $query, $args );

		$this->assertSame( 'jetpack_unauth_file_download', $args['action'] );
		$this->assertSame( (string) $file_id, (string) $args['file_id'] );
		$this->assertSame( \Automattic\Jetpack\UnauthFileUpload\DOWNLOAD_TOKEN_VERSION, $args['token_version'] );

		// Expiry is one lifetime out, measured against the window the URL was built in.
		$this->assertGreaterThanOrEqual( $before + \Automattic\Jetpack\UnauthFileUpload\DOWNLOAD_LINK_LIFETIME, (int) $args['expires'] );
		$this->assertLessThanOrEqual( $after + \Automattic\Jetpack\UnauthFileUpload\DOWNLOAD_LINK_LIFETIME, (int) $args['expires'] );

		// The token in the URL validates for the file ID, expiry, and version it was issued with.
		$this->assertTrue(
			\Automattic\Jetpack\UnauthFileUpload\verify_download_token( $file_id, (int) $args['expires'], $args['token'], $args['token_version'] )
		);
	}

	/**
	 * The signing key can be overridden via filter (e.g. for environments without a blog token).
	 */
	public function test_signing_key_filter_overrides_default() {
		$expires      = time() + DAY_IN_SECONDS;
		$with_default = \Automattic\Jetpack\UnauthFileUpload\generate_download_token( 123, $expires );

		$callback = static function () {
			return 'a-completely-different-secret';
		};

		add_filter( 'jetpack_unauth_file_download_signing_key', $callback );
		try {
			$with_filter = \Automattic\Jetpack\UnauthFileUpload\generate_download_token( 123, $expires );

			$this->assertNotSame( $with_default, $with_filter );
			// A token signed with the filtered key verifies while the filter is active.
			$this->assertTrue( \Automattic\Jetpack\UnauthFileUpload\verify_download_token( 123, $expires, $with_filter ) );
		} finally {
			remove_filter( 'jetpack_unauth_file_download_signing_key', $callback );
		}
	}

	/**
	 * With no signing key available, token generation and verification fail closed.
	 */
	public function test_empty_signing_key_fails_closed() {
		$callback = static function () {
			return '';
		};

		add_filter( 'jetpack_unauth_file_download_signing_key', $callback );
		try {
			$expires = time() + DAY_IN_SECONDS;
			$this->assertSame( '', \Automattic\Jetpack\UnauthFileUpload\generate_download_token( 123, $expires ) );
			$this->assertFalse( \Automattic\Jetpack\UnauthFileUpload\verify_download_token( 123, $expires, 'anything' ) );
		} finally {
			remove_filter( 'jetpack_unauth_file_download_signing_key', $callback );
		}
	}

	/**
	 * The filter_get_download_url() callback returns the passthrough URL when there is no signing key.
	 */
	public function test_filter_get_download_url_passthrough_without_key() {
		$callback = static function () {
			return '';
		};

		add_filter( 'jetpack_unauth_file_download_signing_key', $callback );
		try {
			// Passthrough is the URL handed in (callers omit an empty link) rather than a dead link.
			$this->assertSame( '', \Automattic\Jetpack\UnauthFileUpload\filter_get_download_url( '', 123 ) );
			$this->assertSame( 'fallback', \Automattic\Jetpack\UnauthFileUpload\filter_get_download_url( 'fallback', 123 ) );
		} finally {
			remove_filter( 'jetpack_unauth_file_download_signing_key', $callback );
		}
	}

	/**
	 * Run authorize_file_download() and return the wp_die() message it triggers.
	 *
	 * @param int $file_id File ID to authorize.
	 * @return string The wp_die() message.
	 */
	private function authorize_and_catch_die( $file_id ) {
		try {
			\Automattic\Jetpack\UnauthFileUpload\authorize_file_download();
		} catch ( \WPDieException $e ) {
			return $e->getMessage();
		}
		$this->fail( 'Expected authorize_file_download() to call wp_die() for file ' . $file_id . ', but it returned.' );
	}

	/**
	 * Build a valid signed-token $_GET for a file and set the current user to an editor.
	 *
	 * @param int $file_id File ID.
	 * @return array The populated $_GET superglobal contents.
	 */
	private function signed_get_for( $file_id ) {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$expires = time() + DAY_IN_SECONDS;

		return array(
			'action'        => 'jetpack_unauth_file_download',
			'file_id'       => (string) $file_id,
			'expires'       => (string) $expires,
			'token_version' => \Automattic\Jetpack\UnauthFileUpload\DOWNLOAD_TOKEN_VERSION,
			'token'         => \Automattic\Jetpack\UnauthFileUpload\generate_download_token( $file_id, $expires ),
		);
	}

	/**
	 * A valid signed token authorizes the download and returns the file ID.
	 */
	public function test_authorize_accepts_valid_signed_token() {
		$_GET = $this->signed_get_for( 42 );
		$this->assertSame( 42, \Automattic\Jetpack\UnauthFileUpload\authorize_file_download() );
	}

	/**
	 * A request without the edit_pages capability is rejected.
	 */
	public function test_authorize_requires_capability() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );
		$_GET = array( 'file_id' => '42' );

		$this->assertStringContainsString( 'not allowed', $this->authorize_and_catch_die( 42 ) );
	}

	/**
	 * A missing file ID is rejected.
	 */
	public function test_authorize_requires_file_id() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$_GET = array();

		$this->assertStringContainsString( 'Invalid file request', $this->authorize_and_catch_die( 0 ) );
	}

	/**
	 * A token with the wrong version is rejected with code 1.
	 */
	public function test_authorize_rejects_wrong_token_version() {
		$_GET                  = $this->signed_get_for( 42 );
		$_GET['token_version'] = 'v0';

		$this->assertStringContainsString( '(1)', $this->authorize_and_catch_die( 42 ) );
	}

	/**
	 * An expired token is rejected with the expiry message.
	 */
	public function test_authorize_rejects_expired_token() {
		$file_id = 42;
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$expires = time() - 1;
		$_GET    = array(
			'file_id'       => (string) $file_id,
			'expires'       => (string) $expires,
			'token_version' => \Automattic\Jetpack\UnauthFileUpload\DOWNLOAD_TOKEN_VERSION,
			'token'         => \Automattic\Jetpack\UnauthFileUpload\generate_download_token( $file_id, $expires ),
		);

		$this->assertStringContainsString( 'expired', $this->authorize_and_catch_die( $file_id ) );
	}

	/**
	 * A tampered token is rejected with code 2.
	 */
	public function test_authorize_rejects_tampered_token() {
		$_GET           = $this->signed_get_for( 42 );
		$_GET['token'] .= '0';

		$this->assertStringContainsString( '(2)', $this->authorize_and_catch_die( 42 ) );
	}

	/**
	 * A legacy link with a valid nonce is accepted.
	 */
	public function test_authorize_accepts_valid_legacy_nonce() {
		$file_id = 42;
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		$_GET = array(
			'file_id'  => (string) $file_id,
			'_wpnonce' => wp_create_nonce( 'jetpack_unauth_file_download_nonce_' . $file_id ),
		);

		$this->assertSame( $file_id, \Automattic\Jetpack\UnauthFileUpload\authorize_file_download() );
	}

	/**
	 * A legacy link with a bad nonce is rejected with code 3.
	 */
	public function test_authorize_rejects_bad_legacy_nonce() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$_GET = array(
			'file_id'  => '42',
			'_wpnonce' => 'not-a-real-nonce',
		);

		$this->assertStringContainsString( '(3)', $this->authorize_and_catch_die( 42 ) );
	}

	/**
	 * A request with neither a token nor a nonce is rejected with code 4.
	 */
	public function test_authorize_rejects_missing_credentials() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$_GET = array( 'file_id' => '42' );

		$this->assertStringContainsString( '(4)', $this->authorize_and_catch_die( 42 ) );
	}

	/**
	 * The expiry gate accepts a future timestamp and rejects a past one.
	 *
	 * The production check is `$expires < time()`, so a link is valid while its expiry is in the
	 * future and becomes invalid once time passes it. The exact-equality second (`expires ==
	 * time()`) is intentionally not asserted here, as it cannot be pinned without a flaky
	 * dependency on the clock not ticking mid-test.
	 */
	public function test_authorize_expiry_boundary() {
		$file_id = 42;
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );

		// One minute in the future: valid (returns the file ID) regardless of a one-second tick.
		$future = time() + MINUTE_IN_SECONDS;
		$_GET   = array(
			'file_id'       => (string) $file_id,
			'expires'       => (string) $future,
			'token_version' => \Automattic\Jetpack\UnauthFileUpload\DOWNLOAD_TOKEN_VERSION,
			'token'         => \Automattic\Jetpack\UnauthFileUpload\generate_download_token( $file_id, $future ),
		);
		$this->assertSame( $file_id, \Automattic\Jetpack\UnauthFileUpload\authorize_file_download() );

		// One minute in the past: expired.
		$past = time() - MINUTE_IN_SECONDS;
		$_GET = array(
			'file_id'       => (string) $file_id,
			'expires'       => (string) $past,
			'token_version' => \Automattic\Jetpack\UnauthFileUpload\DOWNLOAD_TOKEN_VERSION,
			'token'         => \Automattic\Jetpack\UnauthFileUpload\generate_download_token( $file_id, $past ),
		);
		$this->assertStringContainsString( 'expired', $this->authorize_and_catch_die( $file_id ) );
	}
}
