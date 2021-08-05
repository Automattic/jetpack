<?php
/**
 * Speed Score API endpoints.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Speed_Score
 */
class Speed_Score {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register Speed Score related REST routes.
	 */
	public function register_rest_routes() {
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/speed-scores',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'dispatch_speed_score_request' ),
				'permission_callback' => array( $this, 'can_access_speed_scores' ),
			)
		);

		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/speed-scores',
			array(
				'methods'             => \WP_REST_Server::DELETABLE,
				'callback'            => array( $this, 'delete_speed_score_request' ),
				'permission_callback' => array( $this, 'can_access_speed_scores' ),
			)
		);

		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/speed-scores/(?P<requestId>[^/]+)/update',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'fetch_speed_score_request' ),
				'permission_callback' => array( $this, 'can_access_speed_scores' ),
			)
		);
	}

	/**
	 * Verify and normalize the URL argument for a request.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return string|\WP_Error An error to return or the target url.
	 */
	private function process_url_arg( $request ) {
		$params = $request->get_json_params();

		if ( ! isset( $params['url'] ) ) {
			return new \WP_Error(
				'invalid_parameter',
				__(
					'The url parameter is required',
					'jetpack-boost'
				),
				array( 'status' => 400 )
			);
		}

		return Utils::force_url_to_absolute( $params['url'] );
	}

	/**
	 * Handler for POST /speed-scores.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error The response.
	 */
	public function dispatch_speed_score_request( $request ) {
		$url = $this->process_url_arg( $request );
		if ( is_wp_error( $url ) ) {
			return $url;
		}

		$score_request = Speed_Score_Request::get(
			Speed_Score_Request::generate_cache_id_from_url( $url )
		);

		if ( empty( $score_request ) ) {
			// Create and store the Speed Score request.
			$score_request = new Speed_Score_request( $url );
			$score_request->store();

			// Send the request.
			$response = $score_request->execute();

			if ( is_wp_error( $response ) ) {
				return $response;
			}
		}

		return rest_ensure_response( $score_request->jsonSerialize() );
	}

	/**
	 * Handler for DELETE /speed-scores.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error The response.
	 */
	public function delete_speed_score_request( $request ) {
		$url = $this->process_url_arg( $request );
		if ( is_wp_error( $url ) ) {
			return $url;
		}

		Speed_Score_Request::delete_by_cache_id(
			Speed_Score_Request::generate_cache_id_from_url( $url )
		);

		return rest_ensure_response( array( 'status' => 'success' ) );
	}

	/**
	 * Handler for POST /speed-scores/<requestId>/update
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error The response.
	 */
	public function fetch_speed_score_request( $request ) {
		$score_request = Speed_Score_Request::get( $request['requestId'] );

		if ( ! $score_request ) {
			/* translators: %s: request id */
			$error_message = sprintf( __( 'The speed score request with ID %s could not be found', 'jetpack-boost' ), $request['requestId'] );

			return new \WP_Error( 'resource_not_found', $error_message, array( 'status' => 404 ) );
		}

		if ( $score_request->is_pending() ) {
			$response = $score_request->poll_update();
			if ( is_wp_error( $response ) ) {
				return $response;
			}
		}

		return rest_ensure_response( $score_request->jsonSerialize() );
	}

	/**
	 * Can the user access speed scores?
	 *
	 * @return bool
	 */
	public function can_access_speed_scores() {
		return current_user_can( 'manage_options' );
	}
}
