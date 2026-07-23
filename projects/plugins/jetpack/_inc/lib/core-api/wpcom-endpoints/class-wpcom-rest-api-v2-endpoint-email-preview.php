<?php
/**
 * Email Preview endpoint for the WordPress.com REST API.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Email_Preview
 *
 * Returns an email preview given a post id.
 */
class WPCOM_REST_API_V2_Endpoint_Email_Preview extends WP_REST_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/email-preview';
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Registers the routes for email preview.
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		$options = array(
			'show_in_index'       => true,
			'methods'             => 'GET',
			'callback'            => array( $this, 'email_preview' ),
			'permission_callback' => array( $this, 'permissions_check' ),
			'args'                => array(
				'id'     => array(
					'description' => __( 'Unique identifier for the post.', 'jetpack' ),
					'type'        => 'integer',
				),
				'access' => array(
					'description'       => __( 'Access level.', 'jetpack' ),
					'enum'              => array( 'everybody', 'subscribers', 'paid_subscribers' ),
					'default'           => 'everybody',
					'validate_callback' => function ( $param ) {
						return in_array(
							$param,
							array( 'everybody', 'subscribers', 'paid_subscribers' ),
							true
						);
					},
				),
			),
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			$options
		);
	}

	/**
	 * Checks whether the request may render an email preview.
	 *
	 * The preview only renders the site's own post, so it needs the site to be connected
	 * but not the requesting user. The `edit_post` capability check is the authorization.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return true|WP_Error True if the request may render the preview, WP_Error object otherwise.
	 */
	public function permissions_check( $request ) {
		$is_wpcom_simple = ( new Host() )->is_wpcom_simple();

		// On a self-hosted site, the site must be connected before we can proxy the preview to WordPress.com.
		if ( ! $is_wpcom_simple && ! ( new Manager() )->is_connected() ) {
			return new WP_Error(
				'rest_cannot_send_email_preview',
				__( 'Please connect your site to WordPress.com to preview emails.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$post = get_post( $request->get_param( 'post_id' ) );

		if ( ! $post ) {
			return new \WP_Error(
				'post_not_found',
				__( 'Post not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		// Authorize any user who can edit the post: the local editor on self-hosted, a user-token request on WordPress.com.
		if ( current_user_can( 'edit_post', $post->ID ) ) {
			return true;
		}

		// On WordPress.com, a blog-token proxy authenticates as user 0 and fails the edit_post check
		// above, so authorize it by site ownership instead. The self-hosted endpoint already verified a
		// local editor could edit the post, and the blog token never reaches the browser.
		if ( $is_wpcom_simple && $this->is_authorized_blog_token_request() ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden_context',
			__( 'Sorry, you are not allowed to preview emails on this site.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Whether the request is a valid blog-token request authorized for the current site.
	 *
	 * Runs on WordPress.com, where a proxied blog token authenticates as user 0.
	 *
	 * @return bool True if the request is authorized for the current Jetpack site.
	 */
	private function is_authorized_blog_token_request() {
		if ( ! function_exists( 'is_jetpack_site' ) || ! is_jetpack_site( get_current_blog_id() ) ) {
			return false;
		}

		if ( ! class_exists( 'WPCOM_REST_API_V2_Endpoint_Jetpack_Auth' ) ) {
			require_once dirname( __DIR__ ) . '/rest-api-plugins/endpoints/jetpack-auth.php';
		}

		$jp_auth_endpoint = new WPCOM_REST_API_V2_Endpoint_Jetpack_Auth();

		return true === $jp_auth_endpoint->is_jetpack_authorized_for_site();
	}

	/**
	 * Returns an email preview of a post, or proxies the request to WordPress.com on non-wpcom sites.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function email_preview( $request ) {
		// On a non-wpcom site, proxy to WordPress.com with the user's token, falling back to the site's blog token.
		if ( ! ( new Host() )->is_wpcom_simple() ) {
			return $this->proxy_request_to_wpcom( $request, '', 'user', true );
		}

		$post_id = $request['post_id'];
		$access  = $request['access'];
		$post    = get_post( $post_id );
		return rest_ensure_response(
			array(
				/**
				* Filters the generated email preview HTML.
				*
				* @since 13.8
				*
				* @param string $html   The generated HTML for the email preview.
				* @param WP_Post $post  The post object.
				* @param string $access The access level.
				*/
				'html' => apply_filters( 'jetpack_generate_email_preview_html', '', $post, $access ),
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Email_Preview' );
