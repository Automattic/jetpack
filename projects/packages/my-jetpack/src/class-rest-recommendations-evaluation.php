<?php
/**
 * Sets up the Evaluation Recommendations REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use WP_Error;

/**
 * Registers the REST routes for Evaluation Recommendations.
 *
 * @phan-constructor-used-for-side-effects
 */
class REST_Recommendations_Evaluation {
	/**
	 * Constructor.
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'/site/recommendations/evaluation/',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::evaluate_site_recommendations',
					'permission_callback' => __CLASS__ . '::permissions_callback',
					'args'                => array(
						'goals' => array(
							'description' => __( 'List of goals selected by the user.', 'jetpack-my-jetpack' ),
							'type'        => 'array',
							'required'    => true,
							'items'       => array(
								'type' => 'string',
							),
						),
					),
				),
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'/site/recommendations/evaluation/result/',
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => __CLASS__ . '::save_evaluation_recommendations',
					'permission_callback' => __CLASS__ . '::permissions_callback',
					'args'                => array(
						'recommendations' => array(
							'description'          => __( 'Recommended module slugs mapped to their evaluation score.', 'jetpack-my-jetpack' ),
							'type'                 => 'object',
							'required'             => true,
							'additionalProperties' => array(
								'type' => 'number',
							),
						),
					),
				),
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'/site/recommendations/evaluation/result/',
			array(
				array(
					'methods'             => \WP_REST_Server::DELETABLE,
					'callback'            => __CLASS__ . '::dismiss_evaluation_recommendations',
					'permission_callback' => __CLASS__ . '::permissions_callback',
					'args'                => array(
						'showWelcomeBanner' => array(
							'description' => __( 'Whether the welcome banner should be shown again.', 'jetpack-my-jetpack' ),
							'type'        => 'string',
							'enum'        => array( 'true', 'false' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Check user capability to access the endpoint.
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function permissions_callback() {
		$connection        = new Connection_Manager();
		$is_site_connected = $connection->is_connected();

		if ( ! $is_site_connected ) {
			return new WP_Error(
				'not_connected',
				__( 'Your site is not connected to Jetpack.', 'jetpack-my-jetpack' ),
				array(
					'status' => 400,
				)
			);
		}

		// These endpoints read and write site-wide options, so they are limited to administrators.
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'invalid_user_permission_manage_options',
				__( 'You do not have the correct user permissions to perform this action.', 'jetpack-my-jetpack' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
	}

	/**
	 * Recommendations Evaluation endpoint.
	 *
	 * @param \WP_REST_Request $request Query request.
	 *
	 * @return \WP_REST_Response|WP_Error of 3 product slugs (recommendations).
	 */
	public static function evaluate_site_recommendations( $request ) {
		$goals = $request->get_param( 'goals' );

		if ( ! isset( $goals ) ) {
			return new WP_Error( 'missing_goals', 'Goals are required', array( 'status' => 400 ) );
		}

		$site_id        = \Jetpack_Options::get_option( 'id' );
		$wpcom_endpoint = sprintf( '/sites/%1$d/jetpack-recommendations/evaluation?goals=%2$s', $site_id, implode( ',', array_map( 'rawurlencode', (array) $goals ) ) );
		$response       = Client::wpcom_json_api_request_as_blog( $wpcom_endpoint, '2', array(), null, 'wpcom' );
		$response_code  = wp_remote_retrieve_response_code( $response );
		$body           = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $response ) || empty( $body ) || 200 !== $response_code ) {
			return new WP_Error( 'recommendations_evaluation_fetch_failed', 'Evaluation processing failed', array( 'status' => $response_code ? $response_code : 400 ) );
		}

		return rest_ensure_response( $body );
	}

	/**
	 * Endpoint to save recommendations results.
	 *
	 * @param \WP_REST_Request $request Query request.
	 *
	 * @return \WP_REST_Response|WP_Error success response.
	 */
	public static function save_evaluation_recommendations( $request ) {
		$json = $request->get_json_params();

		if ( ! isset( $json['recommendations'] ) ) {
			return new WP_Error( 'missing_recommendations', 'Recommendations are required', array( 'status' => 400 ) );
		}

		\Jetpack_Options::update_option( 'recommendations_evaluation', $json['recommendations'] );
		\Jetpack_Options::delete_option( 'dismissed_recommendations' );

		return rest_ensure_response( Initializer::get_recommended_modules() );
	}

	/**
	 * Endpoint to dismiss the recommendation section
	 *
	 * @param \WP_REST_Request $request Query request.
	 *
	 * @return \WP_REST_Response|WP_Error success response.
	 */
	public static function dismiss_evaluation_recommendations( $request ) {
		$show_welcome_banner = $request->get_param( 'showWelcomeBanner' );

		\Jetpack_Options::update_option( 'dismissed_recommendations', true );

		if ( isset( $show_welcome_banner ) && $show_welcome_banner === 'true' ) {
			\Jetpack_Options::update_option( 'recommendations_first_run', false );
			\Jetpack_Options::delete_option( 'dismissed_welcome_banner' );
		}

		return rest_ensure_response( array() );
	}
}
