<?php
/**
 * WP_REST_Help_Center_User_Fields file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_User_Fields.
 */
class WP_REST_Help_Center_User_Fields extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_User_Fields constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/zendesk/user-fields';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'update_user_fields' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'fields' => array(
						'type'     => 'object',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Callback to update user fields in Zendesk
	 *
	 * @param \WP_REST_Request $request    The request sent to the API.
	 */
	public function update_user_fields( \WP_REST_Request $request ) {
		$body = $this->wpcom_request_client->request(
			'help/zendesk/update-user-fields',
			'2',
			array(
				'method' => 'POST',
			),
			array( 'fields' => $request['fields'] )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}
		$response = json_decode( wp_remote_retrieve_body( $body ) );
		return rest_ensure_response( $response );
	}
}
