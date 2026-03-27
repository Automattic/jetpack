<?php
/**
 * PayPal Partner Referrals onboarding handler.
 *
 * Implements the "Connect with PayPal" flow using PayPal's Partner Referrals
 * API (v2). Generates signup links, exchanges auth codes for credentials,
 * and verifies merchant integration status.
 *
 * @package automattic/jetpack-paypal-payments
 * @since 0.9.0
 * @see https://developer.paypal.com/docs/multiparty/seller-onboarding/build-onboarding/
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PayPal_Partner_Onboarding
 *
 * Handles the Partner Referrals onboarding flow for one-click
 * "Connect with PayPal" merchant setup.
 */
class PayPal_Partner_Onboarding {

	/**
	 * Partner Referrals API endpoint.
	 *
	 * @var string
	 */
	const REFERRALS_ENDPOINT = '/v2/customer/partner-referrals';

	/**
	 * OAuth token endpoint for authorization code exchange.
	 *
	 * @var string
	 */
	const TOKEN_ENDPOINT = '/v1/oauth2/token';

	/**
	 * Merchant integrations endpoint template.
	 * Replace {partner_id} and {merchant_id} at call time.
	 *
	 * @var string
	 */
	const MERCHANT_INTEGRATIONS_ENDPOINT = '/v1/customer/partners/%s/merchant-integrations/%s';

	/**
	 * Merchant credentials endpoint template.
	 * Replace {partner_id} at call time.
	 *
	 * @var string
	 */
	const MERCHANT_CREDENTIALS_ENDPOINT = '/v1/customer/partners/%s/merchant-integrations/credentials/';

	/**
	 * Option key for storing the seller nonce used during onboarding.
	 *
	 * @var string
	 */
	const SELLER_NONCE_OPTION_KEY = 'jetpack_paypal_payment_buttons_seller_nonce';

	/**
	 * Option key for storing the partner merchant ID.
	 *
	 * @var string
	 */
	const PARTNER_ID_OPTION_KEY = 'jetpack_paypal_payment_buttons_partner_id';

	/**
	 * Option key for storing the onboarded merchant's PayPal merchant ID.
	 *
	 * @var string
	 */
	const MERCHANT_ID_OPTION_KEY = 'jetpack_paypal_payment_buttons_merchant_id';

	/**
	 * Option key for storing the onboarding method used.
	 *
	 * @var string
	 */
	const ONBOARDING_METHOD_OPTION_KEY = 'jetpack_paypal_payment_buttons_onboarding_method';

	/**
	 * Products to request during onboarding.
	 * NCPS (Payment Links & Buttons) is bundled within PPCP_STANDARD / EXPRESS_CHECKOUT.
	 *
	 * @var array
	 */
	const ONBOARDING_PRODUCTS = array( 'EXPRESS_CHECKOUT' );

	/**
	 * Features to request during onboarding.
	 *
	 * @var array
	 */
	const ONBOARDING_FEATURES = array( 'PAYMENT', 'REFUND', 'ACCESS_MERCHANT_INFORMATION' );

