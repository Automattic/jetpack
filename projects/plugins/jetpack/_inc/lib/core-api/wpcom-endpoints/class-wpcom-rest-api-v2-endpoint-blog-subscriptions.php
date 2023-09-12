<?php
/**
 * REST API endpoint for the Jetpack Blogroll block.
 *
 * @package automattic/jetpack
 * @since 12.2
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_Blog_Subscriptions
 */
class WPCOM_REST_API_V2_Endpoint_Blog_Subscriptions extends WP_REST_Controller {
	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'subscribe';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/new',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle_new' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'blog_id' => array(
						'type'        => 'number',
						'description' => 'The blog ID to subscribe to.',
						'required'    => true,
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/delete',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle_delete' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'blog_id' => array(
						'type'        => 'number',
						'description' => 'The blog ID to unsubscribe from.',
						'required'    => true,
					),
				),
			)
		);
	}

	/**
	 * Gets the sites the user is following
	 *
	 * @return array|WP_Error list of followed sites, WP_Error otherwise
	 */
	public function handle_new() {
		return 'Got it';
	}

	/**
	 * Gets recommended sites for user
	 *
	 * @return array|WP_Error list of following recommendations, WP_Error otherwise
	 */
	public function handle_delete() {
		return 'Gone';
	}

}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Blog_Subscriptions' );
