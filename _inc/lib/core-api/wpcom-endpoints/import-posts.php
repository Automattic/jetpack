<?php

class WPCOM_REST_API_V2_Endpoint_Import_Posts extends WP_REST_Controller {
	public function __construct() {
		$this->namespace = '/wpcom/v2';
		$this->rest_base = '/import';
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/posts',
			array(
				'methods'  => WP_REST_Server::CREATABLE,
				'callback' => array( $this, 'import_posts' ),
				'permission_callback' => array( $this, 'import_permission_check' ),
				'args' => array(
					'posts' => array(
						'required' => true,
						'sanitize_callback' => array( $this, 'sanitize_posts' ),
					),
				),
			)
		);
	}

	public function import_posts( $request ) {
		$posts = isset( $request['posts'] ) ? $request['posts'] : array();

		if ( count( $posts ) < 1 ) {
			return new WP_Error( 'rest_invalid_param', __( 'posts param must contain at least 1 post.', 'jetpack' ) );
		}

		$post_ids = array();

		foreach ( $posts as $post ) {
			$post_ids[] = wp_insert_post( $post );
		}

		return new WP_REST_Response( $post_ids, 200 );
	}

	public function import_permission_check() {
		return current_user_can( 'import' )
			? true
			: new WP_Error(
				'rest_cannot_create',
				__( 'Sorry, you are not allowed to import as this user.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
	}

	public function sanitize_posts( $posts ) {
		$sanitized_posts = array_map( array( $this, 'sanitize_post' ), $posts );
		return $sanitized_posts;
	}

	public function sanitize_post( $post ) {
		return sanitize_post( $post, 'db' );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Import_Posts' );
