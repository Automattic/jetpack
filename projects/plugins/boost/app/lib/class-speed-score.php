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
		add_action( 'jetpack_boost_clear_cache', array( $this, 'clear_speed_score_request_cache' ) );
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
				'callback'            => array( $this, 'fetch_speed_score' ),
				'permission_callback' => array( $this, 'can_access_speed_scores' ),
			)
		);

		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/speed-scores/refresh',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'dispatch_speed_score_request' ),
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
	 * Handler for POST /speed-scores/refresh.
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

		if ( empty( $score_request ) || ! $score_request->is_pending() ) {
			// Create and store the Speed Score request.
			$score_request = new Speed_Score_Request( $url );
			$score_request->store( 1800 ); // Keep the request for 30 minutes even if no one access the results.

			// Send the request.
			$response = $score_request->execute();

			if ( is_wp_error( $response ) ) {
				return $response;
			}
		}

		return $this->prepare_speed_score_response( $url, $score_request );
	}

	/**
	 * Handler for POST /speed-scores.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error The response.
	 */
	public function fetch_speed_score( $request ) {
		$url = $this->process_url_arg( $request );
		if ( is_wp_error( $url ) ) {
			return $url;
		}

		$score_request = Speed_Score_Request::get(
			Speed_Score_Request::generate_cache_id_from_url( $url )
		);

		if ( $score_request && $score_request->is_pending() ) {
			$response = $score_request->poll_update();
			if ( is_wp_error( $response ) ) {
				return $response;
			}
		}

		// If this is a fresh install, there might not be any speed score history. In which case, we want to fetch the initial scores.
		$history = new Speed_Score_History( $url );
		if ( null === $history->latest() ) {
			return $this->dispatch_speed_score_request( $request );
		}

		return $this->prepare_speed_score_response( $url, $score_request );
	}

	/**
	 * Can the user access speed scores?
	 *
	 * @return bool
	 */
	public function can_access_speed_scores() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Clear speed score request cache on jetpack_boost_clear_cache action.
	 */
	public function clear_speed_score_request_cache() {
		Speed_Score_Request::clear_cache();
	}

	/**
	 * Prepare the speed score response.
	 *
	 * @param string              $url URL of the speed is requested for.
	 * @param Speed_Score_Request $score_request A new speed score request to save.
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	private function prepare_speed_score_response( $url, $score_request ) {
		$history = new Speed_Score_History( $url );

		$response = array();

		// Even if score request is expired or not present, we can get the existing results from history.
		if ( ! $score_request || $score_request->is_success() ) {
			$response['status'] = 'success';

			$response['scores'] = array(
				'current'  => $history->latest(),
				'previous' => $history->latest( 1 ),
			);
		} else {
			// Serialized version of score request contains the status property and error description if any.
			$response = $score_request->jsonSerialize();
		}

		return rest_ensure_response( $response );
	}
}
