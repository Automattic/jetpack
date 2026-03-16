<?php
/**
 * PayPal OAuth 2.0 client credentials authentication handler.
 *
 * Manages OAuth token exchange, credential storage, and token caching
 * for the PayPal Pay Links & Buttons API integration.
 *
 * @package automattic/jetpack-paypal-payments
 * @since 0.7.0
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class PayPal_OAuth
 *
 * Handles PayPal OAuth 2.0 client credentials grant flow.
 * Stores encrypted credentials in wp_options and caches
 * access tokens using WordPress transients.
 */
class PayPal_OAuth {

	/**
	 * Option key for storing encrypted PayPal client credentials.
	 *
	 * @var string
	 */
	const CREDENTIALS_OPTION_KEY = 'jetpack_paypal_payment_buttons_credentials';

	/**
	 * Transient key for caching the OAuth access token.
	 *
	 * @var string
	 */
	const TOKEN_TRANSIENT_KEY = 'jetpack_paypal_payment_buttons_token';

	/**
	 * Option key for the environment setting (sandbox or production).
	 *
	 * @var string
	 */
	const ENVIRONMENT_OPTION_KEY = 'jetpack_paypal_payment_buttons_environment';

	/**
	 * PayPal sandbox API base URL.
	 *
	 * @var string
	 */
	const SANDBOX_BASE_URL = 'https://api-m.sandbox.paypal.com';

	/**
	 * PayPal production API base URL.
	 *
	 * @var string
	 */
	const PRODUCTION_BASE_URL = 'https://api.paypal.com';

	/**
	 * OAuth token endpoint path.
	 *
	 * @var string
	 */
	const TOKEN_ENDPOINT = '/v1/oauth2/token';

	/**
	 * Buffer in seconds to subtract from token expiry for early refresh.
	 * Refreshes 5 minutes before actual expiry to prevent edge-case failures.
	 *
	 * @var int
	 */
	const TOKEN_EXPIRY_BUFFER = 300;

	/**
	 * Option key for storing the absolute token expiry timestamp.
	 *
	 * Provides a reliable expiry check independent of the transient cache,
	 * which can be evicted by object caches or plugin flushes.
	 *
	 * @var string
	 */
	const TOKEN_EXPIRES_AT_OPTION_KEY = 'jetpack_paypal_payment_buttons_token_expires_at';

	/**
	 * Get the current PayPal API environment.
	 *
	 * @return string 'sandbox' or 'production'. Defaults to 'production'.
	 */
	public static function get_environment() {
		return get_option( self::ENVIRONMENT_OPTION_KEY, 'production' );
	}

	/**
	 * Set the PayPal API environment.
	 *
	 * @param string $environment Either 'sandbox' or 'production'.
	 * @return bool True if the option was updated, false otherwise.
	 */
	public static function set_environment( $environment ) {
		$environment = sanitize_text_field( $environment );

		if ( ! in_array( $environment, array( 'sandbox', 'production' ), true ) ) {
			return false;
		}

		// Clear cached token when environment changes.
		self::clear_cached_token();

		return update_option( self::ENVIRONMENT_OPTION_KEY, $environment );
	}

	/**
	 * Get the PayPal API base URL for the current environment.
	 *
	 * @return string The base URL (no trailing slash).
	 */
	public static function get_base_url() {
		return 'production' === self::get_environment()
			? self::PRODUCTION_BASE_URL
			: self::SANDBOX_BASE_URL;
	}

	/**
	 * Derive a symmetric encryption key from AUTH_KEY.
	 *
	 * Uses sodium_crypto_generichash (BLAKE2b) to derive a fixed-length
	 * key suitable for sodium_crypto_secretbox from the WordPress AUTH_KEY
	 * constant defined in wp-config.php.
	 *
	 * @return string Raw binary key of SODIUM_CRYPTO_SECRETBOX_KEYBYTES length.
	 */
	private static function get_encryption_key() {
		return sodium_crypto_generichash( \AUTH_KEY, '', SODIUM_CRYPTO_SECRETBOX_KEYBYTES );
	}

