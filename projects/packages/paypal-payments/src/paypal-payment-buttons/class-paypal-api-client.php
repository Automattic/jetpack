<?php
/**
 * PayPal Pay Links & Buttons API client.
 *
 * Provides typed CRUD operations for the /v1/checkout/payment-resources
 * endpoint. All requests are authenticated via PayPal_OAuth and include
 * a PayPal-Request-Id header for idempotency.
 *
 * Note: The PayPal-Partner-Attribution-Id header is NOT supported on
 * Payment Links API endpoints. BN code attribution is applied via the
 * `at_code` query parameter on payment link URLs instead (see
 * PayPal_Payment_Buttons::render_api_managed_button).
 *
 * Updated for WOOPTP-151: Token auto-refresh on 403 with retry,
 * network timeout handling with exponential backoff, and PayPal
 * URL domain whitelist validation.
 *
 * @package automattic/jetpack-paypal-payments
 * @since 0.7.0
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PayPal_API_Client
 *
 * Wraps PayPal's Pay Links & Buttons API with typed methods for
 * creating, listing, getting, updating, and deleting payment resources.
 */
class PayPal_API_Client {

	/**
	 * Payment resources API endpoint path.
	 *
	 * @var string
	 */
	const RESOURCES_ENDPOINT = '/v1/checkout/payment-resources';

	/**
	 * Default timeout for API requests in seconds.
	 *
	 * @var int
	 */
	const REQUEST_TIMEOUT = 30;

	/**
	 * Maximum number of retry attempts for server errors.
	 *
	 * @var int
	 */
	const MAX_RETRIES = 3;

	/**
	 * Base delay in seconds for exponential backoff.
	 *
	 * @var float
	 */
	const BACKOFF_BASE_SECONDS = 1.0;

	/**
	 * Allowed PayPal domains for payment link URLs.
	 *
	 * @var array
	 */
	const ALLOWED_PAYPAL_DOMAINS = array(
		'www.paypal.com',
		'www.sandbox.paypal.com',
		'paypal.com',
		'sandbox.paypal.com',
	);

