<?php
/**
 * Email Preview endpoint for the WordPress.com REST API.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Status\Host;

require_once __DIR__ . '/trait-wpcom-rest-api-proxy-request-trait.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Email_Preview
 *
 * Returns an email preview given a post id.
 */
class WPCOM_REST_API_V2_Endpoint_Email_Preview extends WP_REST_Controller {

	use WPCOM_REST_API_Proxy_Request_Trait;

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
			// if this is not a wpcom site, we need to proxy the request to wpcom
			'callback'            => ( ( new Host() )->is_wpcom_simple() ) ? array(
				$this,
				'email_preview',
			) : array( $this, 'proxy_request_to_wpcom_as_user' ),
			'permission_callback' => array( $this, 'permissions_check' ),
			'args'                => array(
				'id'     => array(
					'description' => __( 'Unique identifier for the post.', 'jetpack' ),
					'type'        => 'integer',
				),
				'access' => array(
					'description'       => __( 'Access level.', 'jetpack' ),
					'enum'              => array( Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY, Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_SUBSCRIBERS, Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS ),
					'default'           => Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY,
					'validate_callback' => function ( $param ) {
						return in_array(
							$param,
							array(
								Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY,
								Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_SUBSCRIBERS,
								Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS,
							),
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
	 * Checks if the user is connected and has access to edit the post
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return true|WP_Error True if the request has edit access, WP_Error object otherwise.
	 */
	public function permissions_check( $request ) {
		if ( ! ( new Host() )->is_wpcom_simple() ) {
			if ( ! ( new Manager() )->is_user_connected() ) {
				return new WP_Error(
					'rest_cannot_send_email_preview',
					__( 'Please connect your user account to WordPress.com', 'jetpack' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
		}

		$post = get_post( $request->get_param( 'post_id' ) );

		if ( ! $post ) {
			return new \WP_Error(
				'post_not_found',
				__( 'Post not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		if ( ! current_user_can( 'edit_post', $post->ID ) ) {
			return new WP_Error(
				'rest_forbidden_context',
				__( 'Please connect your user account to WordPress.com', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Returns an email preview of a post.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function email_preview( $request ) {
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
