<?php
/**
 * REST API endpoint for the Instagram Gallery block.
 *
 * @package Jetpack
 * @since 8.5.0
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Instagram Gallery block helper API.
 *
 * @since 8.5
 */
class WPCOM_REST_API_V2_Endpoint_Instagram_Gallery extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'instagram-gallery';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'args'     => array(
					'access_token' => array(
						'description' => __( 'An Instagram Keyring access token.', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
					'count'        => array(
						'description'       => __( 'How many Instagram posts?', 'jetpack' ),
						'type'              => 'int',
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_numeric( $param );
						},
					),
				),
				'methods'  => WP_REST_Server::READABLE,
				'callback' => array( $this, 'get_instagram_gallery' ),
			)
		);
	}

	/**
	 * Get the Instagram Gallery
	 *
	 * @param  Object $request - request passed from WP.
	 * @return Object
	 */
	public function get_instagram_gallery( $request ) {
		$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id  = $is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}

		$path    = sprintf( '/sites/%s/instagram/%s?count=%s', $site_id, $request['access_token'], $request['count'] );
		$request = Client::wpcom_json_api_request_as_blog(
			$path,
			2,
			array( 'headers' => array( 'content-type' => 'application/json' ) ),
			null,
			'wpcom'
		);
		$body    = wp_remote_retrieve_body( $request );

		return json_decode( $body );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Instagram_Gallery' );
