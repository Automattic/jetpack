<?php
/**
 * WP_REST_Help_Center_Support_Interactions file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;

/**
 * Class WP_REST_Help_Center_Support_Interactions.
 */
class WP_REST_Help_Center_Support_Interactions extends \WP_REST_Controller {
	/**
	 * WP_REST_Help_Center_Support_Interactions constructor.
	 */
	public function __construct() {
		$this->namespace = 'help-center';
		$this->rest_base = '/support-interactions';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_support_interactions' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'status'   => array(
						'type'     => 'string',
						'required' => false,
						'enum'     => array(
							'open',
							'resolved',
						),
					),
					'page'     => array(
						'type'     => 'integer',
						'required' => false,
						'default'  => 1,
						'minimum'  => 1,
					),
					'per_page' => array(
						'type'     => 'integer',
						'required' => false,
						'default'  => 10,
						'minimum'  => 1,
						'maximum'  => 100,
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<support_interaction_id>[a-zA-Z0-9-]+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_support_interactions' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_support_interaction' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'event_external_id' => array(
						'type'     => 'string',
						'required' => true,
					),
					'event_source'      => array(
						'type'     => 'string',
						'required' => true,
					),
					'event_metadata'    => array(
						'type'     => 'string',
						'required' => false,
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<support_interaction_id>[a-zA-Z0-9-]+)/events',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_support_interaction_event' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'event_external_id' => array(
						'type'     => 'string',
						'required' => true,
					),
					'event_source'      => array(
						'type'     => 'string',
						'required' => true,
					),
					'event_metadata'    => array(
						'type'     => 'string',
						'required' => false,
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<support_interaction_id>[a-zA-Z0-9-]+)/status',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_support_interaction_status' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'status' => array(
						'type'     => 'string',
						'required' => true,
						'enum'     => array(
							'open',
							'resolved',
						),
					),
				),
			)
		);
	}

	/**
	 * Get support interactions.
	 *
	 * @param \WP_REST_Request $request    The request sent to the API.
	 */
	public function get_support_interactions( \WP_REST_Request $request ) {
		if ( isset( $request['support_interaction_id'] ) ) {
			$url = "/support-interactions/{$request['support_interaction_id']}";
		} else {
			$url = '/support-interactions/?' . http_build_query( stripslashes_deep( $request->get_params() ) );
		}

		$body = Client::wpcom_json_api_request_as_user( $url );

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}

	/**
	 * Create support interaction.
	 *
	 * @param \WP_REST_Request $request    The request sent to the API.
	 */
	public function create_support_interaction( \WP_REST_Request $request ) {
		$data = array(
			'event_external_id' => $request['event_external_id'],
			'event_source'      => $request['event_source'],
			'event_metadata'    => $request['event_metadata'],
		);

		$body = Client::wpcom_json_api_request_as_user(
			'/support-interactions',
			'2',
			array(
				'method' => 'POST',
				'body'   => $data,
			)
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}

	/**
	 * Create support interaction event.
	 *
	 * @param \WP_REST_Request $request    The request sent to the API.
	 */
	public function create_support_interaction_event( \WP_REST_Request $request ) {
		$support_interaction_id = isset( $request['support_interaction_id'] ) ? (int) $request['support_interaction_id'] : null;

		$data = array(
			'event_external_id' => $request['event_external_id'],
			'event_source'      => $request['event_source'],
			'event_metadata'    => $request['event_metadata'],
		);

		$body = Client::wpcom_json_api_request_as_user(
			"/support-interactions/$support_interaction_id/events",
			'2',
			array(
				'method' => 'POST',
				'body'   => $data,
			)
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}

	/**
	 * Update support interaction status.
	 *
	 * @param \WP_REST_Request $request    The request sent to the API.
	 */
	public function update_support_interaction_status( \WP_REST_Request $request ) {
		$support_interaction_id = isset( $request['support_interaction_id'] ) ? (int) $request['support_interaction_id'] : null;

		$status = $request['status'];

		$body = Client::wpcom_json_api_request_as_user(
			"/support-interactions/$support_interaction_id/status",
			'2',
			array(
				'method' => 'PUT',
				'body'   => array( 'status' => $status ),
			)
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
