<?php
/**
 * REST API endpoint for the Jetpack AI blocks.
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI
 */
class WPCOM_REST_API_V2_Endpoint_AI extends WP_REST_Controller {
	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'jetpack-ai';

	/**
	 * WPCOM_REST_API_V2_Endpoint_AI constructor.
	 */
	public function __construct() {
		$this->is_wpcom                     = false;
		$this->wpcom_is_wpcom_only_endpoint = true;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->is_wpcom = true;
		}

		if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Checks if a given request is allowed to get AI data from WordPress.com.
	 *
	 * @return true|WP_Error True if the request has access, WP_Error object otherwise.
	 */
	public function permissions_check() {

		if ( ! current_user_can( 'edit_posts' ) ) {
			// Only post editors can access the endpoints
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to access Jetpack AI help on this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// Only allow WPCOM simple sites and Atomic
			if ( get_current_site()->id !== 1 ) {
				return true;
			}
		} elseif ( ( new Automattic\Jetpack\Status\Host() )->is_woa_site() ) {
			// If not WPCOM, we allow only of this is a WoA site
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to access Jetpack AI help on this site.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/completions',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'request_gpt_completion' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				'args' => array(
					'content' => array( 'required' => true ),
					'token'   => array( 'required' => false ),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/images/generations',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'request_dalle_generation' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				'args' => array(
					'prompt' => array( 'required' => true ),
					'token'  => array( 'required' => false ),
				),
			)
		);
	}

	/**
	 * Get completions for a given text.
	 *
	 * @param  WP_REST_Request $request The request.
	 */
	public function request_gpt_completion( $request ) {
		return Jetpack_AI_Helper::get_gpt_completion( $request['content'] );
	}

	/**
	 * Get image generations for a given prompt.
	 *
	 * @param  WP_REST_Request $request The request.
	 */
	public function request_dalle_generation( $request ) {
		return Jetpack_AI_Helper::get_dalle_generation( $request['prompt'] );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_AI' );
