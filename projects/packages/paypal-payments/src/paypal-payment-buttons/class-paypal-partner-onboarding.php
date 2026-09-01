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

use Automattic\Jetpack\Connection\Client;

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
	 * WordPress.com proxy route that creates the Partner Referral.
	 *
	 * Automattic's PayPal platform credentials live on WordPress.com, so the
	 * referral is created there rather than from the site.
	 *
	 * @var string
	 */
	const WPCOM_SIGNUP_LINK_ROUTE = '/paypal/platform/signup-link';

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
	 * Transient key for storing the seller nonce used during onboarding.
	 * Stored as a transient with 30-minute TTL so abandoned flows auto-expire.
	 *
	 * @var string
	 */
	const SELLER_NONCE_TRANSIENT_KEY = 'jetpack_paypal_payment_buttons_seller_nonce';

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
	 * This is the PKCE code verifier. PayPal's schema requires 44-128 characters
	 * matching `^[a-zA-Z0-9-_:]+$`. Note that the prose in PayPal's own field
	 * description says "43-128", but `minLength` is 44 and the API rejects 43
	 * with "Request is not well-formed, syntactically incorrect, or violates
	 * schema." 32 random bytes base64url-encode to exactly 43 characters, which
	 * is why every referral request failed. 48 bytes give exactly 64 characters,
	 * with no padding to strip.
	 *
	 * @return string The generated nonce.
	 */
	private static function generate_seller_nonce() {
		$bytes = random_bytes( 48 );
		return rtrim( strtr( base64_encode( $bytes ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Generating URL-safe nonce for PayPal Partner Referrals.
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
	 * The referral itself is created by WordPress.com, which holds Automattic's
	 * PayPal platform credentials; this method builds the referral body, proxies it
	 * through wpcom/v2/paypal/platform/signup-link using the site's blog token,
	 * and returns the action_url for the PayPal mini-browser lightbox.
	 *
	 * The seller nonce stays on the site: it is the PKCE code_verifier that
	 * complete_onboarding() needs when it exchanges the auth code.
	 *
	 * Prerequisite: the site must be connected to WordPress.com.
	 *
	 * @param string $return_url  The URL PayPal redirects to after onboarding.
	 * @param string $environment 'sandbox' or 'production'.
	 * @return array|\WP_Error Array with 'action_url', 'referral_id' and 'tracking_id', or WP_Error.
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

		// Generate and store an encrypted seller nonce for the auth code exchange.
		// Uses a 30-minute transient so abandoned onboarding flows auto-expire.
		$seller_nonce    = self::generate_seller_nonce();
		$encrypted_nonce = PayPal_OAuth::encrypt( $seller_nonce );
		if ( is_wp_error( $encrypted_nonce ) ) {
			return $encrypted_nonce;
		}
		set_transient( self::SELLER_NONCE_TRANSIENT_KEY, $encrypted_nonce, 30 * MINUTE_IN_SECONDS );

		// Build the tracking ID from the site URL for uniqueness.
		$tracking_id = 'woo-ncps-' . substr( md5( get_site_url() ), 0, 12 ) . '-' . time();

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

		// Automattic's PayPal platform credentials live on WordPress.com, so the
		// referral is created there and only the resulting URL comes back here.
		$response = Client::wpcom_json_api_request_as_blog(
			self::WPCOM_SIGNUP_LINK_ROUTE,
			'2',
			array(
				'method'  => 'POST',
				'timeout' => 30,
				'headers' => array(
					'Content-Type' => 'application/json',
					'Accept'       => 'application/json',
				),
			),
			wp_json_encode(
				array(
					'environment' => $environment,
					'referral'    => $request_body,
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			),
			'wpcom'
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
			/*
			 * Keep the merchant-facing message actionable, but carry PayPal's own
			 * diagnostics (the offending field, the issue code, and the debug ID
			 * PayPal support traces on) through in the error data. Without them a
			 * rejected referral is just a 400 with a generic sentence.
			 */
			$error_data = array( 'status' => $status_code );

			foreach ( array( 'paypal_error', 'paypal_details', 'paypal_debug_id' ) as $key ) {
				if ( isset( $body['data'][ $key ] ) ) {
					$error_data[ $key ] = $body['data'][ $key ];
				}
			}

			if ( ! empty( $body['message'] ) ) {
				$error_data['paypal_message'] = $body['message'];
			}

			return new \WP_Error(
				'paypal_referral_failed',
				__( 'Could not create a PayPal onboarding link. Please try again or use the manual credentials option.', 'jetpack-paypal-payments' ),
				$error_data
			);
		}

		if ( empty( $body['action_url'] ) ) {
			return new \WP_Error(
				'paypal_referral_no_url',
				__( 'PayPal returned a successful response but no onboarding URL was included.', 'jetpack-paypal-payments' )
			);
		}

		// The auth code exchange and the status check both address PayPal as the
		// partner, so store the partner merchant ID WordPress.com used.
		if ( ! empty( $body['partner_merchant_id'] ) ) {
			self::set_partner_id( $body['partner_merchant_id'] );
		}

		return array(
			'action_url'  => $body['action_url'],
			'referral_id' => $body['referral_id'] ?? '',
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
		$encrypted_nonce = get_transient( self::SELLER_NONCE_TRANSIENT_KEY );
		if ( empty( $encrypted_nonce ) ) {
			return new \WP_Error(
				'paypal_onboarding_no_nonce',
				__( 'Onboarding session expired. Please try connecting again.', 'jetpack-paypal-payments' )
			);
		}

		$seller_nonce = PayPal_OAuth::decrypt( $encrypted_nonce );
		if ( false === $seller_nonce ) {
			delete_transient( self::SELLER_NONCE_TRANSIENT_KEY );
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
			$error_msg = $token_data['error_description'] ?? __( 'Unknown error during token exchange', 'jetpack-paypal-payments' );
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

		/*
		 * Resolve the merchant ID.
		 *
		 * PayPal delivers `merchantIdInPayPal` as a query parameter on the return
		 * URL, while `authCode` and `sharedId` arrive by postMessage. A caller
		 * that only reads the postMessage has no merchant ID to pass, so prefer
		 * the `payer_id` PayPal just returned with the credentials — it is the
		 * same value, comes straight from the API, and PayPal recommends it as
		 * the way to identify a merchant.
		 *
		 * Storing an empty value here is what left the site "connected" but
		 * unable to report its own merchant status.
		 */
		$merchant_id = sanitize_text_field( $merchant_id_in_paypal );
		if ( '' === $merchant_id && ! empty( $creds_data['payer_id'] ) ) {
			$merchant_id = sanitize_text_field( $creds_data['payer_id'] );
		}

		if ( '' === $merchant_id ) {
			return new \WP_Error(
				'paypal_onboarding_no_merchant_id',
				__( 'PayPal did not return a merchant ID for this account. Please try connecting again.', 'jetpack-paypal-payments' ),
				array( 'status' => 502 )
			);
		}

		// Store the merchant ID and onboarding method.
		update_option( self::MERCHANT_ID_OPTION_KEY, $merchant_id, false );
		update_option( self::ONBOARDING_METHOD_OPTION_KEY, 'partner_referrals', false );

		// Clean up the seller nonce — it's single-use.
		delete_transient( self::SELLER_NONCE_TRANSIENT_KEY );

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
			// Name the missing half. These are stored at different points in the
			// flow -- the partner ID when the signup link is created, the merchant
			// ID when onboarding completes -- so which one is absent says where
			// the flow broke.
			return new \WP_Error(
				'paypal_no_merchant_info',
				__( 'Merchant integration info not available. Please reconnect your PayPal account.', 'jetpack-paypal-payments' ),
				array(
					'status'          => 400,
					'has_partner_id'  => ! empty( $partner_id ),
					'has_merchant_id' => ! empty( $merchant_id ),
				)
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
			'products'                => $data['products'] ?? array(),
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
		delete_transient( self::SELLER_NONCE_TRANSIENT_KEY );
		delete_option( self::MERCHANT_ID_OPTION_KEY );
		delete_option( self::ONBOARDING_METHOD_OPTION_KEY );
		// Note: Partner ID is not deleted — it's a site-level config, not per-merchant.
	}
}
