<?php
declare( strict_types = 1 );
/**
 * Plugin Name: Verbum Comments Experience Embeds.
 * Description: This is used to get the embed data for the embed block. The core API requires authentication, so we need to create our own endpoint.
 * Author: Vertex
 */

class WPCOM_REST_API_V2_Verbum_OEmbed extends \WP_REST_Controller {
	public function __construct() {
		$this->namespace                       = 'wpcom/v2';
		$this->rest_base                       = '/verbum/embed';
		$this->wpcom_is_wpcom_only_endpoint    = false;
		$this->wpcom_is_site_specific_endpoint = false;
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			[
				'show_in_index'       => false,
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => [ $this, 'get_embed_data' ],
				'permission_callback' => [ $this, 'permission_callback' ],
			]
		);
	}

	public function permission_callback( WP_REST_Request $request ) {
		$nonce = $request->get_param( 'embed_nonce' );

		return wp_verify_nonce( $nonce, 'embed_nonce' );
	}

	public function get_embed_data( WP_REST_Request $request ) {
		$url        = sanitize_url( $request->get_param( 'embed_url' ) );
		$instance   = new WP_oEmbed();
		$embed_data = $instance->get_data( $url, [] );

		// Return error if the embed data is empty.
		// This matches the core response.
		if ( false === $embed_data ) {
			return new \WP_Error( 'oembed_invalid_url', get_status_header_desc( 404 ), array( 'status' => 404 ) );
		}

		return $embed_data;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Verbum_oEmbed' );