	/**
	 * Encrypt a plaintext string using sodium_crypto_secretbox.
	 *
	 * Returns a base64-encoded string containing the nonce prepended to the ciphertext.
	 *
	 * @param string $plaintext The string to encrypt.
	 * @return string Base64-encoded nonce + ciphertext.
	 */
	private static function encrypt( $plaintext ) {
		$key   = self::get_encryption_key();
		$nonce = random_bytes( SODIUM_CRYPTO_SECRETBOX_NONCEBYTES );

		$ciphertext = sodium_crypto_secretbox( $plaintext, $nonce, $key );

		return base64_encode( $nonce . $ciphertext ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Encoding binary ciphertext for safe storage in wp_options.
	}

	/**
	 * Decrypt a string previously encrypted with self::encrypt().
	 *
	 * @param string $encoded Base64-encoded nonce + ciphertext.
	 * @return string|false The decrypted plaintext, or false on failure.
	 */
	private static function decrypt( $encoded ) {
		$decoded = base64_decode( $encoded, true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Decoding binary ciphertext from wp_options storage.

		if ( false === $decoded || strlen( $decoded ) < SODIUM_CRYPTO_SECRETBOX_NONCEBYTES + SODIUM_CRYPTO_SECRETBOX_MACBYTES ) {
			return false;
		}

		$nonce      = substr( $decoded, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES );
		$ciphertext = substr( $decoded, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES );
		$key        = self::get_encryption_key();

		try {
			$plaintext = sodium_crypto_secretbox_open( $ciphertext, $nonce, $key );
		} catch ( \SodiumException $e ) {
			return false;
		}

		return $plaintext;
	}

	/**
	 * Store PayPal client credentials.
	 *
	 * Credentials are encrypted at rest using sodium_crypto_secretbox
	 * (XSalsa20-Poly1305 authenticated encryption) with a key derived
	 * from AUTH_KEY via BLAKE2b. Each storage operation generates a
	 * fresh random nonce.
	 *
	 * @param string $client_id     The PayPal OAuth client ID.
	 * @param string $client_secret The PayPal OAuth client secret.
	 * @return bool True on success, false on failure.
	 */
	public static function store_credentials( $client_id, $client_secret ) {
		$client_id     = sanitize_text_field( $client_id );
		$client_secret = sanitize_text_field( $client_secret );

		if ( empty( $client_id ) || empty( $client_secret ) ) {
			return false;
		}

		$credentials = array(
			'encrypted_client_id'     => self::encrypt( $client_id ),
			'encrypted_client_secret' => self::encrypt( $client_secret ),
			'stored_at'               => time(),
		);

		// Clear any existing cached token since credentials changed.
		self::clear_cached_token();

		return update_option( self::CREDENTIALS_OPTION_KEY, $credentials, false );
	}

	/**
	 * Retrieve stored PayPal client credentials.
	 *
	 * Decrypts credentials from wp_options using sodium_crypto_secretbox.
	 * If decryption fails (corrupted data or AUTH_KEY changed), the stored
	 * credentials are deleted and false is returned.
	 *
	 * @return array|false Array with 'client_id' and 'client_secret' keys, or false if not set.
	 */
	public static function get_credentials() {
		$credentials = get_option( self::CREDENTIALS_OPTION_KEY, false );

		if ( ! is_array( $credentials )
			|| empty( $credentials['encrypted_client_id'] )
			|| empty( $credentials['encrypted_client_secret'] )
		) {
			return false;
		}

		$client_id     = self::decrypt( $credentials['encrypted_client_id'] );
		$client_secret = self::decrypt( $credentials['encrypted_client_secret'] );

		if ( false === $client_id || false === $client_secret ) {
			// Decryption failed — likely AUTH_KEY changed or data corrupted.
			self::delete_credentials();
			return false;
		}

		return array(
			'client_id'     => $client_id,
			'client_secret' => $client_secret,
		);
	}

	/**
	 * Check whether PayPal credentials are stored and valid.
	 *
	 * @return bool True if credentials exist and pass integrity check.
	 */
	public static function has_credentials() {
		return false !== self::get_credentials();
	}

	/**
	 * Delete stored PayPal credentials and cached token.
	 *
	 * @return bool True on success, false on failure.
	 */
	public static function delete_credentials() {
		self::clear_cached_token();
		return delete_option( self::CREDENTIALS_OPTION_KEY );
	}

	/**
	 * Get a valid OAuth access token.
	 *
	 * Returns a cached token if still valid, otherwise requests a new one
	 * from PayPal's OAuth endpoint using the client credentials grant.
	 *
	 * @return string|\WP_Error The access token string, or WP_Error on failure.
	 */
	public static function get_access_token() {
		// Try cached token first.
		$cached_token = get_transient( self::TOKEN_TRANSIENT_KEY );
		if ( false !== $cached_token && is_string( $cached_token ) ) {
			// Double-check absolute expiry timestamp in case the transient
			// survived an object-cache flush or clock drift.
			$expires_at = get_option( self::TOKEN_EXPIRES_AT_OPTION_KEY, 0 );
			if ( $expires_at > 0 && time() >= $expires_at ) {
				self::clear_cached_token();
				return self::request_access_token();
			}

			return $cached_token;
		}

		// No valid cached token — request a new one.
		return self::request_access_token();
	}

	/**
	 * Request a new OAuth access token from PayPal.
	 *
	 * Uses the client credentials grant type with HTTP Basic authentication.
	 *
	 * @return string|\WP_Error The access token string, or WP_Error on failure.
	 */
	private static function request_access_token() {
		$credentials = self::get_credentials();
		if ( false === $credentials ) {
			return new \WP_Error(
				'paypal_no_credentials',
				__( 'PayPal API credentials are not configured. Please connect your PayPal account.', 'jetpack-paypal-payments' )
			);
		}

		$url = self::get_base_url() . self::TOKEN_ENDPOINT;

		$response = wp_remote_post(
			$url,
			array(
				'timeout' => 30,
				'headers' => array(
					'Authorization' => 'Basic ' . base64_encode( $credentials['client_id'] . ':' . $credentials['client_secret'] ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Required by PayPal OAuth spec.
					'Content-Type'  => 'application/x-www-form-urlencoded',
					'Accept'        => 'application/json',
				),
				'body'    => 'grant_type=client_credentials',
			)
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'paypal_token_request_failed',
				sprintf(
					/* translators: %s: error message from the HTTP request */
					__( 'Failed to connect to PayPal: %s', 'jetpack-paypal-payments' ),
					$response->get_error_message()
				)
			);
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = wp_remote_retrieve_body( $response );
		$data        = json_decode( $body, true );

		if ( 200 !== $status_code ) {
			$error_description = isset( $data['error_description'] )
				? sanitize_text_field( $data['error_description'] )
				: __( 'Unknown error', 'jetpack-paypal-payments' );

			$error_code = isset( $data['error'] )
				? sanitize_text_field( $data['error'] )
				: 'paypal_token_error';

			return new \WP_Error(
				'paypal_token_' . $error_code,
				sprintf(
					/* translators: 1: HTTP status code, 2: error description from PayPal */
					__( 'PayPal authentication failed (HTTP %1$d): %2$s', 'jetpack-paypal-payments' ),
					$status_code,
					$error_description
				),
				array( 'status' => $status_code )
			);
		}

		if ( empty( $data['access_token'] ) ) {
			return new \WP_Error(
				'paypal_token_missing',
				__( 'PayPal returned a successful response but no access token was included.', 'jetpack-paypal-payments' )
			);
		}

		$access_token = sanitize_text_field( $data['access_token'] );
		$expires_in   = isset( $data['expires_in'] ) ? absint( $data['expires_in'] ) : 0;

		// Cache the token with a buffer before expiry.
		if ( $expires_in > self::TOKEN_EXPIRY_BUFFER ) {
			$cache_duration = $expires_in - self::TOKEN_EXPIRY_BUFFER;
			set_transient( self::TOKEN_TRANSIENT_KEY, $access_token, $cache_duration );

			// Store absolute expiry timestamp as a fallback for object-cache eviction.
			update_option( self::TOKEN_EXPIRES_AT_OPTION_KEY, time() + $cache_duration, false );
		}

		return $access_token;
	}

	/**
	 * Clear the cached OAuth access token.
	 *
	 * @return bool True if the transient was deleted, false otherwise.
	 */
	public static function clear_cached_token() {
		delete_option( self::TOKEN_EXPIRES_AT_OPTION_KEY );
		return delete_transient( self::TOKEN_TRANSIENT_KEY );
	}

	/**
	 * Validate stored credentials by attempting a token exchange.
	 *
	 * Useful for verifying that the merchant's client_id and secret
	 * are correct and that Payment Links & Buttons is enabled.
	 *
	 * @return true|\WP_Error True if credentials are valid, WP_Error otherwise.
	 */
	public static function validate_credentials() {
		// Force a fresh token request (bypass cache).
		self::clear_cached_token();

		$token = self::request_access_token();

		if ( is_wp_error( $token ) ) {
			return $token;
		}

		return true;
	}

	/**
	 * Validate that the authenticated account has access to the Payment Links & Buttons API.
	 *
	 * Probes GET /v1/checkout/payment-resources?page_size=1 after a successful
	 * token exchange. A 403 means the merchant's app lacks the required scope.
	 * Transient server errors (5xx, timeouts) are treated as non-blocking so
	 * the connect flow is not disrupted by temporary PayPal outages.
	 *
	 * @return true|\WP_Error True if the account has API access, WP_Error on 403.
	 */
	public static function validate_api_access() {
		$token = self::get_access_token();
		if ( is_wp_error( $token ) ) {
			return $token;
		}

		$url = self::get_base_url() . '/v1/checkout/payment-resources?page_size=1';

		$response = wp_remote_get(
			$url,
			array(
				'timeout' => 15,
				'headers' => array(
					'Authorization' => 'Bearer ' . $token,
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
				),
			)
		);

		// Network-level failures are non-blocking.
		if ( is_wp_error( $response ) ) {
			return true;
		}

		$status_code = wp_remote_retrieve_response_code( $response );

		// 5xx / unexpected codes — treat as transient, don't block connect.
		if ( $status_code >= 500 || 0 === $status_code ) {
			return true;
		}

		// 403 — the app lacks Payment Links & Buttons access.
		if ( 403 === $status_code ) {
			return new \WP_Error(
				'paypal_api_not_authorized',
				__(
					'Your PayPal app does not have access to Payment Links & Buttons. In the PayPal Developer Dashboard, open your app settings and enable the "Payment Links & Buttons" feature, then try connecting again.',
					'jetpack-paypal-payments'
				),
				array( 'status' => 403 )
			);
		}

		// 200, 204, or other success / client errors (400, 404) mean the API is reachable.
		return true;
	}

	/**
	 * Get the connection status for display in the block editor.
	 *
	 * @return array {
	 *     Connection status information.
	 *
	 *     @type bool   $connected   Whether credentials are stored.
	 *     @type string $environment Current environment ('sandbox' or 'production').
	 * }
	 */
	public static function get_connection_status() {
		return array(
			'connected'   => self::has_credentials(),
			'environment' => self::get_environment(),
		);
	}

	/**
	 * Clean up all PayPal OAuth data.
	 *
	 * Removes stored credentials, cached token, and environment setting.
	 * Used during plugin deactivation or full disconnect.
	 *
	 * @return void
	 */
	public static function disconnect() {
		delete_option( self::CREDENTIALS_OPTION_KEY );
		delete_option( self::ENVIRONMENT_OPTION_KEY );
		delete_option( self::TOKEN_EXPIRES_AT_OPTION_KEY );
		self::clear_cached_token();
	}
}
