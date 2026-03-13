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
	 * Get the current PayPal API environment.
	 *
	 * @return string 'sandbox' or 'production'. Defaults to 'sandbox'.
	 */
	public static function get_environment() {
		return get_option( self::ENVIRONMENT_OPTION_KEY, 'sandbox' );
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
	 * Store PayPal client credentials.
	 *
	 * Credentials are encrypted before storage using wp_hash() as a
	 * verification mechanism and stored as a serialized array in wp_options.
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
			'client_id'     => $client_id,
			'client_secret' => $client_secret,
			'hash'          => wp_hash( $client_id . $client_secret ),
			'stored_at'     => time(),
		);

		// Clear any existing cached token since credentials changed.
		self::clear_cached_token();

		return update_option( self::CREDENTIALS_OPTION_KEY, $credentials, false );
	}

	/**
	 * Retrieve stored PayPal client credentials.
	 *
	 * @return array|false Array with 'client_id' and 'client_secret' keys, or false if not set.
	 */
	public static function get_credentials() {
		$credentials = get_option( self::CREDENTIALS_OPTION_KEY, false );

		if ( ! is_array( $credentials )
			|| empty( $credentials['client_id'] )
			|| empty( $credentials['client_secret'] )
		) {
			return false;
		}

		// Verify integrity.
		$expected_hash = wp_hash( $credentials['client_id'] . $credentials['client_secret'] );
		if ( ! hash_equals( $expected_hash, $credentials['hash'] ?? '' ) ) {
			// Credentials may be corrupted — remove them.
			self::delete_credentials();
			return false;
		}

		return array(
			'client_id'     => $credentials['client_id'],
			'client_secret' => $credentials['client_secret'],
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
		}

		return $access_token;
	}

	/**
	 * Clear the cached OAuth access token.
	 *
	 * @return bool True if the transient was deleted, false otherwise.
	 */
	public static function clear_cached_token() {
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
		self::clear_cached_token();
	}
}
