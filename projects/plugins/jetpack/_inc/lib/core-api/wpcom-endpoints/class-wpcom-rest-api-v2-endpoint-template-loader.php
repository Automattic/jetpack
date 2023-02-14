<?php
/**
 * REST API endpoint for resolving template.
 *
 * @package automattic/jetpack
 */

/**
 * Returns the correct template for the site's page based on the template type
 */
class WPCOM_REST_API_V2_Endpoint_Template_Loader extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'template-loader';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Called automatically on `rest_api_init()`.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			sprintf(
				'/%s/(?P<template_type>\w+)',
				$this->rest_base
			),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_item' ),
				'permission_callback' => array( $this, 'permissions_check' ),
				'args'                => array(
					'template_type' => array(
						'description'       => __( 'The type of the template.', 'jetpack' ),
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => array( $this, 'validate_template_type' ),
					),
				),
			)
		);
	}

	/**
	 * Checks if the user has permissions to make the request.
	 *
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function permissions_check() {
		// Verify if the current user has edit_theme_options capability.
		// This capability is required to edit/view/delete templates.
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_cannot_manage_templates',
				__( 'Sorry, you are not allowed to access the templates on this site.', 'jetpack' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
	}

	/**
	 * Validate the template type.
	 *
	 * @param string $template_type The template type.
	 * @return boolean True if the template type is valid.
	 */
	public function validate_template_type( $template_type ) {
		$template_types = array_keys( get_default_block_template_types() );
		if ( ! in_array( $template_type, $template_types, true ) ) {
			return new WP_Error(
				'rest_invalid_param',
				sprintf(
					/* translators: %s: The template type. */
					__( 'The template type %s are not allowed.', 'jetpack' ),
					$template_type
				),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Retrieves the template by specified type.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$template_type = $request['template_type'];

		// A list of template candidates, in descending order of priority.
		$templates      = apply_filters( "{$template_type}_template_hierarchy", array( "{$template_type}.php" ) );
		$template       = locate_template( $templates );
		$block_template = resolve_block_template( $template_type, $templates, $template );

		if ( empty( $block_template ) ) {
			return new WP_Error( 'not_found', 'Template not found', array( 'status' => 404 ) );
		}

		return rest_ensure_response(
			array(
				'type' => $block_template->type,
				'id'   => $block_template->id,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Template_Loader' );
