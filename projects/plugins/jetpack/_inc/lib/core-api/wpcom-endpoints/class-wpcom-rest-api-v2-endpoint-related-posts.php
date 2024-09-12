<?php
/**
 * REST API endpoint for Related Posts
 *
 * @package automattic/jetpack
 * @since 12.6
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_Related_Posts
 */
class WPCOM_REST_API_V2_Endpoint_Related_Posts extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';
		$this->namespace     = $this->base_api_path . '/' . $this->version;
		$this->rest_base     = '/related-posts';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_options' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/enable',
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'enable_rp' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the post.', 'jetpack' ),
						'type'        => 'integer',
					),
				),
				array(
					'show_in_index'       => true,
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_related_posts' ),
					'permission_callback' => array( $this, 'get_related_posts_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Gets the site's Related Posts Options.
	 *
	 * @return WP_REST_Response Array of information about the site's Related Posts options.
	 * - enabled: Whether Related Posts is enabled.
	 * - options: Array of options for Related Posts.
	 */
	public function get_options() {
		$options = Jetpack_Options::get_option( 'relatedposts', array() );
		$enabled = isset( $options['enabled'] ) ? (bool) $options['enabled'] : false;

		return rest_ensure_response(
			array(
				'enabled' => $enabled,
				'options' => $options,
			)
		);
	}

	/**
	 * Enables the site's Related Posts.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response Array confirming the new status.
	 */
	public function enable_rp( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$old_relatedposts_options                = Jetpack_Options::get_option( 'relatedposts', array() );
		$relatedposts_options_to_save            = $old_relatedposts_options;
		$relatedposts_options_to_save['enabled'] = true;

		// Enable Related Posts.
		$enable = Jetpack_Options::update_option( 'relatedposts', $relatedposts_options_to_save );

		return rest_ensure_response(
			array(
				'enabled' => (bool) $enable,
			)
		);
	}

	/**
	 * Checks if a given request has access to get the related posts.
	 *
	 * @since 4.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if the request has read access for the related posts, WP_Error object or false otherwise.
	 */
	public function get_related_posts_permissions_check( $request ) {
		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Sorry, you are not allowed to get the related post.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Get the related posts
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_REST_Response Array The related posts
	 */
	public function get_related_posts( $request ) {
		$post = $this->get_post( $request['id'] );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		if ( ! class_exists( 'Jetpack_RelatedPosts' ) ) {
			require_once JETPACK__PLUGIN_DIR . 'modules/related-posts/jetpack-related-posts.php';
		}
		$related_posts = \Jetpack_RelatedPosts::init()->get_for_post_id( $post->ID, array( 'size' => 6 ) );
		return rest_ensure_response( $related_posts );
	}

	/**
	 * Gets the post, if the ID is valid.
	 *
	 * @param int $id Supplied ID.
	 * @return WP_Post|WP_Error Post object if ID is valid, WP_Error otherwise.
	 */
	public function get_post( $id ) {
		$error = new WP_Error(
			'rest_post_invalid_id',
			__( 'Invalid post ID.', 'jetpack' ),
			array( 'status' => 404 )
		);

		if ( (int) $id <= 0 ) {
			return $error;
		}

		$post = get_post( (int) $id );
		if ( empty( $post ) || empty( $post->ID ) ) {
			return $error;
		}

		return $post;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Related_Posts' );
