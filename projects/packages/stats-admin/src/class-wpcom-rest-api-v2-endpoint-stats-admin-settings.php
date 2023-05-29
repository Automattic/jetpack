<?php
/**
 * REST API endpoint for managing Stats options.
 *
 * @package automattic/jetpack-stats-admin
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\Stats_Admin;

use WP_REST_Controller;
use WP_REST_Server;

/**
 * VideoPress wpcom api v2 endpoint
 */
class WPCOM_REST_API_V2_Endpoint_Stats_Admin_Settings extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'stats-admin';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		// Update settings Route.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/settings',
			array(
				'args'                => array(
					'modules'    => array(
						'type' => 'object',
					),
					'highlights' => array(
						'type'       => 'object',
						'properties' => array(
							'highlights_window_days' => array(
								'type' => 'enum',
								'enum' => array( 7, 30 ),
							),
						),
					),
				),
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_options' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);

		// Get settings Route.
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/settings',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_options' ),
				'permission_callback' => array( $this, 'can_user_view_general_stats_callback' ),
			)
		);
	}

	/**
	 * Update settings.
	 *
	 * @param WP_REST_Request $req Request.
	 * @return mixed
	 */
	public function update_options( $req ) {
	}

	/**
	 * Update settings.
	 *
	 * @param WP_REST_Request $req Request.
	 * @return mixed
	 */
	private function get_options( $req ) {
	}
}
