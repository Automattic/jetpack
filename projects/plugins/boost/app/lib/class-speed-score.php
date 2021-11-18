<?php
/**
 * Speed Score API endpoints.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Jetpack_Boost;

/**
 * Class Speed_Score
 */
class Speed_Score {

	/**
	 * Main plugin instance.
	 *
	 * @var Jetpack_Boost Plugin.
	 */
	private $jetpack_boost;

	/**
	 * Constructor.
	 *
	 * @param Jetpack_Boost $jetpack_boost Main plugin instance.
	 */
	public function __construct( Jetpack_Boost $jetpack_boost ) {
		$this->jetpack_boost = $jetpack_boost;

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

		$score_request = $this->get_score_request_by_url( $url );
		if ( empty( $score_request ) || ! $score_request->is_pending() ) {
			// Create and store the Speed Score request.
			$active_modules = array_keys( $this->jetpack_boost->get_active_modules() );
			$score_request  = new Speed_Score_Request( $url, $active_modules );
			$score_request->store( 1800 ); // Keep the request for 30 minutes even if no one access the results.

			// Send the request.
			$response = $score_request->execute();

			if ( is_wp_error( $response ) ) {
				return $response;
			}
		}

		$score_request_no_boost = $this->maybe_dispatch_no_boost_score_request( $url );

		return $this->prepare_speed_score_response( $url, $score_request, $score_request_no_boost );
	}

	/**
	 * Remove the string "jb-disable-module" from array of strings.
	 *
	 * This is intended to be used by the filter `jetpack_boost_excluded_query_parameters` to allow `jb-disable-module` url parameter during score requests.
	 *
	 * @param string[] $params List of parameters to be removed from url.
	 *
	 * @return string[] Revised list of parameters to remove from url.
	 */
	public function allow_jb_disable_module( $params ) {
		$index = array_search( 'jb-disable-modules', $params, true );
		unset( $params[ $index ] );

		return $params;
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

		// Poll update if there is an ongoing request for scores with boost disabled.
		$url_no_boost           = $this->get_boost_modules_disabled_url( $url );
		$score_request_no_boost = $this->get_score_request_by_url( $url_no_boost );
		if ( $score_request_no_boost && $score_request_no_boost->is_pending() ) {
			$response = $score_request_no_boost->poll_update();
			if ( is_wp_error( $response ) ) {
				return $response;
			}
		}

		// Poll update if there is an ongoing request for scores with boost enabled.
		$score_request = $this->get_score_request_by_url( $url );
		if ( $score_request && $score_request->is_pending() ) {
			$response = $score_request->poll_update();
			if ( is_wp_error( $response ) ) {
				return $response;
			}
		}

		// If this is a fresh install, there might not be any speed score history. In which case, we want to fetch the initial scores.
		// While updating plugin from 1.2 -> 1.3, the history will be missing along with a non-pending score request due to data structure change.
		$history = new Speed_Score_History( $url );
		if ( null === $history->latest_scores() && ( empty( $score_request ) || ! $score_request->is_pending() ) ) {
			return $this->dispatch_speed_score_request( $request );
		}

		return $this->prepare_speed_score_response( $url, $score_request, $score_request_no_boost );
	}

	/**
	 * If it is time to fetch the score without boost, fetch it.
	 *
	 * @param string $url Url of the site.
	 *
	 * @return Speed_Score_Request
	 */
	private function maybe_dispatch_no_boost_score_request( $url ) {

		// Allow `jb-disable-module` URL param to fetch score without boost modules being active.
		add_filter( 'jetpack_boost_excluded_query_parameters', array( $this, 'allow_jb_disable_module' ) );

		$url_no_boost = $this->get_boost_modules_disabled_url( $url );

		$history        = new Speed_Score_History( $url_no_boost );
		$latest_history = $history->latest();
		$score_request  = $this->get_score_request_by_url( $url_no_boost );

		if (
			// If there isn't already a pending request.
			( empty( $score_request ) || ! $score_request->is_pending() )
			&& ! empty( $this->jetpack_boost->get_active_modules() )
			&& (
				null === $latest_history
				|| $latest_history['timestamp'] < strtotime( '- 24 hours' ) // Refetch if it is older than a day.
				|| wp_get_theme()->get( 'Name' ) !== $latest_history['theme'] // Refetch if then theme was changed.
			)
		) {
			$score_request = new Speed_Score_Request( $url_no_boost ); // Dispatch a new speed score request to measure score without boost.
			$score_request->store( 3600 ); // Keep the request for 1 hour even if no one access the results. The value is persisted for 1 hour in wp.com from initial request.

			// Send the request.
			$response = $score_request->execute();

			if ( is_wp_error( $response ) ) {
				return $response;
			}
		}
		remove_filter( 'jetpack_boost_excluded_query_parameters', array( $this, 'allow_jb_disable_module' ) );

		return $score_request;
	}

	/**
	 * Get Speed_Score_Request instance by url.
	 *
	 * @param string $url Url to get the Speed_Score_Request instance for.
	 *
	 * @return Speed_Score_Request
	 */
	private function get_score_request_by_url( $url ) {
		return Speed_Score_Request::get(
			Speed_Score_Request::generate_cache_id_from_url( $url )
		);
	}

	/**
	 * Add query parameters to the url that would disable all boost modules.
	 *
	 * @param string $url The original URL we are measuring for score.
	 *
	 * @return string
	 */
	private function get_boost_modules_disabled_url( $url ) {
		return add_query_arg( 'jb-disable-modules', 'all', $url );
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
	 * @param Speed_Score_Request $score_request          Speed score request.
	 * @param Speed_Score_Request $score_request_no_boost Speed score request without boost enabled.
	 *
	 * @return \WP_Error|\WP_HTTP_Response|\WP_REST_Response
	 */
	private function prepare_speed_score_response( $url, $score_request, $score_request_no_boost ) {
		$history          = new Speed_Score_History( $url );
		$url_no_boost     = $this->get_boost_modules_disabled_url( $url );
		$history_no_boost = new Speed_Score_History( $url_no_boost );

		$response = array();

		if ( ( ! $score_request || $score_request->is_success() ) && ( ! $score_request_no_boost || $score_request_no_boost->is_success() ) ) {
			$response['status'] = 'success';

			$response['scores'] = array(
				'current' => $history->latest_scores(),
				'noBoost' => null,
			);

			// Only include noBoost scores if at least one modules is enabled.
			$latest_history = $history->latest();
			if ( ! empty( $this->jetpack_boost->get_active_modules() ) ) {
				$response['scores']['noBoost'] = $history_no_boost->latest_scores();
			}

			$response['scores']['isStale'] = wp_get_theme()->get( 'Name' ) !== $latest_history['theme'];

		} else {
			// If either request ended up in error, we can just return the one with error so front-end can take action. The relevent url is available on the serialized object.
			if ( ( $score_request && $score_request->is_error() ) || ( $score_request_no_boost && $score_request_no_boost->is_error() ) ) {
				if ( $score_request->is_error() ) {
					// Serialized version of score request contains the status property and error description if any.
					$response = $score_request->jsonSerialize();
				} else {
					$response = $score_request_no_boost->jsonSerialize();
				}
			} else {
				// If no request ended up in error/success as previous conditions dictate, it means that either of them are in pending state.
				$response['status'] = 'pending';
			}
		}

		return rest_ensure_response( $response );
	}
}
