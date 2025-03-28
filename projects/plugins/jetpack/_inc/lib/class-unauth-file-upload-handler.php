<?php
/**
 * Unauthenticated File Upload Handler for Jetpack Forms.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Extensions\Premium_Content\JWT;
use Automattic\Jetpack\Status\Host;

/**
 * Handles temporary file uploads from unauthenticated users.
 */
class Unauth_File_Upload_Handler {
	/**
	 * Generate a JWT token for file upload authorization.
	 *
	 * @param array $claims The claims to include in the token.
	 * @return string The generated JWT token.
	 */
	public function generate_upload_token( $claims = array() ) {
		$default_claims = array(
			'exp' => time() + 3600, // 1 hour expiration
			'ip'  => isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '',
			'iat' => time(),
		);

		$claims = wp_parse_args( $claims, $default_claims );

		// Get the secret key for signing
		$secret = $this->get_upload_token_secret();

		// Generate and return the token
		return JWT::encode( $claims, $secret, 'HS256' );
	}

	/**
	 * Get the secret key for signing upload tokens.
	 *
	 * @return string|false The secret key or false if not available.
	 */
	private function get_upload_token_secret() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			// phpcs:ignore ImportDetection.Imports.RequireImports.Symbol
			// TODO: This is a temporary solution to get the secret key for the upload token.
			return defined( 'EARN_JWT_SIGNING_KEY' ) ? EARN_JWT_SIGNING_KEY : false;
		}
		$token = ( new Tokens() )->get_access_token();
		if ( ! isset( $token->secret ) ) {
			return false;
		}
		return $token->secret;
	}

	/**
	 * Verify a JWT upload token.
	 *
	 * @param string $token The JWT token to verify.
	 * @return object|false The token claims if valid, false if invalid.
	 */
	public function verify_upload_token( $token ) {
		try {
			$secret = $this->get_upload_token_secret();
			return JWT::decode( $token, $secret, array( 'HS256' ) );
		} catch ( \Exception $e ) {
			return false;
		}
	}
}
