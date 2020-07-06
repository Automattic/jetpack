<?php
/**
 * REST API endpoint for the Gathering Tweetstorms block.
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
class WPCOM_REST_API_V2_Endpoint_Tweetstorm_Gather extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace                    = 'wpcom/v2';
		$this->rest_base                    = 'tweetstorm/gather';
		$this->wpcom_is_wpcom_only_endpoint = true;
		$this->is_wpcom                     = false;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->is_wpcom = true;

			if ( ! class_exists( 'WPCOM_Gather_Tweetstorm' ) ) {
				\jetpack_require_lib( 'gather-tweetstorm' );
			}
		}

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
					'url' => array(
						'description' => __( 'The tweet URL to gather from.', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
				'methods'                               => WP_REST_Server::READABLE,
				'callback'                              => array( $this, 'gather_tweetstorm' ),
				'allow_blog_token_when_site_is_private' => true,
			)
		);
	}

	/**
	 * Gather the tweetstorm.
	 *
	 * @param  WP_REST_Request $request The request.
	 * @return mixed
	 */
	public function gather_tweetstorm( $request ) {
		return Jetpack_Tweetstorm_Helper::gather( $request['url'] );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Tweetstorm_Gather' );
