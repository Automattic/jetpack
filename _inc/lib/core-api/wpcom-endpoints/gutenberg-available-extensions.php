<?php

/*
 * Gutenberg: List Available Gutenberg Extensions (Blocks and Plugins)
 *
 * [
 *   { # Availabilty Object. See schema for more detail.
 *     available:          (boolean) Whether the extension is available
 *     unavailable_reason: (string)  Reason for the extension not being available
 *   },
 *   ...
 * ]
 *
 * @since 6.9
 */
class WPCOM_REST_API_V2_Endpoint_Gutenberg_Available_Extensions extends WP_REST_Controller {
	function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'gutenberg';
		$this->wpcom_is_site_specific_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route( $this->namespace, $this->rest_base . '/available-extensions', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( 'Jetpack_Gutenberg', 'get_availability' ),
				'permission_callback' => array( $this, 'get_items_permission_check' ),
				'args'                => array(
					'beta' => array(
						'required' => false,
						'type'     => 'boolean',
					),
				),
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
					'description' => __( 'Reason for the extension not being available', 'jetpack' ),
					'type'        => 'string',
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}

	/**
	 * Ensure the user has proper permissions
	 *
	 * @return boolean
	 */
	public function get_items_permission_check() {
		return current_user_can( 'edit_posts' );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Gutenberg_Available_Extensions' );
