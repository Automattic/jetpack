<?php
/**
 * REST API controller for PayPal Payment Buttons.
 *
 * Provides endpoints for PayPal OAuth connection management
 * and PayPal Pay Links & Buttons API operations.
 *
 * Updated for WOOPTP-151: Server-side validation via PayPal_Attribute_Mapper
 * before all API calls, enhanced error responses, and 404 stale resource handling.
 *
 * @package automattic/jetpack-paypal-payments
 * @since 0.7.0
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class PayPal_REST_Controller
 *
 * Registers and handles WordPress REST API endpoints for
 * PayPal OAuth connection and button management.
 */
class PayPal_REST_Controller {

	/**
	 * REST API namespace.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack/v4';

	/**
	 * REST API route base for PayPal operations.
	 *
	 * @var string
	 */
	const ROUTE_BASE = '/paypal';

	/**
	 * Register REST API routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		// Connection management.
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE_BASE . '/connect',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'handle_connect' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission_check' ),
					'args'                => array(
						'client_id'     => array(
							'required'          => true,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'validate_callback' => array( __CLASS__, 'validate_non_empty_string' ),
							'description'       => __( 'PayPal OAuth client ID.', 'jetpack-paypal-payments' ),
						),
						'client_secret' => array(
							'required'          => true,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
							'validate_callback' => array( __CLASS__, 'validate_non_empty_string' ),
							'description'       => __( 'PayPal OAuth client secret.', 'jetpack-paypal-payments' ),
						),
						'environment'   => array(
							'required'          => false,
							'type'              => 'string',
							'default'           => 'sandbox',
							'enum'              => array( 'sandbox', 'production' ),
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => __( 'PayPal environment: sandbox or production.', 'jetpack-paypal-payments' ),
						),
					),
				),
			)
		);

		// Connection status.
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE_BASE . '/connection',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'handle_connection_status' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission_check' ),
				),
			)
		);

		// Disconnect.
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE_BASE . '/disconnect',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'handle_disconnect' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission_check' ),
				),
			)
		);

		// --- Button CRUD endpoints ---

		// Create a payment resource (button/link).
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE_BASE . '/buttons',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'handle_create_button' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission_check' ),
					'args'                => self::get_button_create_args(),
				),
			)
		);

		// List payment resources.
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE_BASE . '/buttons',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'handle_list_buttons' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission_check' ),
					'args'                => array(
						'page_size'  => array(
							'required' => false,
							'type'     => 'integer',
							'default'  => 10,
							'minimum'  => 1,
							'maximum'  => 100,
						),
						'page_token' => array(
							'required'          => false,
							'type'              => 'string',
							'default'           => '',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);

		// Get a single payment resource.
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE_BASE . '/buttons/(?P<resource_id>PLB-[A-Za-z0-9]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'handle_get_button' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission_check' ),
				),
			)
		);

		// Update a payment resource (full replacement via PUT).
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE_BASE . '/buttons/(?P<resource_id>PLB-[A-Za-z0-9]+)',
			array(
				array(
					'methods'             => 'PUT',
					'callback'            => array( __CLASS__, 'handle_update_button' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission_check' ),
					'args'                => self::get_button_create_args(),
				),
			)
		);

		// Delete a payment resource.
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE_BASE . '/buttons/(?P<resource_id>PLB-[A-Za-z0-9]+)',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'handle_delete_button' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission_check' ),
				),
			)
		);

		// Environment switch.
		register_rest_route(
			self::REST_NAMESPACE,
			self::ROUTE_BASE . '/environment',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'handle_set_environment' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission_check' ),
					'args'                => array(
						'environment' => array(
							'required'          => true,
							'type'              => 'string',
							'enum'              => array( 'sandbox', 'production' ),
							'sanitize_callback' => 'sanitize_text_field',
							'description'       => __( 'PayPal environment: sandbox or production.', 'jetpack-paypal-payments' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check: current user can manage_options.
	 *
	 * @return bool|WP_Error True if permitted, WP_Error otherwise.
	 */
	public static function manage_options_permission_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to manage PayPal settings.', 'jetpack-paypal-payments' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Validate that a string parameter is non-empty.
	 *
	 * @param string          $value   The value to validate.
	 * @param WP_REST_Request $request The REST request.
	 * @param string          $param   The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public static function validate_non_empty_string( $value, $request, $param ) {
		if ( ! is_string( $value ) || '' === trim( $value ) ) {
			return new WP_Error(
				'rest_invalid_param',
				sprintf(
					/* translators: %s: parameter name */
					__( 'The %s parameter must be a non-empty string.', 'jetpack-paypal-payments' ),
					$param
				),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Handle POST /paypal/connect -- store credentials and validate via token exchange.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response on success, WP_Error on failure.
	 */
	public static function handle_connect( WP_REST_Request $request ) {
		$client_id     = $request->get_param( 'client_id' );
		$client_secret = $request->get_param( 'client_secret' );
		$environment   = $request->get_param( 'environment' );

		// Set environment first so token exchange uses the right base URL.
		PayPal_OAuth::set_environment( $environment );

		// Store the credentials.
		$stored = PayPal_OAuth::store_credentials( $client_id, $client_secret );
		if ( ! $stored ) {
			return new WP_Error(
				'paypal_credentials_storage_failed',
				__( 'Failed to store PayPal credentials. Please ensure your WordPress installation supports encryption (OpenSSL extension).', 'jetpack-paypal-payments' ),
				array( 'status' => 500 )
			);
		}

		// Validate by attempting a token exchange.
		$validation = PayPal_OAuth::validate_credentials();
		if ( is_wp_error( $validation ) ) {
			// Credentials are invalid — remove them.
			PayPal_OAuth::delete_credentials();

			// Provide a user-friendly message based on the error type.
			$error_data = $validation->get_error_data();
			$status     = isset( $error_data['status'] ) ? (int) $error_data['status'] : 401;

			if ( 401 === $status ) {
				$message = __( 'The Client ID or Client Secret is incorrect. Please double-check your credentials in the PayPal Developer Dashboard.', 'jetpack-paypal-payments' );
			} else {
				$message = __( 'Could not connect to PayPal. Please check your credentials and try again.', 'jetpack-paypal-payments' );
			}

			return new WP_Error(
				'paypal_credentials_invalid',
				$message,
				array( 'status' => $status )
			);
		}

		return new WP_REST_Response(
			array(
				'connected'   => true,
				'environment' => PayPal_OAuth::get_environment(),
				'message'     => __( 'PayPal account connected successfully.', 'jetpack-paypal-payments' ),
			),
			200
		);
	}

	/**
	 * Handle GET /paypal/connection -- return current connection status.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response Response with connection status.
	 */
	public static function handle_connection_status( WP_REST_Request $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return new WP_REST_Response(
			PayPal_OAuth::get_connection_status(),
			200
		);
	}

	/**
	 * Handle POST /paypal/disconnect -- remove credentials and cached token.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response Response confirming disconnection.
	 */
	public static function handle_disconnect( WP_REST_Request $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		PayPal_OAuth::disconnect();

		return new WP_REST_Response(
			array(
				'connected' => false,
				'message'   => __( 'PayPal account disconnected.', 'jetpack-paypal-payments' ),
			),
			200
		);
	}

	/**
	 * Handle POST /paypal/environment -- switch between sandbox and production.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response on success, WP_Error on failure.
	 */
	public static function handle_set_environment( WP_REST_Request $request ) {
		$environment = $request->get_param( 'environment' );

		PayPal_OAuth::set_environment( $environment );

		return new WP_REST_Response(
			array(
				'environment' => PayPal_OAuth::get_environment(),
				'message'     => sprintf(
					/* translators: %s: environment name (sandbox or production) */
					__( 'PayPal environment set to %s. Cached token has been cleared.', 'jetpack-paypal-payments' ),
					$environment
				),
			),
			200
		);
	}

	// --- Button CRUD handlers ---

	/**
	 * Handle POST /paypal/buttons -- create a payment resource via the PayPal API.
	 *
	 * Validates input via PayPal_Attribute_Mapper before calling the API.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response on success, WP_Error on failure.
	 */
	public static function handle_create_button( WP_REST_Request $request ) {
		// Server-side validation before API call.
		$validation = self::validate_button_request( $request );
		if ( is_wp_error( $validation ) ) {
			return $validation;
		}

		$resource_data = self::build_resource_data( $request );

		$result = PayPal_API_Client::create_resource( $resource_data );

		if ( is_wp_error( $result ) ) {
			return self::api_error_to_rest_error( $result );
		}

		return new WP_REST_Response( $result, 201 );
	}

	/**
	 * Handle GET /paypal/buttons -- list payment resources.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response on success, WP_Error on failure.
	 */
	public static function handle_list_buttons( WP_REST_Request $request ) {
		$page_size  = $request->get_param( 'page_size' );
		$page_token = $request->get_param( 'page_token' );

		$result = PayPal_API_Client::list_resources( $page_size, $page_token );

		if ( is_wp_error( $result ) ) {
			return self::api_error_to_rest_error( $result );
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Handle GET /paypal/buttons/{resource_id} -- get a single payment resource.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response on success, WP_Error on failure.
	 */
	public static function handle_get_button( WP_REST_Request $request ) {
		$resource_id = $request->get_param( 'resource_id' );

		$result = PayPal_API_Client::get_resource( $resource_id );

		if ( is_wp_error( $result ) ) {
			return self::api_error_to_rest_error( $result );
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Handle PUT /paypal/buttons/{resource_id} -- update a payment resource (full replacement).
	 *
	 * Validates input via PayPal_Attribute_Mapper before calling the API.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response on success, WP_Error on failure.
	 */
	public static function handle_update_button( WP_REST_Request $request ) {
		// Server-side validation before API call.
		$validation = self::validate_button_request( $request );
		if ( is_wp_error( $validation ) ) {
			return $validation;
		}

		$resource_id   = $request->get_param( 'resource_id' );
		$resource_data = self::build_resource_data( $request );

		$result = PayPal_API_Client::update_resource( $resource_id, $resource_data );

		if ( is_wp_error( $result ) ) {
			return self::api_error_to_rest_error( $result );
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Handle DELETE /paypal/buttons/{resource_id} -- delete a payment resource.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response|WP_Error Response on success, WP_Error on failure.
	 */
	public static function handle_delete_button( WP_REST_Request $request ) {
		$resource_id = $request->get_param( 'resource_id' );

		$result = PayPal_API_Client::delete_resource( $resource_id );

		if ( is_wp_error( $result ) ) {
			// If the resource is already gone (404), treat as success.
			$error_data = $result->get_error_data();
			if ( isset( $error_data['status'] ) && 404 === (int) $error_data['status'] ) {
				return new WP_REST_Response(
					array(
						'deleted'     => true,
						'resource_id' => $resource_id,
						'message'     => __( 'Payment resource was already deleted from PayPal.', 'jetpack-paypal-payments' ),
					),
					200
				);
			}

			return self::api_error_to_rest_error( $result );
		}

		return new WP_REST_Response(
			array(
				'deleted'     => true,
				'resource_id' => $resource_id,
				'message'     => __( 'Payment resource deleted successfully.', 'jetpack-paypal-payments' ),
			),
			200
		);
	}

	// --- Shared helpers ---

	/**
	 * Validate a button create/update request using PayPal_Attribute_Mapper.
	 *
	 * Extracts the line_items from the request, maps them to block attributes,
	 * and runs full validation before the API call is made. This catches
	 * issues that client-side validation might miss.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return true|WP_Error True if valid, WP_Error on validation failure.
	 */
	private static function validate_button_request( WP_REST_Request $request ) {
		$line_items = $request->get_param( 'line_items' );

		if ( empty( $line_items ) || ! is_array( $line_items ) ) {
			return new WP_Error(
				'missing_line_items',
				__( 'At least one line item is required.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		// Extract the first line item into attribute-style format for validation.
		$first_item = $line_items[0];
		$attributes = array(
			'productName' => isset( $first_item['name'] ) ? $first_item['name'] : '',
		);

		if ( isset( $first_item['unit_amount'] ) && is_array( $first_item['unit_amount'] ) ) {
			$attributes['price']        = isset( $first_item['unit_amount']['value'] ) ? $first_item['unit_amount']['value'] : '';
			$attributes['currencyCode'] = isset( $first_item['unit_amount']['currency_code'] ) ? $first_item['unit_amount']['currency_code'] : 'USD';
		}

		if ( ! empty( $first_item['description'] ) ) {
			$attributes['productDescription'] = $first_item['description'];
		}

		if ( ! empty( $first_item['image_url'] ) ) {
			$attributes['imageUrl'] = $first_item['image_url'];
		}

		$return_url = $request->get_param( 'return_url' );
		if ( ! empty( $return_url ) ) {
			$attributes['returnUrl'] = $return_url;
		}

		$validation = PayPal_Attribute_Mapper::validate_attributes( $attributes );

		if ( is_wp_error( $validation ) ) {
			// Re-wrap with status for REST response.
			$data = $validation->get_error_data();
			return new WP_Error(
				$validation->get_error_code(),
				$validation->get_error_message(),
				array( 'status' => isset( $data['status'] ) ? $data['status'] : 400 )
			);
		}

		return true;
	}

	/**
	 * Get REST API arg definitions for button create/update endpoints.
	 *
	 * Defines the line_items schema matching PayPal's Pay Links & Buttons API.
	 * Phase 1 supports BUY_NOW type with LINK integration mode.
	 *
	 * @return array REST API args definition.
	 */
	private static function get_button_create_args() {
		return array(
			'name'             => array(
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'description'       => __( 'Display name for the payment resource.', 'jetpack-paypal-payments' ),
			),
			'type'             => array(
				'required'          => false,
				'type'              => 'string',
				'default'           => 'BUY_NOW',
				'enum'              => array( 'BUY_NOW' ),
				'sanitize_callback' => 'sanitize_text_field',
				'description'       => __( 'Payment type. Currently only BUY_NOW is supported.', 'jetpack-paypal-payments' ),
			),
			'integration_mode' => array(
				'required'          => false,
				'type'              => 'string',
				'default'           => 'LINK',
				'enum'              => array( 'LINK', 'BUTTON' ),
				'sanitize_callback' => 'sanitize_text_field',
				'description'       => __( 'Integration mode. LINK returns a payment URL.', 'jetpack-paypal-payments' ),
			),
			'reusable'         => array(
				'required'          => false,
				'type'              => 'string',
				'default'           => 'MULTIPLE',
				'enum'              => array( 'MULTIPLE', 'SINGLE' ),
				'sanitize_callback' => 'sanitize_text_field',
				'description'       => __( 'Whether the link can be used multiple times.', 'jetpack-paypal-payments' ),
			),
			'return_url'       => array(
				'required'          => false,
				'type'              => 'string',
				'format'            => 'uri',
				'sanitize_callback' => 'esc_url_raw',
				'description'       => __( 'URL to redirect the buyer to after payment.', 'jetpack-paypal-payments' ),
			),
			'line_items'       => array(
				'required'    => true,
				'type'        => 'array',
				'minItems'    => 1,
				'description' => __( 'Line items for the payment resource.', 'jetpack-paypal-payments' ),
				'items'       => array(
					'type'       => 'object',
					'properties' => array(
						'name'        => array(
							'type'     => 'string',
							'required' => true,
						),
						'description' => array(
							'type'     => 'string',
							'required' => false,
						),
						'unit_amount' => array(
							'type'       => 'object',
							'required'   => true,
							'properties' => array(
								'currency_code' => array(
									'type'     => 'string',
									'required' => true,
								),
								'value'         => array(
									'type'     => 'string',
									'required' => true,
								),
							),
						),
						'quantity'    => array(
							'type'     => 'string',
							'required' => false,
							'default'  => '1',
						),
						'image_url'   => array(
							'type'   => 'string',
							'format' => 'uri',
						),
					),
				),
			),
		);
	}

	/**
	 * Build the resource data array from a REST request for PayPal API submission.
	 *
	 * Extracts and sanitizes relevant parameters, stripping null/empty optional values
	 * so only populated fields are sent to PayPal.
	 *
	 * @param WP_REST_Request $request The incoming REST request.
	 * @return array The sanitized resource data ready for the PayPal API.
	 */
	private static function build_resource_data( WP_REST_Request $request ) {
		$data = array(
			'type'             => $request->get_param( 'type' ),
			'integration_mode' => $request->get_param( 'integration_mode' ),
			'reusable'         => $request->get_param( 'reusable' ),
			'line_items'       => $request->get_param( 'line_items' ),
		);

		// Sanitize line_items deeply.
		if ( is_array( $data['line_items'] ) ) {
			$data['line_items'] = self::sanitize_line_items( $data['line_items'] );
		}

		// Add optional fields only when present.
		$name = $request->get_param( 'name' );
		if ( ! empty( $name ) ) {
			$data['name'] = $name;
		}

		$return_url = $request->get_param( 'return_url' );
		if ( ! empty( $return_url ) ) {
			$data['return_url'] = $return_url;
		}

		return $data;
	}

	/**
	 * Sanitize line items array for PayPal API submission.
	 *
	 * Applies sanitize_text_field to string values and esc_url_raw to image URLs.
	 *
	 * @param array $line_items Raw line items from the REST request.
	 * @return array Sanitized line items.
	 */
	private static function sanitize_line_items( $line_items ) {
		$sanitized = array();

		foreach ( $line_items as $item ) {
			$clean_item = array(
				'name'        => isset( $item['name'] ) ? sanitize_text_field( $item['name'] ) : '',
				'unit_amount' => array(
					'currency_code' => isset( $item['unit_amount']['currency_code'] )
						? sanitize_text_field( $item['unit_amount']['currency_code'] )
						: 'USD',
					'value'         => isset( $item['unit_amount']['value'] )
						? sanitize_text_field( $item['unit_amount']['value'] )
						: '0.00',
				),
			);

			// Optional fields.
			if ( ! empty( $item['description'] ) ) {
				$clean_item['description'] = sanitize_text_field( $item['description'] );
			}
			if ( ! empty( $item['quantity'] ) ) {
				$clean_item['quantity'] = sanitize_text_field( $item['quantity'] );
			}
			if ( ! empty( $item['image_url'] ) ) {
				$clean_item['image_url'] = esc_url_raw( $item['image_url'] );
			}

			$sanitized[] = $clean_item;
		}

		return $sanitized;
	}

	/**
	 * Convert a PayPal API WP_Error into a REST-appropriate WP_Error with HTTP status.
	 *
	 * Preserves the original error code and message, extracting the HTTP status
	 * from the error data if available.
	 *
	 * @param WP_Error $error The API client error.
	 * @return WP_Error Error with appropriate REST status code.
	 */
	private static function api_error_to_rest_error( WP_Error $error ) {
		$data   = $error->get_error_data();
		$status = isset( $data['status'] ) ? $data['status'] : 500;

		// Ensure we never return a 0 status (network errors).
		if ( 0 === $status || empty( $status ) ) {
			$status = 503;
		}

		return new WP_Error(
			$error->get_error_code(),
			$error->get_error_message(),
			array( 'status' => $status )
		);
	}
}
