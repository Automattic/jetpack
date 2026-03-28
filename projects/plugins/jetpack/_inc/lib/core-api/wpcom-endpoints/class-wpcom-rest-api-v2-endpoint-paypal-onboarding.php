<?php
/**
 * WPCOM REST API v2 endpoint for PayPal Partner Referrals onboarding.
 *
 * Proxies signup link generation through WordPress.com so that Automattic's
 * PayPal platform credentials (client_id/client_secret) stay server-side
 * and never ship in the plugin.
 *
 * Plugin side: PayPal_Partner_Onboarding::generate_signup_link() calls this
 * endpoint via Client::wpcom_json_api_request_as_blog().
 *
 * @package automattic/jetpack
 * @since 14.x
 * @see https://developer.paypal.com/docs/multiparty/seller-onboarding/build-onboarding/
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * PayPal Onboarding: Generate Partner Referrals signup links.
 *
 * Receives a referral request body from the plugin, authenticates with PayPal
 * using Automattic's platform credentials, and returns the action_url for the
 * merchant's onboarding popup.
 *
 * @since 14.x
 */
class WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding extends WP_REST_Controller {

	/**
	 * PayPal production API base URL.
	 *
	 * @var string
	 */
	const PAYPAL_PRODUCTION_BASE_URL = 'https://api.paypal.com';

	/**
	 * PayPal sandbox API base URL.
	 *
	 * @var string
	 */
	const PAYPAL_SANDBOX_BASE_URL = 'https://api-m.sandbox.paypal.com';

	/**
	 * PayPal Partner Referrals API endpoint.
	 *
	 * @var string
	 */
	const PAYPAL_REFERRALS_ENDPOINT = '/v2/customer/partner-referrals';

	/**
	 * PayPal OAuth token endpoint.
	 *
	 * @var string
	 */
	const PAYPAL_TOKEN_ENDPOINT = '/v1/oauth2/token';

