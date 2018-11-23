<?php

/*
 * Plugin Name: Available Gutenberg Extensions (Blocks and Plugins) for wpcom/v2 WP-API
 */

class WPCOM_REST_API_V2_Endpoint_Gutenberg_Available_Extensions extends WP_REST_Controller {
	/**
	 * Flag to help WordPress.com decide where it should look for
	 * extenstion availability data. Ignored for direct requests to Jetpack sites.
	 *
	 * @var bool $wpcom_is_wpcom_only_endpoint
	 */
	public $wpcom_is_wpcom_only_endpoint = true;

	function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'gutenberg/available-extensions';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route( $this->namespace, '/' . $this->rest_base, array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( 'Jetpack_Gutenberg', 'get_block_availability' ),
				'permission_callback' => array( $this, 'get_items_permission_check' ),
			),
			'schema' => array( $this, 'get_item_schema' ),
		 ) );
	}

	/**
	 * Return the available Gutenberg extensions schema
	 *
	 * @return array Available Gutenberg extensions schema
	 */
	public function get_public_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'gutenberg-available-extensions',
			'type'       => 'object',
			'properties' => array(
				'available'          => array(
					'description' => __( 'Whether the extension is available', 'jetpack' ),
					'type'        => 'boolean',
				),
				'unavailable_reason' => array(
					'description' => __( 'Human readable reason for the extensiongutenberg/available-extensions not being available', 'jetpack' ),
					'type'        => 'string',
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Ensure the user has proper permissions
	 *
	 * @return WP_Error|boolean
	 */
	public function get_items_permission_check() {
		return current_user_can( 'edit_posts' );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Gutenberg_Available_Extensions' );
