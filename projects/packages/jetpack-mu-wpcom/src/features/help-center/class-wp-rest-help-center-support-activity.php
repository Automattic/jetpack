<?php
/**
 * WP_REST_Help_Center_Support_Activity file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;

/**
 * Class WP_REST_Help_Center_Support_Activity.
 */
class WP_REST_Help_Center_Support_Activity extends \WP_REST_Controller {
	/**
	 * WP_REST_Help_Center_Support_Activity constructor.
	 */
	public function __construct() {
		$this->namespace = 'help-center';
		$this->rest_base = '/support-activity';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_support_activity' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
	}

	/**
	 * Get support activity through Jetpack.
	 */
	public function get_support_activity() {
		$body = Client::wpcom_json_api_request_as_user( '/support-activity' );

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