	/**
	 * Option key for Automattic's PayPal platform credentials on WPCOM.
	 *
	 * Stores JSON: { "production": { "client_id": "...", "client_secret": "..." },
	 *                "sandbox":    { "client_id": "...", "client_secret": "..." } }
	 *
	 * @todo Provision this option on WPCOM with the real credentials.
	 * @var string
	 */
	const PLATFORM_CREDENTIALS_OPTION = 'jetpack_paypal_platform_credentials';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'paypal/onboarding';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/signup-link',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'generate_signup_link' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'environment' => array(
							'required'          => true,
							'type'              => 'string',
							'enum'              => array( 'sandbox', 'production' ),
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => 'PayPal environment: sandbox or production.',
						),
						'referral'    => array(
							'required'    => true,
							'type'        => 'object',
							'description' => 'Partner Referrals request body to forward to PayPal.',
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check — requires a valid Jetpack blog connection.
	 *
	 * The request comes from the plugin via Client::wpcom_json_api_request_as_blog(),
	 * which authenticates using the site's Jetpack blog token.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		$site_id = Connection_Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return new WP_Error(
				'not_connected',
				__( 'Site is not connected to WordPress.com.', 'jetpack' ),
				array( 'status' => 403 )
			);
		}
		return true;
	}

	/**
	 * Generate a PayPal Partner Referrals signup link.
	 *
	 * Authenticates with PayPal using Automattic's platform credentials,
	 * creates a partner referral, and returns the action_url.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function generate_signup_link( WP_REST_Request $request ) {
		$environment = $request->get_param( 'environment' );
		$referral    = $request->get_param( 'referral' );

		// Step 1: Load Automattic's PayPal platform credentials.
		$credentials = $this->get_platform_credentials( $environment );
		if ( is_wp_error( $credentials ) ) {
			return $credentials;
		}

		$base_url = 'production' === $environment
			? self::PAYPAL_PRODUCTION_BASE_URL
			: self::PAYPAL_SANDBOX_BASE_URL;

		// Step 2: Get an access token using Automattic's platform credentials.
		$token = $this->get_paypal_access_token( $base_url, $credentials['client_id'], $credentials['client_secret'] );
		if ( is_wp_error( $token ) ) {
			return $token;
		}

		// Step 3: Create the Partner Referral via PayPal API.
		$response = wp_remote_post(
			$base_url . self::PAYPAL_REFERRALS_ENDPOINT,
			array(
				'timeout' => 30,
				'headers' => array(
					'Authorization' => 'Bearer ' . $token,
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
				),
				'body'    => wp_json_encode( $referral, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'paypal_request_failed',
				$response->get_error_message(),
				array( 'status' => 502 )
			);
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 201 !== $status_code && 200 !== $status_code ) {
			return new WP_Error(
				'paypal_referral_failed',
				isset( $body['message'] ) ? $body['message'] : 'PayPal Partner Referrals API returned an error.',
				array( 'status' => $status_code )
			);
		}

		// Step 4: Extract action_url and referral_id from PayPal's response.
		$action_url  = '';
		$referral_id = '';

		if ( isset( $body['links'] ) && is_array( $body['links'] ) ) {
			foreach ( $body['links'] as $link ) {
				if ( 'action_url' === $link['rel'] ) {
					$action_url = $link['href'];
				}
				if ( 'self' === $link['rel'] ) {
					$parts       = explode( '/', $link['href'] );
					$referral_id = end( $parts );
				}
			}
		}

		if ( empty( $action_url ) ) {
			return new WP_Error(
				'paypal_no_action_url',
				'PayPal returned a successful response but no onboarding URL was included.',
				array( 'status' => 502 )
			);
		}

		return rest_ensure_response(
			array(
				'action_url'  => $action_url,
				'referral_id' => $referral_id,
			)
		);
	}

	/**
	 * Get Automattic's PayPal platform credentials for the given environment.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @return array|WP_Error Array with 'client_id' and 'client_secret', or WP_Error.
	 */
	private function get_platform_credentials( $environment ) {
		$stored = get_option( self::PLATFORM_CREDENTIALS_OPTION, '' );

		if ( empty( $stored ) ) {
			return new WP_Error(
				'platform_credentials_missing',
				'PayPal platform credentials are not configured on WordPress.com. Please contact the Jetpack team.',
				array( 'status' => 500 )
			);
		}

		$credentials = is_string( $stored ) ? json_decode( $stored, true ) : $stored;

		if ( ! isset( $credentials[ $environment ]['client_id'] ) || ! isset( $credentials[ $environment ]['client_secret'] ) ) {
			return new WP_Error(
				'platform_credentials_invalid',
				sprintf( 'PayPal platform credentials for %s environment are not configured.', $environment ),
				array( 'status' => 500 )
			);
		}

		return $credentials[ $environment ];
	}

	/**
	 * Get a PayPal OAuth access token using client credentials grant.
	 *
	 * @param string $base_url      PayPal API base URL.
	 * @param string $client_id     Platform client ID.
	 * @param string $client_secret Platform client secret.
	 * @return string|WP_Error Access token string, or WP_Error.
	 */
	private function get_paypal_access_token( $base_url, $client_id, $client_secret ) {
		$response = wp_remote_post(
			$base_url . self::PAYPAL_TOKEN_ENDPOINT,
			array(
				'timeout' => 15,
				'headers' => array(
					'Authorization' => 'Basic ' . base64_encode( $client_id . ':' . $client_secret ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Required by PayPal OAuth spec.
					'Content-Type'  => 'application/x-www-form-urlencoded',
					'Accept'        => 'application/json',
				),
				'body'    => 'grant_type=client_credentials',
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'paypal_token_failed',
				$response->get_error_message(),
				array( 'status' => 502 )
			);
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$data        = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $status_code || empty( $data['access_token'] ) ) {
			return new WP_Error(
				'paypal_token_error',
				'Failed to obtain PayPal access token with platform credentials.',
				array( 'status' => 502 )
			);
		}

		return $data['access_token'];
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding' );
