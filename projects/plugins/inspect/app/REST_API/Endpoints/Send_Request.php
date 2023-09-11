<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack_Inspect\REST_API\Endpoints;

use Automattic\Jetpack_Inspect\Monitors;
use Automattic\Jetpack_Inspect\REST_API\Permissions\Current_User_Admin;
use WP_REST_Server;

/**
 * Request sender endpoint class.
 */
class Send_Request {

	/**
	 * Returns the endpoint name.
	 */
	public function name() {
		return 'send-request';
	}

	/**
	 * Returns the endpoint read/write setting.
	 */
	public function request_methods() {
		return WP_REST_Server::EDITABLE;
	}

	/**
	 * Returns a parsed value from a JSON string, or throws.
	 *
	 * @param String $value JSON value.
	 */
	public function maybe_get_json( $value ) {

		if ( ! is_string( $value ) ) {
			return $value;
		}

		try {
			return json_decode( $value, ARRAY_A, 512, JSON_THROW_ON_ERROR );
		} catch ( \Exception $e ) {
			if ( '' === $value ) {
				return array();
			}
		}
		return $value;
	}

	/**
	 * Handle the request and return the response.
	 *
	 * @param Request $request request.
	 */
	public function response( $request ) {

		$body    = $request->get_param( 'body' );
		$headers = $request->get_param( 'headers' );
		$method  = $request->get_param( 'method' );
		$url     = $request->get_param( 'url' );

		$headers = $this->maybe_get_json( $headers );
		$body    = $this->maybe_get_json( $body );

		$args = array(
			'method'  => $method,
			'body'    => $body,
			'headers' => $headers,
		);

		$function = $this->get_transport_function( $request );
		if ( is_wp_error( $function ) ) {
			return rest_ensure_response( $function );
		}

		$monitor = Monitors::get( 'outgoing' );
		if ( is_wp_error( $monitor ) ) {
			return rest_ensure_response( $monitor );
		}

		$monitor->ensure_enabled();
		$results = $function( $url, $args, );

		return rest_ensure_response( $results );
	}

	/**
	 * Returns transport function name.
	 *
	 * @param Request $request request.
	 */
	private function get_transport_function( $request ) {
		$transport_name       = $request->get_param( 'transport' ) ?? 'wp_remote_request';
		$available_transports = array(
			'jetpack_connection' => 'jetpack_inspect_request',
			'wp'                 => 'wp_remote_request',
		);

		if ( isset( $available_transports[ $transport_name ] ) ) {
			$function = $available_transports[ $transport_name ];
		}

		if ( ! isset( $function ) || ! function_exists( $function ) ) {
			return new \WP_Error( 'Invalid Request Type' );
		}

		return $function;
	}

	/**
	 * Returns access permissions for the endpoint.
	 */
	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}
}