	/**
	 * Generate a seller nonce for the onboarding flow.
	 *
	 * Must be 43-128 bytes, alphanumeric with hyphens, underscores, and colons.
	 *
	 * @return string The generated nonce.
	 */
	private static function generate_seller_nonce() {
		$bytes = random_bytes( 32 );
		$nonce = rtrim( strtr( base64_encode( $bytes ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Generating URL-safe nonce for PayPal Partner Referrals.
		return substr( $nonce, 0, 64 );
	}

	/**
	 * Get the partner merchant ID for the current environment.
	 *
	 * @return string The partner merchant ID.
	 */
	public static function get_partner_id() {
		return get_option( self::PARTNER_ID_OPTION_KEY, '' );
	}

	/**
	 * Set the partner merchant ID.
	 *
	 * @param string $partner_id The Automattic partner merchant ID.
	 * @return bool True on success.
	 */
	public static function set_partner_id( $partner_id ) {
		return update_option( self::PARTNER_ID_OPTION_KEY, sanitize_text_field( $partner_id ), false );
	}

	/**
	 * Get the onboarded merchant's PayPal merchant ID.
	 *
	 * @return string The merchant ID, or empty string if not onboarded.
	 */
	public static function get_merchant_id() {
		return get_option( self::MERCHANT_ID_OPTION_KEY, '' );
	}

	/**
	 * Generate a Partner Referrals signup link for the merchant.
	 *
	 * Creates a referral via POST /v2/customer/partner-referrals and returns
	 * the action_url for the PayPal mini-browser lightbox.
	 *
	 * Prerequisite: Partner-level credentials (Automattic's partner client_id/secret)
	 * must be pre-configured via PayPal_OAuth::store_credentials() before this method
	 * is called. These are seeded during plugin activation, not entered by the merchant.
	 *
	 * @param string $return_url  The URL PayPal redirects to after onboarding.
	 * @param string $environment 'sandbox' or 'production'.
	 * @return array|\WP_Error Array with 'action_url' and 'referral_id', or WP_Error.
	 */
	public static function generate_signup_link( $return_url, $environment = 'production' ) {
		// Enforce HTTPS on the return URL to protect the auth code in transit.
		if ( 'production' === $environment && 0 !== strpos( $return_url, 'https://' ) ) {
			return new \WP_Error(
				'paypal_onboarding_insecure_url',
				__( 'The return URL must use HTTPS for production onboarding.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		$partner_id = self::get_partner_id();
		if ( empty( $partner_id ) ) {
			return new \WP_Error(
				'paypal_no_partner_id',
				__( 'PayPal partner merchant ID is not configured. Please contact support.', 'jetpack-paypal-payments' )
			);
		}

		// Generate and store an encrypted seller nonce for the auth code exchange.
		$seller_nonce    = self::generate_seller_nonce();
		$encrypted_nonce = PayPal_OAuth::encrypt( $seller_nonce );
		if ( is_wp_error( $encrypted_nonce ) ) {
			return $encrypted_nonce;
		}
		update_option( self::SELLER_NONCE_OPTION_KEY, $encrypted_nonce, false );

		// Build the tracking ID from the site URL for uniqueness.
		$tracking_id = 'woo-ncps-' . substr( md5( get_site_url() ), 0, 12 ) . '-' . time();

		$base_url = 'production' === $environment
			? PayPal_OAuth::PRODUCTION_BASE_URL
			: PayPal_OAuth::SANDBOX_BASE_URL;

		$request_body = array(
			'tracking_id'             => $tracking_id,
			'partner_config_override' => array(
				'return_url'             => $return_url,
				'return_url_description' => __( 'Return to your WordPress site to complete setup.', 'jetpack-paypal-payments' ),
				'show_add_credit_card'   => true,
			),
			'operations'              => array(
				array(
					'operation'                  => 'API_INTEGRATION',
					'api_integration_preference' => array(
						'rest_api_integration' => array(
							'integration_method'  => 'PAYPAL',
							'integration_type'    => 'FIRST_PARTY',
							'first_party_details' => array(
								'features'     => self::ONBOARDING_FEATURES,
								'seller_nonce' => $seller_nonce,
							),
						),
					),
				),
			),
			'products'                => self::ONBOARDING_PRODUCTS,
			'legal_consents'          => array(
				array(
					'type'    => 'SHARE_DATA_CONSENT',
					'granted' => true,
				),
			),
		);

		// Get a partner access token to call the Partner Referrals API.
		$token = PayPal_OAuth::get_access_token();
		if ( is_wp_error( $token ) ) {
			return $token;
		}

		$response = wp_remote_post(
			$base_url . self::REFERRALS_ENDPOINT,
			array(
				'timeout' => 30,
				'headers' => array(
					'Authorization' => 'Bearer ' . $token,
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
				),
				'body'    => wp_json_encode( $request_body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'paypal_referral_request_failed',
				sprintf(
					/* translators: %s: error message */
					__( 'Failed to create PayPal onboarding link: %s', 'jetpack-paypal-payments' ),
					$response->get_error_message()
				)
			);
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 201 !== $status_code && 200 !== $status_code ) {
			return new \WP_Error(
				'paypal_referral_failed',
				__( 'Could not create a PayPal onboarding link. Please try again or use the manual credentials option.', 'jetpack-paypal-payments' ),
				array( 'status' => $status_code )
			);
		}

		// Extract the action_url from the links array.
		$action_url  = '';
		$referral_id = '';

		if ( isset( $body['links'] ) && is_array( $body['links'] ) ) {
			foreach ( $body['links'] as $link ) {
				if ( 'action_url' === $link['rel'] ) {
					$action_url = $link['href'];
				}
				if ( 'self' === $link['rel'] ) {
					// Extract referral ID from the self URL.
					$parts       = explode( '/', $link['href'] );
					$referral_id = end( $parts );
				}
			}
		}

		if ( empty( $action_url ) ) {
			return new \WP_Error(
				'paypal_referral_no_url',
				__( 'PayPal returned a successful response but no onboarding URL was included.', 'jetpack-paypal-payments' )
			);
		}

		return array(
			'action_url'  => $action_url,
			'referral_id' => $referral_id,
			'tracking_id' => $tracking_id,
		);
	}

	/**
	 * Exchange an authorization code for merchant credentials.
	 *
	 * Called after the merchant completes the PayPal onboarding flow.
	 * Uses the seller_nonce as code_verifier for PKCE.
	 *
	 * @param string $auth_code  The authorization code from PayPal callback.
	 * @param string $shared_id  The shared ID from the onboarding callback.
	 * @param string $merchant_id_in_paypal The merchant's PayPal payer ID.
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public static function complete_onboarding( $auth_code, $shared_id, $merchant_id_in_paypal ) {
		$encrypted_nonce = get_option( self::SELLER_NONCE_OPTION_KEY, '' );
		if ( empty( $encrypted_nonce ) ) {
			return new \WP_Error(
				'paypal_onboarding_no_nonce',
				__( 'Onboarding session expired. Please try connecting again.', 'jetpack-paypal-payments' )
			);
		}

		$seller_nonce = PayPal_OAuth::decrypt( $encrypted_nonce );
		if ( false === $seller_nonce ) {
			delete_option( self::SELLER_NONCE_OPTION_KEY );
			return new \WP_Error(
				'paypal_onboarding_nonce_corrupt',
				__( 'Onboarding session data could not be read. Please try connecting again.', 'jetpack-paypal-payments' )
			);
		}

		$base_url = PayPal_OAuth::get_base_url();

		// Step 1: Exchange auth code for access token using shared_id as client_id.
		$token_response = wp_remote_post(
			$base_url . self::TOKEN_ENDPOINT,
			array(
				'timeout' => 30,
				'headers' => array(
					'Authorization' => 'Basic ' . base64_encode( $shared_id . ':' ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Required by PayPal OAuth spec: shared_id with empty password.
					'Content-Type'  => 'application/x-www-form-urlencoded',
					'Accept'        => 'application/json',
				),
				'body'    => http_build_query(
					array(
						'grant_type'    => 'authorization_code',
						'code'          => $auth_code,
						'code_verifier' => $seller_nonce,
					)
				),
			)
		);

		if ( is_wp_error( $token_response ) ) {
			return new \WP_Error(
				'paypal_onboarding_token_failed',
				sprintf(
					/* translators: %s: error message */
					__( 'Failed to exchange PayPal authorization code: %s', 'jetpack-paypal-payments' ),
					$token_response->get_error_message()
				)
			);
		}

		$token_status = wp_remote_retrieve_response_code( $token_response );
		$token_data   = json_decode( wp_remote_retrieve_body( $token_response ), true );

		if ( 200 !== $token_status || empty( $token_data['access_token'] ) ) {
			$error_msg = isset( $token_data['error_description'] )
				? $token_data['error_description']
				: __( 'Unknown error during token exchange', 'jetpack-paypal-payments' );
			return new \WP_Error(
				'paypal_onboarding_token_error',
				sprintf(
					/* translators: %s: error description */
					__( 'PayPal token exchange failed: %s', 'jetpack-paypal-payments' ),
					sanitize_text_field( $error_msg )
				),
				array( 'status' => $token_status )
			);
		}

		$seller_access_token = $token_data['access_token'];

		// Step 2: Fetch merchant credentials using the seller's access token.
		$partner_id = self::get_partner_id();
		$creds_url  = $base_url . sprintf( self::MERCHANT_CREDENTIALS_ENDPOINT, $partner_id );

		$creds_response = wp_remote_get(
			$creds_url,
			array(
				'timeout' => 30,
				'headers' => array(
					'Authorization' => 'Bearer ' . $seller_access_token,
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
				),
			)
		);

		if ( is_wp_error( $creds_response ) ) {
			return new \WP_Error(
				'paypal_onboarding_creds_failed',
				sprintf(
					/* translators: %s: error message */
					__( 'Failed to retrieve merchant credentials: %s', 'jetpack-paypal-payments' ),
					$creds_response->get_error_message()
				)
			);
		}

		$creds_status = wp_remote_retrieve_response_code( $creds_response );
		$creds_data   = json_decode( wp_remote_retrieve_body( $creds_response ), true );

		if ( 200 !== $creds_status || empty( $creds_data['client_id'] ) || empty( $creds_data['client_secret'] ) ) {
			return new \WP_Error(
				'paypal_onboarding_creds_error',
				__( 'PayPal returned merchant credentials in an unexpected format. Please try connecting again.', 'jetpack-paypal-payments' ),
				array( 'status' => $creds_status )
			);
		}

		// Step 3: Store the credentials using the existing encrypted storage.
		$stored = PayPal_OAuth::store_credentials(
			$creds_data['client_id'],
			$creds_data['client_secret']
		);

		if ( ! $stored || is_wp_error( $stored ) ) {
			return new \WP_Error(
				'paypal_onboarding_storage_failed',
				__( 'Failed to store PayPal credentials. Please ensure your WordPress installation supports encryption.', 'jetpack-paypal-payments' ),
				array( 'status' => 500 )
			);
		}

		// Store the merchant ID and onboarding method.
		update_option( self::MERCHANT_ID_OPTION_KEY, sanitize_text_field( $merchant_id_in_paypal ), false );
		update_option( self::ONBOARDING_METHOD_OPTION_KEY, 'partner_referrals', false );

		// Clean up the seller nonce — it's single-use.
		delete_option( self::SELLER_NONCE_OPTION_KEY );

		// Step 4: Validate that the credentials work and the API is accessible.
		$validation = PayPal_OAuth::validate_credentials();
		if ( is_wp_error( $validation ) ) {
			return $validation;
		}

		$api_access = PayPal_OAuth::validate_api_access();
		if ( is_wp_error( $api_access ) ) {
			return $api_access;
		}

		return true;
	}

	/**
	 * Check the merchant's integration status with PayPal.
	 *
	 * Verifies that the merchant can receive payments and has confirmed email.
	 *
	 * @return array|\WP_Error Integration status array, or WP_Error.
	 */
	public static function check_merchant_status() {
		$partner_id  = self::get_partner_id();
		$merchant_id = self::get_merchant_id();

		if ( empty( $partner_id ) || empty( $merchant_id ) ) {
			return new \WP_Error(
				'paypal_no_merchant_info',
				__( 'Merchant integration info not available. Please reconnect your PayPal account.', 'jetpack-paypal-payments' )
			);
		}

		$token = PayPal_OAuth::get_access_token();
		if ( is_wp_error( $token ) ) {
			return $token;
		}

		$url = PayPal_OAuth::get_base_url() . sprintf(
			self::MERCHANT_INTEGRATIONS_ENDPOINT,
			$partner_id,
			$merchant_id
		);

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

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$data        = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status_code ) {
			return new \WP_Error(
				'paypal_merchant_status_error',
				__( 'Could not retrieve merchant integration status from PayPal.', 'jetpack-paypal-payments' ),
				array( 'status' => $status_code )
			);
		}

		return array(
			'merchant_id'             => $merchant_id,
			'payments_receivable'     => ! empty( $data['payments_receivable'] ),
			'primary_email_confirmed' => ! empty( $data['primary_email_confirmed'] ),
			'products'                => isset( $data['products'] ) ? $data['products'] : array(),
		);
	}

	/**
	 * Clean up all Partner Referrals onboarding data.
	 *
	 * Called during disconnect to remove merchant ID, partner ID, and nonce.
	 *
	 * @return void
	 */
	public static function cleanup() {
		delete_option( self::SELLER_NONCE_OPTION_KEY );
		delete_option( self::MERCHANT_ID_OPTION_KEY );
		delete_option( self::ONBOARDING_METHOD_OPTION_KEY );
		// Note: Partner ID is not deleted — it's a site-level config, not per-merchant.
	}
}
