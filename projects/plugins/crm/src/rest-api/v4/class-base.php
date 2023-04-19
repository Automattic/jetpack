<?php
/**
 * Jetpack CRM REST API base class.
 *
 * @package Automattic\Jetpack_CRM\REST_API
 */

namespace Automattic\Jetpack_CRM\REST_API\V4;

use Automattic\Jetpack_CRM\REST_API\Util\Authentication;
use Automattic\Jetpack_CRM\REST_API\Util\Route_Scope;
use WP_Error;

/**
 * Jetpack Partner API REST base class.
 *
 * @package Automattic\Jetpack_CRM\REST_API\V4
 */
abstract class Base {
	/**
	 * API namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'jetpack-crm/v4';

	/**
	 * API route base.
	 *
	 * This is expected to be provided by the extending class.
	 *
	 * @var string
	 */
	protected $rest_base = '';

	/**
	 * Authentication.
	 *
	 * @var Authentication
	 */
	protected $authorization;

	/**
	 * Constructor.
	 *
	 * @todo Implement a simple way to define DI dependencies?
	 * @todo Add an optional logger.
	 * @todo Remove internal error logic? Doesn't make a lot of sense if we don't have a logger.
	 */
	public function __construct() {
		$this->authorization = new Authentication();
		$scope               = new Route_Scope( $this->namespace, $this->rest_base );

		// Register routes.
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );

		// Apply authentication rules.
		add_filter(
			'rest_request_before_callbacks',
			function ( $response, $handler, $request ) use ( $scope ) {
				if ( $scope->covers( $request ) ) {
					return $this->authorization->apply_rules( $response, $request );
				}

				return $response;
			},
			100,
			3
		);

		// Filter out internal errors and replace them with generic ones.
		add_filter(
			'rest_request_after_callbacks',
			function ( $response, $handler, $request ) use ( $scope ) {
				if ( $scope->covers( $request ) ) {
					return $this->filter_internal_errors( $response );
				}

				return $response;
			},
			// Make sure this runs before authentication data is cleared (priority 9).
			8,
			3
		);

		// Replace WP_Error responses with WP_REST_Response responses for convenience.
		add_filter(
			'rest_request_after_callbacks',
			function ( $response, $handler, $request ) use ( $scope ) {
				if ( $scope->covers( $request ) ) {
					return $this->filter_errors_to_responses( $response );
				}

				return $response;
			},
			// Make sure this runs before authentication data is cleared (priority 9).
			8,
			3
		);
	}

	/**
	 * Filter out internal errors request and replace them with generic ones.
	 *
	 * @param mixed $response Response to filter.
	 * @return mixed
	 */
	public function filter_internal_errors( $response ) {
		if ( ! is_wp_error( $response ) || $response->get_error_code() !== 'internal_error' ) {
			return $response;
		}

		return new WP_Error(
			$response->get_error_code(),
			$response->get_error_message(),
			$response->get_error_data()
		);
	}

	/**
	 * Convert WP_Error responses to WP_REST_Response instances.
	 *
	 * We convert errors to REST responses, so we can still add headers to the response.
	 *
	 * @param mixed $response Response to filter.
	 * @return mixed
	 */
	public function filter_errors_to_responses( $response ) {
		if ( is_wp_error( $response ) ) {
			return rest_convert_error_to_response( $response );
		}

		return $response;
	}

	/**
	 * Get an invalid argument WP_Error instance.
	 *
	 * This is useful in cases where we need to emulate the invalid parameter error, so we don't leak that the
	 * argument value exists but the partner is not authorized to use it.
	 *
	 * @param string $argument Argument to create an error for.
	 * @return WP_Error
	 */
	protected function get_invalid_argument_error( string $argument ): WP_Error {
		return new WP_Error(
			'rest_invalid_param',
			'Invalid parameter(s): ' . $argument,
			array(
				'status'  => 400,
				'params'  => array( $argument => 'Invalid parameter.' ),
				'details' => array(),
			)
		);
	}

	/**
	 * Get a not found WP_Error instance.
	 *
	 * This is useful for generating emulated not found entity errors on a list of entities response.
	 *
	 * @return WP_Error
	 */
	protected function get_not_found_error(): WP_Error {
		return new WP_Error(
			'not_found',
			__( 'Not found.', 'zero-bs-crm' ),
			array(
				'status' => 404,
			)
		);
	}

	/**
	 * Get an internal error WP_Error instance.
	 *
	 * This is useful in cases where we need to log a detailed internal error, but we want to return a generic
	 * error to the API consumer.
	 *
	 * @param WP_Error $original_error Original internal error to log and obfuscate.
	 * @param array    $data Optional extra data to inject into the returned error for convenience.
	 * @return WP_Error
	 */
	protected function get_internal_error( WP_Error $original_error, array $data = array() ): WP_Error {
		return new WP_Error(
			'internal_error',
			'An internal error has occurred. Please reach out to your support contact.',
			array_merge(
				$data,
				array(
					'status'         => 500,
					'internal_error' => $original_error,
				)
			)
		);
	}
}
