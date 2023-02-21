<?php
/**
 * Proxy endpoint for Jetpack Forms
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Forms\REST_Controller;

/**
 * Jetpack Search: Makes authenticated requests to the site search API using blog tokens.
 * This endpoint will only be used when trying to search private Jetpack and WordPress.com sites.
 */
class WPCOM_REST_API_V2_Endpoint_Form_Responses extends WP_REST_Controller {
	/**
	 * Forward request to controller in Forms package.
	 *
	 * @var REST_Controller
	 */
	protected $controller;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace  = 'wpcom/v2';
		$this->rest_base  = 'form-responses';
		$this->controller = new REST_Controller( defined( 'IS_WPCOM' ) && IS_WPCOM );

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Action rest_api_init hook handler.
	 * Registers API endpoints for form-responses.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this->controller, 'get_jetpack_form_responses' ),
				'permission_callback' => array( $this->controller, 'jetpack_form_responses_permission_check' ),
				'args'                => array(
					'limit'   => array(
						'default'           => 20,
						'type'              => 'integer',
						'required'          => false,
						'validate_callback' => 'Automattic\Jetpack\Forms\REST_Controller::validate_posint',
					),
					'offset'  => array(
						'default'           => 0,
						'type'              => 'integer',
						'required'          => false,
						'validate_callback' => 'Automattic\Jetpack\Forms\REST_Controller::validate_non_neg_int',
					),
					'form_id' => array(
						'type'              => 'integer',
						'required'          => false,
						'validate_callback' => 'Automattic\Jetpack\Forms\REST_Controller::validate_posint',
					),
					'search'  => array(
						'type'              => 'text',
						'required'          => false,
						'validate_callback' => 'Automattic\Jetpack\Forms\REST_Controller::validate_string',
					),
				),
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Form_Responses' );
