<?php
/**
 * WPCOM REST API v2 endpoints for the PayPal Payment Buttons platform integration.
 *
 * Automattic's PayPal platform credentials (client_id/client_secret) stay
 * server-side and never ship in the plugin. The site creates its Partner
 * Referral here, looks up the seller it referred here and, because a
 * THIRD_PARTY seller holds no credentials of their own, makes every Payment
 * Links & Buttons call here as well.
 *
 * Plugin side: PayPal_Partner_Onboarding and PayPal_Platform_Client call these
 * routes via Client::wpcom_json_api_request_as_blog().
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
 * PayPal platform: Partner Referrals signup links, merchant lookups, and
 * Payment Links & Buttons calls made on a referred seller's behalf.
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
	 * Merchant integrations endpoint template. Replace {partner_id} at call time.
	 *
	 * @var string
	 */
	const PAYPAL_MERCHANT_INTEGRATIONS_ENDPOINT = '/v1/customer/partners/%s/merchant-integrations';

	/**
	 * The one PayPal API the site may call on a seller's behalf.
	 *
	 * @var string
	 */
	const PAYPAL_PAYMENT_RESOURCES_ENDPOINT = '/v1/checkout/payment-resources';

	/**
	 * Prefix of every tracking ID this endpoint issues; the blog ID follows it.
	 *
	 * @var string
	 */
	const TRACKING_ID_PREFIX = 'woo-ncps-';

	/**
	 * How long a verified blog-to-merchant binding is remembered, in seconds.
	 *
	 * @var int
	 */
	const MERCHANT_BINDING_TTL = 12 * HOUR_IN_SECONDS;

	/**
	 * Seconds taken off a platform token's lifetime before it is refreshed.
	 *
	 * @var int
	 */
	const TOKEN_EXPIRY_BUFFER = 300;

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
		 * The flat form is also the honest one here: these routes carry no per-site data.
		 * They exchange Automattic's platform credentials for PayPal calls, and the
		 * merchant is identified by the request body, not by a site path segment.
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
		// Hard-coded: mu-wpcom cannot reach PayPal_Payment_Buttons::API_MANAGED_BUTTONS_FLAG.
		// Unregistered here, so only a `jetpack_feature_flag_enabled_*` filter flips it on wpcom.
		if ( ! Feature_Flags::is_enabled( 'paypal-payments-api-managed-buttons' ) ) {
			return;
		}

		$environment_arg = array(
			'required'          => true,
			'type'              => 'string',
			'enum'              => array( 'sandbox', 'production' ),
			'sanitize_callback' => 'sanitize_text_field',
			'description'       => 'PayPal environment: sandbox or production.',
		);

		$merchant_id_arg = array(
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
			'description'       => 'The seller\'s PayPal merchant ID.',
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/signup-link',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'generate_signup_link' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'environment' => $environment_arg,
						'referral'    => array(
							'required'    => true,
							'type'        => 'object',
							'description' => 'Partner Referrals request body to forward to PayPal.',
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/merchant-integration',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_merchant_integration_status' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'environment' => $environment_arg,
						'merchant_id' => $merchant_id_arg,
						'tracking_id' => array(
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => 'The tracking ID the referral was created with, to find a seller who just finished onboarding.',
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/request',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'forward_request' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => array(
						'environment' => $environment_arg,
						'merchant_id' => array_merge( $merchant_id_arg, array( 'required' => true ) ),
						'method'      => array(
							'required'    => true,
							'type'        => 'string',
							'enum'        => array( 'GET', 'POST', 'PUT', 'DELETE' ),
							'description' => 'HTTP method of the PayPal call.',
						),
						'path'        => array(
							'required'          => true,
							'type'              => 'string',
							'validate_callback' => array( $this, 'validate_path' ),
							'description'       => 'PayPal API path, with any query string. Payment Links & Buttons only.',
						),
						'body'        => array(
							'type'        => array( 'object', 'null' ),
							'default'     => null,
							'description' => 'JSON body for POST and PUT.',
						),
						'request_id'  => array(
							'type'              => 'string',
							'default'           => '',
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => 'PayPal-Request-Id idempotency key.',
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
	 * The calling blog's ID, or 0 when the request carries none.
	 *
	 * @return int
	 */
	private function site_id() {
		$site_id = Connection_Manager::get_site_id();

		return is_wp_error( $site_id ) ? 0 : (int) $site_id;
	}

	/**
	 * Only the Payment Links & Buttons API may be called on a seller's behalf.
	 *
	 * @param mixed $value The path parameter.
	 * @return bool
	 */
	public function validate_path( $value ) {
		return is_string( $value )
			&& 1 === preg_match( '#^' . preg_quote( self::PAYPAL_PAYMENT_RESOURCES_ENDPOINT, '#' ) . '(/[A-Za-z0-9-]+)?(\?[^\s]*)?$#', $value );
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

		$credentials = $this->get_platform_credentials( $environment );
		if ( is_wp_error( $credentials ) ) {
			return $credentials;
		}

		// The tracking ID is what later ties the seller back to this blog, so it
		// is issued here rather than taken from the request.
		$tracking_id             = self::TRACKING_ID_PREFIX . $this->site_id() . '-' . time();
		$referral['tracking_id'] = $tracking_id;

		$response = $this->paypal_request(
			$environment,
			$credentials,
			'POST',
			self::PAYPAL_REFERRALS_ENDPOINT,
			$referral
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = self::decode_body( $response );

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
			return new WP_Error(
				'paypal_referral_failed',
				$body['message'] ?? 'PayPal Partner Referrals API returned an error.',
				$this->paypal_error_data( $status_code, $body )
			);
		}

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
				'action_url'        => $action_url,
				'referral_id'       => $referral_id,
				'tracking_id'       => $tracking_id,
				// Public: the site puts it in the JS SDK URL, next to the seller's merchant ID.
				'partner_client_id' => $credentials['client_id'],
			)
		);
	}

	/**
	 * Report a referred seller's integration status.
	 *
	 * By tracking ID for a seller who just finished onboarding, since PayPal's
	 * THIRD_PARTY flow hands the site nothing else to identify them by; by
	 * merchant ID afterwards.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error PayPal's merchant integration, or WP_Error.
	 */
	public function get_merchant_integration_status( WP_REST_Request $request ) {
		$environment = $request->get_param( 'environment' );
		$merchant_id = (string) $request->get_param( 'merchant_id' );
		$tracking_id = (string) $request->get_param( 'tracking_id' );
		$site_id     = $this->site_id();

		$credentials = $this->get_platform_credentials( $environment );
		if ( is_wp_error( $credentials ) ) {
			return $credentials;
		}

		if ( '' === $merchant_id && '' === $tracking_id ) {
			return new WP_Error(
				'paypal_merchant_unspecified',
				'A merchant ID or a tracking ID is required.',
				array( 'status' => 400 )
			);
		}

		if ( '' === $merchant_id ) {
			// A tracking ID issued for another blog names a seller this site never referred.
			if ( ! $this->tracking_id_belongs_to_site( $tracking_id, $site_id ) ) {
				return $this->merchant_not_for_site_error();
			}

			$merchant_id = $this->find_merchant_id_by_tracking_id( $environment, $credentials, $tracking_id );
			if ( is_wp_error( $merchant_id ) ) {
				return $merchant_id;
			}
		}

		$integration = $this->get_merchant_integration( $environment, $credentials, $merchant_id );
		if ( is_wp_error( $integration ) ) {
			return $integration;
		}

		if ( ! $this->tracking_id_belongs_to_site( $integration['tracking_id'] ?? '', $site_id ) ) {
			return $this->merchant_not_for_site_error();
		}

		$this->remember_merchant_binding( $environment, $site_id, $merchant_id );

		return rest_ensure_response( $integration );
	}

	/**
	 * Make one Payment Links & Buttons call on a referred seller's behalf.
	 *
	 * The call is signed with Automattic's platform token and a PayPal-Auth-Assertion
	 * naming the seller. PayPal's status and body come back as they are: the site
	 * already knows how to read them, and its own error messages depend on them.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error {status, body} on any PayPal answer, WP_Error when PayPal could not be reached.
	 */
	public function forward_request( WP_REST_Request $request ) {
		$environment = $request->get_param( 'environment' );
		$merchant_id = (string) $request->get_param( 'merchant_id' );
		$site_id     = $this->site_id();

		$credentials = $this->get_platform_credentials( $environment );
		if ( is_wp_error( $credentials ) ) {
			return $credentials;
		}

		$bound = $this->assert_merchant_belongs_to_site( $environment, $credentials, $merchant_id, $site_id );
		if ( is_wp_error( $bound ) ) {
			return $bound;
		}

		$headers = array(
			'PayPal-Auth-Assertion' => self::build_auth_assertion( $credentials['client_id'], $merchant_id ),
		);

		$request_id = (string) $request->get_param( 'request_id' );
		if ( '' !== $request_id ) {
			$headers['PayPal-Request-Id'] = $request_id;
		}

		$response = $this->paypal_request(
			$environment,
			$credentials,
			$request->get_param( 'method' ),
			$request->get_param( 'path' ),
			$request->get_param( 'body' ),
			$headers
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return rest_ensure_response(
			array(
				'status' => (int) wp_remote_retrieve_response_code( $response ),
				'body'   => (string) wp_remote_retrieve_body( $response ),
			)
		);
	}

	/**
	 * The PayPal-Auth-Assertion header value for acting on a seller's behalf.
	 *
	 * An unsigned JWT ("alg": "none") naming the partner's client ID as issuer and
	 * the seller as payer, per PayPal's third-party integration contract.
	 *
	 * @param string $client_id   The platform client ID.
	 * @param string $merchant_id The seller's PayPal merchant ID.
	 * @return string
	 */
	public static function build_auth_assertion( $client_id, $merchant_id ) {
		// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- JWT segments, as PayPal specifies.
		$header  = base64_encode( wp_json_encode( array( 'alg' => 'none' ), JSON_UNESCAPED_SLASHES ) );
		$payload = base64_encode(
			wp_json_encode(
				array(
					'iss'      => $client_id,
					'payer_id' => $merchant_id,
				),
				JSON_UNESCAPED_SLASHES
			)
		);
		// phpcs:enable

		return $header . '.' . $payload . '.';
	}

	/**
	 * Whether a tracking ID was issued for this blog.
	 *
	 * @param string $tracking_id A referral tracking ID.
	 * @param int    $site_id     The calling blog's ID.
	 * @return bool
	 */
	private function tracking_id_belongs_to_site( $tracking_id, $site_id ) {
		return 0 === strpos( (string) $tracking_id, self::TRACKING_ID_PREFIX . $site_id . '-' );
	}

	/**
	 * The error for a merchant this blog did not refer.
	 *
	 * @return WP_Error
	 */
	private function merchant_not_for_site_error() {
		return new WP_Error(
			'paypal_merchant_not_for_site',
			'This PayPal account was not connected through this site.',
			array( 'status' => 403 )
		);
	}

	/**
	 * Refuse to act for a seller this blog did not refer.
	 *
	 * The blog token proves which site is calling, not which seller it may act
	 * for, so the seller's integration record is checked for this blog's tracking
	 * ID. A verified pair is remembered so the check is not a PayPal call on every
	 * button operation.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @param array  $credentials Platform credentials.
	 * @param string $merchant_id The seller's PayPal merchant ID.
	 * @param int    $site_id     The calling blog's ID.
	 * @return true|WP_Error
	 */
	private function assert_merchant_belongs_to_site( $environment, $credentials, $merchant_id, $site_id ) {
		if ( '' === $merchant_id ) {
			return $this->merchant_not_for_site_error();
		}

		if ( get_transient( $this->merchant_binding_key( $environment, $site_id, $merchant_id ) ) ) {
			return true;
		}

		$integration = $this->get_merchant_integration( $environment, $credentials, $merchant_id );
		if ( is_wp_error( $integration ) ) {
			return $integration;
		}

		if ( ! $this->tracking_id_belongs_to_site( $integration['tracking_id'] ?? '', $site_id ) ) {
			return $this->merchant_not_for_site_error();
		}

		$this->remember_merchant_binding( $environment, $site_id, $merchant_id );

		return true;
	}

	/**
	 * Remember that a seller was referred by a blog.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @param int    $site_id     The blog's ID.
	 * @param string $merchant_id The seller's PayPal merchant ID.
	 */
	private function remember_merchant_binding( $environment, $site_id, $merchant_id ) {
		set_transient( $this->merchant_binding_key( $environment, $site_id, $merchant_id ), 1, self::MERCHANT_BINDING_TTL );
	}

	/**
	 * Transient key for one blog-to-merchant binding.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @param int    $site_id     The blog's ID.
	 * @param string $merchant_id The seller's PayPal merchant ID.
	 * @return string
	 */
	private function merchant_binding_key( $environment, $site_id, $merchant_id ) {
		return 'paypal_platform_merchant_' . md5( $environment . '|' . $site_id . '|' . $merchant_id );
	}

	/**
	 * Find the merchant ID behind a tracking ID.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @param array  $credentials Platform credentials.
	 * @param string $tracking_id The referral's tracking ID.
	 * @return string|WP_Error
	 */
	private function find_merchant_id_by_tracking_id( $environment, $credentials, $tracking_id ) {
		$response = $this->paypal_request(
			$environment,
			$credentials,
			'GET',
			sprintf( self::PAYPAL_MERCHANT_INTEGRATIONS_ENDPOINT, $credentials['partner_merchant_id'] ) . '?tracking_id=' . rawurlencode( $tracking_id )
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = self::decode_body( $response );

		if ( 200 !== $status_code || empty( $body['merchant_id'] ) ) {
			// PayPal answers 404 until the seller has finished, so the caller can retry.
			return new WP_Error(
				'paypal_merchant_not_found',
				'PayPal has no seller for this onboarding session yet.',
				$this->paypal_error_data( 200 === $status_code ? 404 : $status_code, $body )
			);
		}

		return (string) $body['merchant_id'];
	}

	/**
	 * Read a seller's integration record.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @param array  $credentials Platform credentials.
	 * @param string $merchant_id The seller's PayPal merchant ID.
	 * @return array|WP_Error PayPal's merchant integration body.
	 */
	private function get_merchant_integration( $environment, $credentials, $merchant_id ) {
		$response = $this->paypal_request(
			$environment,
			$credentials,
			'GET',
			sprintf( self::PAYPAL_MERCHANT_INTEGRATIONS_ENDPOINT, $credentials['partner_merchant_id'] ) . '/' . rawurlencode( $merchant_id )
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = self::decode_body( $response );

		if ( 200 !== $status_code || array() === $body ) {
			return new WP_Error(
				'paypal_merchant_status_error',
				'Could not retrieve merchant integration status from PayPal.',
				$this->paypal_error_data( $status_code, $body )
			);
		}

		return $body;
	}

	/**
	 * PayPal's JSON body as an array; anything that is not a JSON object reads as empty.
	 *
	 * @param array $response The wp_remote_request() response.
	 * @return array
	 */
	private static function decode_body( $response ) {
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		return is_array( $body ) ? $body : array();
	}

	/**
	 * Error data carrying PayPal's diagnostics through to the site.
	 *
	 * @param int   $status_code PayPal's HTTP status.
	 * @param array $body        PayPal's decoded error body.
	 * @return array
	 */
	private function paypal_error_data( $status_code, array $body ) {
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

		return $error_data;
	}

	/**
	 * Make one authenticated call to PayPal with the platform token.
	 *
	 * @param string     $environment   'sandbox' or 'production'.
	 * @param array      $credentials   Platform credentials.
	 * @param string     $method        HTTP method.
	 * @param string     $path          API path, with any query string.
	 * @param array|null $body          JSON body for POST and PUT.
	 * @param array      $extra_headers Headers added to the standard set.
	 * @return array|WP_Error The wp_remote_request() response, or WP_Error (502) when PayPal was unreachable.
	 */
	private function paypal_request( $environment, $credentials, $method, $path, $body = null, $extra_headers = array() ) {
		$base_url = $this->base_url( $environment );

		$token = $this->get_paypal_access_token( $environment, $base_url, $credentials['client_id'], $credentials['client_secret'] );
		if ( is_wp_error( $token ) ) {
			return $token;
		}

		$args = array(
			'method'  => $method,
			'timeout' => 30,
			'headers' => array_merge(
				array(
					'Authorization' => 'Bearer ' . $token,
					'Content-Type'  => 'application/json',
					'Accept'        => 'application/json',
				),
				$extra_headers
			),
		);

		if ( null !== $body && in_array( $method, array( 'POST', 'PUT' ), true ) ) {
			$args['body'] = wp_json_encode( $body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		}

		$response = wp_remote_request( $base_url . $path, $args );

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'paypal_request_failed',
				$response->get_error_message(),
				array( 'status' => 502 )
			);
		}

		return $response;
	}

	/**
	 * PayPal's API host for an environment.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @return string
	 */
	private function base_url( $environment ) {
		return 'production' === $environment
			? self::PAYPAL_PRODUCTION_BASE_URL
			: self::PAYPAL_SANDBOX_BASE_URL;
	}

	/**
	 * Get Automattic's PayPal platform credentials for the given environment.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @return array|WP_Error Array with 'client_id', 'client_secret' and 'partner_merchant_id', or WP_Error.
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
	 * Transient key for the cached platform token of one environment.
	 *
	 * @param string $environment 'sandbox' or 'production'.
	 * @return string
	 */
	public static function token_cache_key( $environment ) {
		return 'paypal_platform_token_' . $environment;
	}

	/**
	 * Get a PayPal OAuth access token using client credentials grant.
	 *
	 * Cached until shortly before it expires: with every button operation now
	 * passing through here, a token exchange per call would double the traffic.
	 *
	 * @param string $environment   'sandbox' or 'production'.
	 * @param string $base_url      PayPal API base URL.
	 * @param string $client_id     Platform client ID.
	 * @param string $client_secret Platform client secret.
	 * @return string|WP_Error Access token string, or WP_Error.
	 */
	private function get_paypal_access_token( $environment, $base_url, $client_id, $client_secret ) {
		$cached = get_transient( self::token_cache_key( $environment ) );
		if ( is_string( $cached ) && '' !== $cached ) {
			return $cached;
		}

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
		$data        = self::decode_body( $response );

		if ( 200 !== $status_code || empty( $data['access_token'] ) ) {
			return new WP_Error(
				'paypal_token_error',
				'Failed to obtain PayPal access token with platform credentials.',
				array( 'status' => 502 )
			);
		}

		$expires_in = isset( $data['expires_in'] ) ? (int) $data['expires_in'] : 0;
		if ( $expires_in > self::TOKEN_EXPIRY_BUFFER ) {
			set_transient( self::token_cache_key( $environment ), $data['access_token'], $expires_in - self::TOKEN_EXPIRY_BUFFER );
		}

		return $data['access_token'];
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding' );
