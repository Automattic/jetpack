<?php
/**
 * REST API endpoint for the Gathering Tweetstorms block.
 *
 * @package automattic/jetpack
 * @since 8.7.0
 */

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
				'args'                           => array(
					'url' => array(
						'description' => __( 'The tweet URL to gather from.', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
				'methods'                        => WP_REST_Server::READABLE,
				'callback'                       => array( $this, 'gather_tweetstorm' ),
				'private_site_security_settings' => array(
					'allow_blog_token_access' => true,
				),
				'permission_callback'            => array( $this, 'tweetstorm_permissions_check' ),
			)
		);
	}

	/**
	 * Checks if a given request is allowed to gather tweets.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return true|WP_Error True if the request has access to gather tweets from a thread, WP_Error object otherwise.
	 */
	public function tweetstorm_permissions_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$blog_id = get_current_blog_id();

		/*
		 * User hitting the endpoint hosted on their Jetpack site, from their Jetpack site,
		 * or hitting the endpoint hosted on WPCOM, from their WPCOM site.
		 */
		if ( current_user_can_for_blog( $blog_id, 'edit_posts' ) ) {
			return true;
		}

		// Jetpack hitting the endpoint hosted on WPCOM, from a Jetpack site with a blog token.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( is_jetpack_site( $blog_id ) ) {
				if ( ! class_exists( 'WPCOM_REST_API_V2_Endpoint_Jetpack_Auth' ) ) {
					require_once __DIR__ . '/jetpack-auth.php';
				}

				$jp_auth_endpoint = new WPCOM_REST_API_V2_Endpoint_Jetpack_Auth();
				if ( true === $jp_auth_endpoint->is_jetpack_authorized_for_site() ) {
					return true;
				}
			}
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to gather tweets on this site.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
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
