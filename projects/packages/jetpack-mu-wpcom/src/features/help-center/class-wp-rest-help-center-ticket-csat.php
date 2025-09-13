<?php
/**
 * WP_REST_Help_Center_Ticket_CSAT file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;

/**
 * Class WP_REST_Help_Center_Ticket_CSAT.
 */
class WP_REST_Help_Center_Ticket_CSAT extends \WP_REST_Controller {
	/**
	 * WP_REST_Help_Center_Ticket_CSAT constructor.
	 */
	public function __construct() {
		$this->namespace = 'help-center';
		$this->rest_base = '/csat';
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
				'callback'            => array( $this, 'submit_rating' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'ticket_id' => array(
						'required' => true,
						'type'     => 'int',
					),
					'score'     => array(
						'required' => true,
						'enum'     => array( 'good', 'bad' ),
						'type'     => 'string',
					),
					'comment'   => array(
						'required' => false,
						'type'     => 'string',
					),
					'reason_id' => array(
						'required' => false,
						'type'     => 'string',
					),
					'test_mode' => array(
						'required' => false,
						'type'     => 'boolean',
					),
				),
			)
		);
	}

	/**
	 * Post customer satisfaction for a ticket.
	 *
	 * @param \WP_REST_Request $request    The request sent to the API.
	 */
	public function submit_rating( \WP_REST_Request $request ) {
		$payload = array(
			'ticket_id' => $request['ticket_id'],
			'score'     => $request['score'],
			'comment'   => $request['comment'],
			'reason_id' => $request['reason_id'],
			'test_mode' => $request['test_mode'],
		);

		$body = Client::wpcom_json_api_request_as_user(
			'/help/csat',
			'2',
			array(
				'method' => 'POST',
			),
			$payload
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
