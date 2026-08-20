<?php
/**
 * WP_REST_Help_Center_Support_Interactions file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Support_Interactions.
 */
class WP_REST_Help_Center_Support_Interactions extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_Support_Interactions constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/support-interactions';
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
				'callback'            => array( $this, 'get_support_interactions' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'status'   => array(
						'type'     => 'array',
						'required' => false,
						'items'    => array(
							'type' => 'string',
							'enum' => array(
								'open',
								'resolved',
								'solved',
								'closed',
							),
						),
						'default'  => array(),
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
			$this->rest_base . '/(?P<support_interaction_id>[a-zA-Z0-9-]+)',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_support_interactions' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_support_interaction' ),
				'permission_callback' => '__return_true',
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
					'bot_slug'          => array(
						'type'     => 'string',
						'required' => false,
					),
					'is_test_mode'      => array(
						'type'     => 'boolean',
						'required' => false,
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/(?P<support_interaction_id>[a-zA-Z0-9-]+)/events',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_support_interaction_event' ),
				'permission_callback' => '__return_true',
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
			$this->rest_base . '/(?P<support_interaction_id>[a-zA-Z0-9-]+)/status',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_support_interaction_status' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'status' => array(
						'type'     => 'string',
						'required' => true,
						'enum'     => array(
							'open',
							'resolved',
							'closed',
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

		$body = $this->wpcom_request_client->request( $url );

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
		$data = array();

		if ( isset( $request['event_external_id'] ) ) {
			$data['event_external_id'] = $request['event_external_id'];
		}

		if ( isset( $request['event_source'] ) ) {
			$data['event_source'] = $request['event_source'];
		}

		if ( isset( $request['event_metadata'] ) ) {
			$data['event_metadata'] = $request['event_metadata'];
		}

		if ( isset( $request['bot_slug'] ) ) {
			$data['bot_slug'] = $request['bot_slug'];
		}

		if ( isset( $request['is_test_mode'] ) ) {
			$data['is_test_mode'] = $request['is_test_mode'];
		}

		$body = $this->wpcom_request_client->request(
			'/support-interactions',
			'2',
			array(
				'method' => 'POST',
			),
			$data
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
		$support_interaction_id = $request['support_interaction_id'];

		$data = array();

		if ( isset( $request['event_external_id'] ) ) {
			$data['event_external_id'] = $request['event_external_id'];
		}

		if ( isset( $request['event_source'] ) ) {
			$data['event_source'] = $request['event_source'];
		}

		if ( isset( $request['event_metadata'] ) ) {
			$data['event_metadata'] = $request['event_metadata'];
		}

		if ( isset( $request['is_test_mode'] ) ) {
			$data['is_test_mode'] = $request['is_test_mode'];
		}

		$body = $this->wpcom_request_client->request(
			"/support-interactions/$support_interaction_id/events",
			'2',
			array(
				'method' => 'POST',
			),
			$data
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
		$support_interaction_id = $request['support_interaction_id'];

		$status = $request['status'];

		$body = $this->wpcom_request_client->request(
			"/support-interactions/$support_interaction_id/status",
			'2',
			array(
				'method' => 'PUT',
			),
			array( 'status' => $status )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
