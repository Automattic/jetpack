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
 * @package automattic/jetpack-mu-wpcom
 * @since $$next-version$$
 * @see https://developer.paypal.com/docs/multiparty/seller-onboarding/build-onboarding/
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;

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
 * @since $$next-version$$
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
	 * Names of the constants holding Automattic's PayPal platform credentials, by environment.
	 *
	 * The values themselves live in WordPress.com's secrets configuration. Only the
	 * constant *names* are stored here: referencing an undefined constant inside a
	 * constant expression is a fatal error, and these are never defined on self-hosted
	 * sites, where onboarding is proxied to WordPress.com instead. Read them through
	 * get_platform_credentials(), which tolerates their absence.
	 *
	 * @var array<string, array<string, string>>
	 */
	const PLATFORM_CREDENTIAL_CONSTANTS = array(
		'production' => array(
			'client_id'           => 'PAYPAL_BUTTONS_PRODUCTION_CLIENT_ID',
			'client_secret'       => 'PAYPAL_BUTTONS_PRODUCTION_CLIENT_SECRET',
			'partner_merchant_id' => 'PAYPAL_BUTTONS_PRODUCTION_PARTNER_MERCHANT_ID',
		),
		'sandbox'    => array(
			'client_id'           => 'PAYPAL_BUTTONS_SANDBOX_CLIENT_ID',
			'client_secret'       => 'PAYPAL_BUTTONS_SANDBOX_CLIENT_SECRET',
			'partner_merchant_id' => 'PAYPAL_BUTTONS_SANDBOX_PARTNER_MERCHANT_ID',
		),
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';

		/*
		 * 'paypal/platform', not 'paypal/onboarding': the package registers the
		 * editor-facing wpcom/v2/paypal/onboarding/signup-link on every host that
		 * runs it, including this one. Sharing the path would mean two classes
		 * claiming one route, and the site proxying to itself.
		 */
		$this->rest_base = 'paypal/platform';

		/*
		 * Opt out of WordPress.com's centralize.php rewrite, which otherwise moves every
		 * wpcom/v2 route to /wpcom/v2/sites/<site>/... . Client::wpcom_json_api_request_as_blog()
		 * builds a flat /wpcom/v2/<path> URL -- the blog ID travels as a signed argument, not
		 * in the path -- so a rewritten route is unreachable from it and every call came back
		 * rest_no_route.
		 *
		 * The flat form is also the honest one here: this endpoint carries no per-site data.
		 * It exchanges Automattic's platform credentials for a PayPal referral link, and the
		 * merchant is identified by the referral body, not by a site path segment.
		 *
		 * The wpcom-only flag stops public-api's proxy_jetpack() from forwarding the call
		 * to a Jetpack site and answering rest_not_implemented, which is right here: the
		 * credentials are Automattic's and live on WordPress.com servers. A false
		 * site_specific already implies wpcom-only, but both are set explicitly -- as
		 * WPCOM_REST_API_V2_Endpoint_Following does -- so neither relies on the other's
		 * side effect.
		 */
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = false;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public function register_routes() {
		// Same flag as the plugin-side controller. Spelled out because mu-wpcom
		// cannot see the paypal-payments constant.
		if ( ! Feature_Flags::is_enabled( 'paypal-payments-api-managed-buttons' ) ) {
			return;
		}

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
				__( 'Site is not connected to WordPress.com.', 'jetpack-mu-wpcom' ),
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
			/*
			 * PayPal's top-level message for a rejected referral is always the same
			 * generic sentence ("Request is not well-formed, syntactically
			 * incorrect, or violates schema."). Everything needed to act on it is
			 * in `details`, which names the offending field and issue, and in
			 * `debug_id`, which PayPal support needs to trace the call. Passing
			 * only the message through left callers with nothing to go on, so
			 * carry both. None of it is credential material.
			 */
			$error_data = array( 'status' => $status_code );

			if ( ! empty( $body['name'] ) ) {
				$error_data['paypal_error'] = $body['name'];
			}
			if ( ! empty( $body['details'] ) && is_array( $body['details'] ) ) {
				$error_data['paypal_details'] = $body['details'];
			}
			if ( ! empty( $body['debug_id'] ) ) {
				$error_data['paypal_debug_id'] = $body['debug_id'];
			}

			return new WP_Error(
				'paypal_referral_failed',
				$body['message'] ?? 'PayPal Partner Referrals API returned an error.',
				$error_data
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
				'action_url'          => $action_url,
				'referral_id'         => $referral_id,
				// The plugin needs this to address PayPal as the partner when it
				// exchanges the auth code and when it checks merchant status.
				'partner_merchant_id' => $credentials['partner_merchant_id'] ?? '',
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
		$constants = self::PLATFORM_CREDENTIAL_CONSTANTS[ $environment ] ?? array();

		$credentials = array();
		$missing     = array();

		foreach ( $constants as $key => $constant_name ) {
			$value = Constants::get_constant( $constant_name );
			if ( is_string( $value ) && '' !== $value ) {
				$credentials[ $key ] = $value;
			} else {
				$missing[] = $constant_name;
			}
		}

		if ( empty( $missing ) ) {
			return $credentials;
		}

		/*
		 * Separate "nothing is provisioned here at all" from "this environment is
		 * not provisioned". The option this replaced could tell them apart because
		 * one value held every environment; per-environment constants cannot, so
		 * look at the whole set. The second message is the actionable one, and it
		 * is what a sandbox-only configuration hits when asked for production.
		 */
		$anything_provisioned = false;
		foreach ( self::PLATFORM_CREDENTIAL_CONSTANTS as $environment_constants ) {
			foreach ( $environment_constants as $constant_name ) {
				$value = Constants::get_constant( $constant_name );
				if ( is_string( $value ) && '' !== $value ) {
					$anything_provisioned = true;
					break 2;
				}
			}
		}

		if ( ! $anything_provisioned ) {
			return new WP_Error(
				'platform_credentials_missing',
				'PayPal platform credentials are not configured on WordPress.com. Please contact the Jetpack team.',
				array( 'status' => 500 )
			);
		}

		/*
		 * Name the constants that are absent. "not configured" on its own sends
		 * whoever is provisioning the environment hunting through three names to
		 * find which one they missed.
		 *
		 * The partner merchant ID keeps its own code: it is Automattic's own
		 * PayPal account ID rather than an API credential, it is easy to overlook
		 * because the referral link is generated without it, and the flow only
		 * breaks later -- when the seller has already finished onboarding.
		 */
		$partner_constant  = $constants['partner_merchant_id'] ?? '';
		$only_partner_id   = array( $partner_constant ) === $missing;
		$error_code        = $only_partner_id
			? 'platform_partner_merchant_id_missing'
			: 'platform_credentials_invalid';
		$missing_explained = $only_partner_id
			? 'Onboarding cannot be completed without it.'
			: 'Onboarding cannot be started without them.';

		return new WP_Error(
			$error_code,
			sprintf(
				'PayPal platform credentials for the %1$s environment are incomplete. Missing: %2$s. %3$s',
				$environment,
				implode( ', ', $missing ),
				$missing_explained
			),
			array( 'status' => 500 )
		);
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
