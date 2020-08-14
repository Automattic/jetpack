<?php
/**
 * REST API endpoint for parsing Tweetstorms out of block content.
 *
 * @package Jetpack
 * @since 8.7.0
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Tweetstorm gatherer.
 *
 * @since 8.7.0
 */
class WPCOM_REST_API_V2_Endpoint_Tweetstorm_Parse extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'tweetstorm/parse';

		if ( ! class_exists( 'Jetpack_Tweetstorm_Helper' ) ) {
			\jetpack_require_lib( 'class-jetpack-tweetstorm-helper' );
		}

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
				'args'                                  => array(
					'content' => array(
						'description' => __( 'The blocks that need to be parsed into tweets.', 'jetpack' ),
						'type'        => 'object',
						'required'    => true,
					),
				),
				'methods'                               => WP_REST_Server::EDITABLE,
				'callback'                              => array( $this, 'parse_tweetstorm' ),
				'allow_blog_token_when_site_is_private' => true,
				'permission_callback'                   => '__return_true',
			)
		);
	}

	/**
	 * Parse the content into a tweetstorm.
	 *
	 * @param  WP_REST_Request $request The request.
	 * @return mixed
	 */
	public function parse_tweetstorm( $request ) {
		return Jetpack_Tweetstorm_Helper::parse( $request['content'] );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Tweetstorm_Parse' );
