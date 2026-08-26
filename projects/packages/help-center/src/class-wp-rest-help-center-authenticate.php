<?php
/**
 * WP_REST_Help_Center_Authenticate file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Authenticate.
 */
class WP_REST_Help_Center_Authenticate extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_Authenticate constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/authenticate/chat';
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
				'callback'            => array( $this, 'get_chat_authentication' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'type'      => array(
						'type'     => 'string',
						'default'  => 'zendesk',
						'required' => false,
					),
					'test_mode' => array(
						'type'     => 'boolean',
						'default'  => false,
						'required' => false,
					),
				),
			)
		);
	}

	/**
	 * Callback to authorize user for chat.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 */
	public function get_chat_authentication( \WP_REST_Request $request ) {
		$query_parameters = array(
			'test_mode' => $request['test_mode'],
			'type'      => $request['type'],
		);

		$body = $this->wpcom_request_client->request(
			'help/authenticate/chat?' . http_build_query( $query_parameters ),
			'2',
			array(
				'method' => 'POST',
			)
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