	/**
	 * Create a payment resource (button/link).
	 *
	 * @param array $resource_data {
	 *     Payment resource data.
	 *
	 *     @type string $type             Payment type. Currently only 'BUY_NOW'.
	 *     @type string $integration_mode 'LINK' or 'BUTTON'.
	 *     @type string $reusable         'MULTIPLE' (default) -- link reusable.
	 *     @type string $return_url       Optional redirect after payment.
	 *     @type array  $line_items       Required. Array of line item objects.
	 * }
	 * @return array|\WP_Error Decoded response body on success (HTTP 201), WP_Error on failure.
	 */
	public static function create_resource( $resource_data ) {
		$result = self::make_request_with_retry(
			'POST',
			self::RESOURCES_ENDPOINT,
			$resource_data,
			201
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Extract payment_link from HATEOAS links array to top-level field.
		$result = self::extract_payment_link( $result );

		// Validate payment_link domain if present.
		if ( ! empty( $result['payment_link'] ) ) {
			$validation = self::validate_paypal_url( $result['payment_link'] );
			if ( is_wp_error( $validation ) ) {
				return $validation;
			}
		}

		return $result;
	}

	/**
	 * List payment resources with optional pagination.
	 *
	 * @param int    $page_size  Number of results per page. Default 10.
	 * @param string $page_token Pagination cursor from a previous response. Default empty.
	 * @return array|\WP_Error Decoded response body on success (HTTP 200), WP_Error on failure.
	 */
	public static function list_resources( $page_size = 10, $page_token = '' ) {
		$query_args = array(
			'page_size' => absint( $page_size ),
		);

		if ( ! empty( $page_token ) ) {
			$query_args['page_token'] = sanitize_text_field( $page_token );
		}

		$endpoint = add_query_arg( $query_args, self::RESOURCES_ENDPOINT );

		return self::make_request_with_retry( 'GET', $endpoint, null, 200 );
	}

	/**
	 * Get a single payment resource by ID.
	 *
	 * @param string $resource_id PayPal resource ID (format: PLB-XXXXXXXXXXXX).
	 * @return array|\WP_Error Decoded response body on success (HTTP 200), WP_Error on failure.
	 */
	public static function get_resource( $resource_id ) {
		$resource_id = self::sanitize_resource_id( $resource_id );
		if ( is_wp_error( $resource_id ) ) {
			return $resource_id;
		}

		$result = self::make_request_with_retry(
			'GET',
			self::RESOURCES_ENDPOINT . '/' . $resource_id,
			null,
			200
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Extract payment_link from HATEOAS links array to top-level field.
		$result = self::extract_payment_link( $result );

		// Validate payment_link domain if present.
		if ( ! empty( $result['payment_link'] ) ) {
			$validation = self::validate_paypal_url( $result['payment_link'] );
			if ( is_wp_error( $validation ) ) {
				return $validation;
			}
		}

		return $result;
	}

	/**
	 * Update a payment resource (full replacement via PUT).
	 *
	 * @param string $resource_id   PayPal resource ID (format: PLB-XXXXXXXXXXXX).
	 * @param array  $resource_data Complete updated resource data (same schema as create).
	 * @return array|\WP_Error Decoded response body on success (HTTP 200), WP_Error on failure.
	 */
	public static function update_resource( $resource_id, $resource_data ) {
		$resource_id = self::sanitize_resource_id( $resource_id );
		if ( is_wp_error( $resource_id ) ) {
			return $resource_id;
		}

		$result = self::make_request_with_retry(
			'PUT',
			self::RESOURCES_ENDPOINT . '/' . $resource_id,
			$resource_data,
			200
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Extract payment_link from HATEOAS links array to top-level field.
		$result = self::extract_payment_link( $result );

		// Validate payment_link domain if present.
		if ( ! empty( $result['payment_link'] ) ) {
			$validation = self::validate_paypal_url( $result['payment_link'] );
			if ( is_wp_error( $validation ) ) {
				return $validation;
			}
		}

		return $result;
	}

	/**
	 * Delete a payment resource.
	 *
	 * @param string $resource_id PayPal resource ID (format: PLB-XXXXXXXXXXXX).
	 * @return true|\WP_Error True on success (HTTP 204), WP_Error on failure.
	 */
	public static function delete_resource( $resource_id ) {
		$resource_id = self::sanitize_resource_id( $resource_id );
		if ( is_wp_error( $resource_id ) ) {
			return $resource_id;
		}

		$result = self::make_request_with_retry(
			'DELETE',
			self::RESOURCES_ENDPOINT . '/' . $resource_id,
			null,
			204
		);

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return true;
	}

	/**
	 * Make a request with automatic retry logic.
	 *
	 * Handles two retry scenarios:
	 * 1. 401/403 errors: refresh the OAuth token and retry once.
	 * 2. 500/502/503 errors: retry with exponential backoff (up to MAX_RETRIES).
	 * 3. Network timeouts: retry with exponential backoff (up to MAX_RETRIES).
	 *
	 * @param string     $method          HTTP method (GET, POST, PUT, DELETE).
	 * @param string     $endpoint        API endpoint path.
	 * @param array|null $body            Request body data.
	 * @param int        $expected_status Expected HTTP status code for success.
	 * @return array|null|\WP_Error Decoded response body, null for 204, or WP_Error.
	 */
	private static function make_request_with_retry( $method, $endpoint, $body, $expected_status ) {
		$last_error   = null;
		$auth_retried = false;

		// Generate a single request ID for all retry attempts to ensure idempotency.
		$request_id = wp_generate_uuid4();

		for ( $attempt = 0; $attempt <= self::MAX_RETRIES; $attempt++ ) {
			$result = self::make_request( $method, $endpoint, $body, $expected_status, $request_id );

			// Success — return immediately.
			if ( ! is_wp_error( $result ) ) {
				return $result;
			}

			$error_code = $result->get_error_code();
			$error_data = $result->get_error_data();
			$status     = isset( $error_data['status'] ) ? (int) $error_data['status'] : 0;

			// Auth failure (401/403) — refresh token and retry exactly once.
			if ( in_array( $status, array( 401, 403 ), true ) && ! $auth_retried ) {
				$auth_retried = true;
				PayPal_OAuth::clear_cached_token();

				// Verify we can still get a token before retrying.
				$token = PayPal_OAuth::get_access_token();
				if ( is_wp_error( $token ) ) {
					return $result; // Return original error — re-auth failed.
				}

				// Retry the request with the fresh token (don't increment attempt).
				// Use a new request ID since this is a distinct attempt after re-auth.
				$retry_result = self::make_request( $method, $endpoint, $body, $expected_status, wp_generate_uuid4() );
				if ( ! is_wp_error( $retry_result ) ) {
					return $retry_result;
				}

				// If the retry also fails with 403, it's a permissions issue, not token expiry.
				$retry_data   = $retry_result->get_error_data();
				$retry_status = isset( $retry_data['status'] ) ? (int) $retry_data['status'] : 0;
				if ( 403 === $retry_status ) {
					return new \WP_Error(
						'paypal_api_not_authorized',
						__( 'Your PayPal account is not authorized for Payment Links & Buttons. Please verify this feature is enabled in your PayPal Developer Dashboard.', 'jetpack-paypal-payments' ),
						array( 'status' => 403 )
					);
				}

				return $retry_result;
			}

			// Server error or network timeout — retry with backoff.
			$is_server_error  = in_array( $status, array( 500, 502, 503 ), true );
			$is_network_error = 'paypal_api_request_failed' === $error_code;
			$is_timeout       = 'paypal_api_timeout' === $error_code;

			if ( ( $is_server_error || $is_network_error || $is_timeout ) && $attempt < self::MAX_RETRIES ) {
				$last_error = $result;
				$delay      = self::BACKOFF_BASE_SECONDS * pow( 2, $attempt );
				// phpcs:ignore WordPress.WP.AlternativeFunctions.sleep_usleep -- Intentional backoff delay.
				usleep( (int) ( $delay * 1000000 ) );
				continue;
			}

			// Non-retryable error (400, 404, 422, etc.) — return immediately.
			return $result;
		}

		// All retries exhausted — return the last error.
		if ( $last_error ) {
			return $last_error;
		}

		return new \WP_Error(
			'paypal_api_retry_exhausted',
			__( 'PayPal is temporarily unavailable after multiple attempts. Please try again later.', 'jetpack-paypal-payments' ),
			array( 'status' => 503 )
		);
	}

	/**
	 * Make an authenticated request to the PayPal API.
	 *
	 * Handles token retrieval, header construction, response validation,
	 * and error mapping. Includes PayPal-Request-Id for idempotency.
	 *
	 * Note: PayPal-Partner-Attribution-Id is NOT supported on Payment Links
	 * API endpoints. BN code attribution is handled via the `at_code` query
	 * parameter on payment link URLs in the render layer.
	 *
	 * @param string     $method          HTTP method (GET, POST, PUT, DELETE).
	 * @param string     $endpoint        API endpoint path (appended to base URL).
	 * @param array|null $body            Request body data (JSON-encoded for POST/PUT).
	 * @param int        $expected_status Expected HTTP status code for success.
	 * @param string     $request_id      Optional. Idempotency key. Auto-generated if empty.
	 * @return array|null|\WP_Error Decoded response body, null for 204, or WP_Error.
	 */
	private static function make_request( $method, $endpoint, $body, $expected_status, $request_id = '' ) {
		$token = PayPal_OAuth::get_access_token();
		if ( is_wp_error( $token ) ) {
			return $token;
		}

		$url = PayPal_OAuth::get_base_url() . $endpoint;

		// Generate a unique request ID for idempotency if not provided.
		if ( empty( $request_id ) ) {
			$request_id = wp_generate_uuid4();
		}

		$args = array(
			'method'  => $method,
			'timeout' => self::REQUEST_TIMEOUT,
			'headers' => array(
				'Authorization'     => 'Bearer ' . $token,
				'Content-Type'      => 'application/json',
				'Accept'            => 'application/json',
				'PayPal-Request-Id' => $request_id,
			),
		);

		if ( null !== $body && in_array( $method, array( 'POST', 'PUT' ), true ) ) {
			$args['body'] = wp_json_encode( $body, JSON_UNESCAPED_SLASHES );
		}

		$response = wp_remote_request( $url, $args );

		if ( is_wp_error( $response ) ) {
			$message = $response->get_error_message();

			// Distinguish timeouts from other network errors for retry logic.
			$is_timeout = false !== strpos( strtolower( $message ), 'timeout' )
				|| false !== strpos( strtolower( $message ), 'timed out' );

			return new \WP_Error(
				$is_timeout ? 'paypal_api_timeout' : 'paypal_api_request_failed',
				$is_timeout
					? __( 'The request to PayPal timed out. Please try again.', 'jetpack-paypal-payments' )
					: sprintf(
						/* translators: %s: error message from the HTTP request */
						__( 'PayPal API request failed: %s', 'jetpack-paypal-payments' ),
						$message
					),
				array( 'status' => 0 )
			);
		}

		$status_code = wp_remote_retrieve_response_code( $response );

		// Success path.
		if ( $status_code === $expected_status ) {
			// 204 No Content has no body.
			if ( 204 === $status_code ) {
				return null;
			}

			$response_body = wp_remote_retrieve_body( $response );
			$data          = json_decode( $response_body, true );

			if ( null === $data && '' !== $response_body ) {
				return new \WP_Error(
					'paypal_api_invalid_json',
					__( 'PayPal returned a response that could not be parsed as JSON.', 'jetpack-paypal-payments' ),
					array( 'status' => $status_code )
				);
			}

			return $data;
		}

		// Error path — map PayPal error response to WP_Error.
		return self::parse_error_response( $response, $status_code );
	}

	/**
	 * Parse a PayPal error response into a WP_Error.
	 *
	 * Maps PayPal's standard error response format to descriptive WP_Error
	 * codes and messages. Never exposes raw API error details to merchants.
	 *
	 * @param array|WP_Error $response    The wp_remote_request response.
	 * @param int            $status_code The HTTP status code.
	 * @return \WP_Error The parsed error.
	 */
	private static function parse_error_response( $response, $status_code ) {
		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		// PayPal error response shape: { name, message, details[] }
		$error_name    = isset( $data['name'] ) ? sanitize_text_field( $data['name'] ) : 'UNKNOWN_ERROR';
		$error_message = isset( $data['message'] ) ? sanitize_text_field( $data['message'] ) : '';
		$error_details = isset( $data['details'] ) && is_array( $data['details'] ) ? $data['details'] : array();

		// Build a human-readable message (never raw API text).
		$message = self::get_user_friendly_message( $status_code, $error_name, $error_message, $error_details );

		return new \WP_Error(
			'paypal_api_' . strtolower( $error_name ),
			$message,
			array(
				'status'      => $status_code,
				'paypal_name' => $error_name,
				'details'     => $error_details,
			)
		);
	}

	/**
	 * Get a user-friendly error message for a PayPal API error.
	 *
	 * Maps each HTTP status / error name to a clear, actionable message
	 * that a non-technical merchant can understand. Never surfaces raw
	 * API error strings.
	 *
	 * @param int    $status_code   HTTP status code.
	 * @param string $error_name    PayPal error name.
	 * @param string $error_message PayPal error message (used only for 400/422 detail).
	 * @param array  $error_details PayPal error details array.
	 * @return string Formatted error message.
	 */
	private static function get_user_friendly_message( $status_code, $error_name, $error_message, $error_details = array() ) {
		switch ( $status_code ) {
			case 400:
				// INVALID_REQUEST — try to extract field-level detail.
				$field_errors = self::extract_field_errors( $error_details );
				if ( ! empty( $field_errors ) ) {
					return sprintf(
						/* translators: %s: comma-separated list of field validation errors */
						__( 'Please fix the following: %s', 'jetpack-paypal-payments' ),
						implode( '; ', $field_errors )
					);
				}
				return __( 'The request contains invalid data. Please check your input and try again.', 'jetpack-paypal-payments' );

			case 401:
				// Token may have expired between cache and use.
				PayPal_OAuth::clear_cached_token();
				return __( 'PayPal authentication expired. Please try again.', 'jetpack-paypal-payments' );

			case 403:
				// NOT_AUTHORIZED — account-level issue.
				return __( 'Your PayPal account is not authorized for Payment Links & Buttons. Please verify this feature is enabled in your PayPal Developer Dashboard.', 'jetpack-paypal-payments' );

			case 404:
				// RESOURCE_NOT_FOUND — stale button ID.
				return __( 'This PayPal button no longer exists. It may have been deleted from PayPal. Please create a new button.', 'jetpack-paypal-payments' );

			case 422:
				// UNPROCESSABLE_ENTITY — business rule violation.
				$field_errors = self::extract_field_errors( $error_details );
				if ( ! empty( $field_errors ) ) {
					return sprintf(
						/* translators: %s: comma-separated list of validation errors */
						__( 'PayPal could not process your request: %s', 'jetpack-paypal-payments' ),
						implode( '; ', $field_errors )
					);
				}
				return __( 'PayPal could not process your request. Please check the amount and currency and try again.', 'jetpack-paypal-payments' );

			case 429:
				return __( 'Too many requests. Please wait a moment and try again.', 'jetpack-paypal-payments' );

			case 500:
			case 502:
			case 503:
				return __( 'PayPal is temporarily unavailable. Please try again in a few moments.', 'jetpack-paypal-payments' );

			default:
				return __( 'An unexpected error occurred while communicating with PayPal. Please try again.', 'jetpack-paypal-payments' );
		}
	}

	/**
	 * Extract field-level error descriptions from PayPal error details.
	 *
	 * PayPal's detail objects have the shape:
	 *   { field: "/line_items/0/name", issue: "MISSING_REQUIRED_PARAMETER", description: "..." }
	 *
	 * We extract human-readable descriptions, sanitizing each one.
	 *
	 * @param array $details PayPal error details array.
	 * @return array List of sanitized error description strings.
	 */
	private static function extract_field_errors( array $details ) {
		$errors = array();

		foreach ( $details as $detail ) {
			if ( ! empty( $detail['description'] ) ) {
				$errors[] = sanitize_text_field( $detail['description'] );
			} elseif ( ! empty( $detail['issue'] ) ) {
				// Fallback to issue name, made more readable.
				$errors[] = str_replace( '_', ' ', strtolower( sanitize_text_field( $detail['issue'] ) ) );
			}
		}

		return $errors;
	}

	/**
	 * Validate that a URL belongs to an allowed PayPal domain.
	 *
	 * Prevents accepting payment links from non-PayPal domains,
	 * which could indicate a compromised API response.
	 *
	 * @param string $url The URL to validate.
	 * @return true|\WP_Error True if valid, WP_Error if the domain is not allowed.
	 */
	private static function validate_paypal_url( $url ) {
		$parsed = wp_parse_url( $url );

		if ( empty( $parsed['host'] ) ) {
			return new \WP_Error(
				'paypal_invalid_payment_link',
				__( 'PayPal returned an invalid payment link URL.', 'jetpack-paypal-payments' ),
				array( 'status' => 502 )
			);
		}

		// Validate the scheme is HTTPS.
		if ( empty( $parsed['scheme'] ) || 'https' !== strtolower( $parsed['scheme'] ) ) {
			return new \WP_Error(
				'paypal_insecure_payment_link',
				__( 'PayPal returned a non-HTTPS payment link, which is not allowed.', 'jetpack-paypal-payments' ),
				array( 'status' => 502 )
			);
		}

		$host = strtolower( $parsed['host'] );

		if ( ! in_array( $host, self::ALLOWED_PAYPAL_DOMAINS, true ) ) {
			return new \WP_Error(
				'paypal_untrusted_domain',
				__( 'PayPal returned a payment link from an untrusted domain.', 'jetpack-paypal-payments' ),
				array( 'status' => 502 )
			);
		}

		return true;
	}

	/**
	 * Extract the payment link URL from a PayPal API response's links array.
	 *
	 * PayPal returns HATEOAS links as an array of objects with rel/href/method.
	 * The payment link has rel="payment_link". This method finds it and promotes
	 * it to a top-level `payment_link` field on the response array.
	 *
	 * @param array $result The decoded PayPal API response.
	 * @return array The response with `payment_link` added as a top-level field.
	 */
	private static function extract_payment_link( $result ) {
		if ( ! empty( $result['links'] ) && is_array( $result['links'] ) ) {
			foreach ( $result['links'] as $link ) {
				if ( isset( $link['rel'] ) && 'payment_link' === $link['rel'] && ! empty( $link['href'] ) ) {
					$result['payment_link'] = $link['href'];
					break;
				}
			}
		}

		return $result;
	}

	/**
	 * Sanitize and validate a PayPal resource ID.
	 *
	 * Expected format: PLB-XXXXXXXXXXXX (alphanumeric after PLB- prefix).
	 *
	 * @param string $resource_id The resource ID to validate.
	 * @return string|\WP_Error The sanitized ID, or WP_Error if invalid.
	 */
	private static function sanitize_resource_id( $resource_id ) {
		$resource_id = sanitize_text_field( $resource_id );

		if ( empty( $resource_id ) ) {
			return new \WP_Error(
				'paypal_invalid_resource_id',
				__( 'PayPal resource ID is required.', 'jetpack-paypal-payments' )
			);
		}

		// Validate format: PLB- followed by alphanumeric characters.
		if ( ! preg_match( '/^PLB-[A-Z0-9]+$/i', $resource_id ) ) {
			return new \WP_Error(
				'paypal_invalid_resource_id',
				sprintf(
					/* translators: %s: the invalid resource ID */
					__( 'Invalid PayPal resource ID format: %s. Expected format: PLB-XXXXXXXXXXXX.', 'jetpack-paypal-payments' ),
					$resource_id
				)
			);
		}

		return $resource_id;
	}
}
