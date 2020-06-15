<?php
/**
 * REST API endpoint for the Custom Initial Block extension.
 *
 * @package Jetpack
 * @since 8.7.0
 */

use Automattic\Jetpack\Connection\Client;
use Jetpack_Gutenberg;
use Jetpack_Options;

/**
 * Custom Initial Block extension helper API.
 *
 * @since 8.5
 */
class WPCOM_REST_API_V2_Endpoint_Custom_Initial_Block extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'custom-initial-block';
		$this->is_wpcom  = false;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->is_wpcom = true;
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/connect-url',
			array(
				'methods'  => WP_REST_Server::READABLE,
				'callback' => array( $this, 'get_instagram_connect_url' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_custom_initial_block' ),
				'permission_callback' => array( $this, 'custom_initial_block_permission_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'set_custom_initial_block' ),
				'permission_callback' => array( $this, 'custom_initial_block_permission_check' ),
				'args'                => array(
					'block' => array(
						'required'          => false,
						'type'              => 'string',
						'validate_callback' => array( $this, 'custom_initial_block_validation' ),
					),
				),
			)
		);
	}

	/**
	 * Check if the current user can edit posts.
	 */
	public function custom_initial_block_permission_check() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Validation callback for the block parameter.
	 *
	 * @param array $param Block parameter.
	 * @return true|\WP_Error
	 */
	public function custom_initial_block_validation( $param ) {
		return Jetpack_Gutenberg::is_custom_initial_block_allowed( $param );
	}

	/**
	 * Retrieve the custom initial block for the current user.
	 *
	 * @return string|\WP_Error|mixed
	 */
	public function get_custom_initial_block() {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$path     = sprintf( '/sites/%d/gutenberg', $site_id );
		$response = Client::wpcom_json_api_request_as_user( $path, 3 );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ) );
		if ( ! property_exists( $body, 'custom_initial_block' ) ) {
			return new WP_Error(
				'bad_request',
				__( 'An error occurred. Please try again later.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		return $body->custom_initial_block;
	}

	/**
	 * Save the custom initial block for the current user.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return string|\WP_Error|mixed
	 */
	public function set_custom_initial_block( WP_REST_Request $request ) {
		$site_id = $this->get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$block    = $request->get_param( 'block' );
		$path     = sprintf( '/sites/%d/gutenberg/initial-block', $site_id );
		$response = Client::wpcom_json_api_request_as_user(
			$path,
			3,
			array( 'method' => 'POST' ),
			array( 'block' => $block )
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		l( $response );

		$body = json_decode( wp_remote_retrieve_body( $response ) );
		if ( ! property_exists( $body, 'custom_initial_block' ) ) {
			return new WP_Error(
				'bad_request',
				__( 'An error occurred. Please try again later.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		return $body->custom_initial_block;
	}

	/**
	 * Get the WPCOM or self-hosted site ID.
	 *
	 * @return mixed
	 */
	public function get_site_id() {
		$site_id = $this->is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}
		return (int) $site_id;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Custom_Initial_Block' );
