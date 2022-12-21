<?php
/**
 * REST API endpoint for the CoAuthor blocks.
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_Coauthor
 */
class WPCOM_REST_API_V2_Endpoint_Coauthor extends WP_REST_Controller {
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
	public $rest_base = 'coauthor';

	/**
	 * Allow new completion every X seconds. Will return cached result otherwise.
	 *
	 * @var int
	 */
	public $text_completion_cooldown_seconds = 10;

	/**
	 * Cache images for a prompt for a month.
	 *
	 * @var int
	 */
	public $image_generation_cache_timeout = MONTH_IN_SECONDS;

	/**
	 * WPCOM_REST_API_V2_Endpoint_Coauthor constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
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
					'permission_callback' => array( $this, 'get_status_permission_check' ),
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
					'permission_callback' => array( $this, 'get_status_permission_check' ),
				),
				'args' => array(
					'prompt' => array( 'required' => true ),
					'token'  => array( 'required' => false ),
				),
			)
		);
	}

	/**
	 * Ensure the user has proper permissions
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return boolean
	 */
	public function get_status_permission_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to access CoAuthor help on this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Get completions for a given text.
	 *
	 * @param  WP_REST_Request $request The request.
	 */
	public function request_gpt_completion( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Here we can make requests as site or as user to fetch data from WordPress.com.
		return 'something';
	}

	/**
	 * Get image generations for a given prompt.
	 *
	 * @param  WP_REST_Request $request The request.
	 */
	public function request_dalle_generation( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Here we can make requests as site or as user to fetch data from WordPress.com.
		return 'something';
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Coauthor' );
