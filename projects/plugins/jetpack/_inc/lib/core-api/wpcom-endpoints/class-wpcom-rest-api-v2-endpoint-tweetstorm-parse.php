<?php
/**
 * REST API endpoint for parsing Tweetstorms out of block content.
 *
 * @package automattic/jetpack
 * @since 9.0.0
 */

/**
 * Tweetstorm gatherer.
 *
 * @since 9.0.0
 */
class WPCOM_REST_API_V2_Endpoint_Tweetstorm_Parse extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'tweetstorm';

		if ( ! class_exists( 'Jetpack_Tweetstorm_Helper' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-tweetstorm-helper.php';
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/parse',
			array(
				'args'                                  => array(
					'blocks' => array(
						'description' => __( 'An array of serialized blocks, and editor-specific block information.', 'jetpack' ),
						'type'        => 'array',
						'required'    => true,
					),
				),
				'methods'                               => WP_REST_Server::EDITABLE,
				'callback'                              => array( $this, 'parse_tweetstorm' ),
				'allow_blog_token_when_site_is_private' => true,
				'permission_callback'                   => array( 'Jetpack_Tweetstorm_Helper', 'permissions_check' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/generate-cards',
			array(
				'args'                                  => array(
					'urls' => array(
						'description' => __( 'An array of URLs to generate Twitter card details for.', 'jetpack' ),
						'type'        => 'array',
						'required'    => true,
					),
				),
				'methods'                               => WP_REST_Server::EDITABLE,
				'callback'                              => array( $this, 'generate_cards' ),
				'allow_blog_token_when_site_is_private' => true,
				'permission_callback'                   => array( 'Jetpack_Tweetstorm_Helper', 'permissions_check' ),
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
		// The "block" attribute is serialised, unserialise it before passing it on.
		$blocks = array_map(
			function ( $block ) {
				$parsed_block = parse_blocks( $block['block'] );
				if ( count( $parsed_block ) > 0 ) {
					$block['block'] = $parsed_block[0];
					return $block;
				}

				return null;
			},
			$request['blocks']
		);

		// Remove any blocks that failed to unserialise.
		$blocks = array_values( array_filter( $blocks, 'is_array' ) );

		return Jetpack_Tweetstorm_Helper::parse( $blocks );
	}

	/**
	 * Grab the card content for a list of URLs.
	 *
	 * @param  WP_REST_Request $request The request.
	 * @return array The array of cards for the requested URLs.
	 */
	public function generate_cards( $request ) {
		return Jetpack_Tweetstorm_Helper::generate_cards( $request['urls'] );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Tweetstorm_Parse' );
