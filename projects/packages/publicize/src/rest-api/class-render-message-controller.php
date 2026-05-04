<?php
/**
 * Publicize: Render Message Controller
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Publicize: Render Message Controller class.
 *
 * Renders a Publicize message template for a given post and network, so the
 * block-editor preview can show what will actually be published when the
 * `social-message-templates` feature is enabled.
 *
 * @phan-constructor-used-for-side-effects
 */
class Render_Message_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/render-message';

		$this->allow_requests_as_blog = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'                        => WP_REST_Server::CREATABLE,
				'callback'                       => array( $this, 'render_message' ),
				'permission_callback'            => array( $this, 'permissions_check' ),
				'private_site_security_settings' => array(
					'allow_blog_token_access' => true,
				),
				'args'                           => array(
					'post_id'        => array(
						'description' => __( 'The ID of the post to render the message for.', 'jetpack-publicize-pkg' ),
						'type'        => 'integer',
						'required'    => true,
					),
					'network'        => array(
						'description' => __( 'The social network slug (e.g. facebook, x, linkedin).', 'jetpack-publicize-pkg' ),
						'type'        => 'string',
						'required'    => true,
					),
					'message'        => array(
						'description' => __( 'The message template to render. If empty, the default template for the network is used.', 'jetpack-publicize-pkg' ),
						'type'        => 'string',
						'required'    => false,
						'default'     => '',
					),
					'is_social_post' => array(
						'description' => __( 'Whether the post will be shared as a social post (media attached) rather than a link share.', 'jetpack-publicize-pkg' ),
						'type'        => 'boolean',
						'required'    => false,
						'default'     => false,
					),
				),
				'schema'                         => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Retrieves the JSON schema for the rendered message response.
	 *
	 * @return array Schema data.
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'publicize-render-message',
			'type'       => 'object',
			'properties' => array(
				'rendered_message' => array(
					'description' => __( 'The rendered message for the given post and network.', 'jetpack-publicize-pkg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit' ),
				),
			),
		);
	}

	/**
	 * Permission check.
	 *
	 * Preserves the blog-token proxy path via Base_Controller::publicize_permissions_check()
	 * (which returns true for authorized blog requests when allow_requests_as_blog is set),
	 * and enforces post-level `edit_post` capability for regular user requests.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if authorized, WP_Error otherwise.
	 */
	public function permissions_check( $request ) {
		$base_check = $this->publicize_permissions_check();

		if ( is_wp_error( $base_check ) ) {
			return $base_check;
		}

		// Blog-token proxy requests don't have a user context; the publicize check
		// above already returned true for those.
		if ( self::is_authorized_blog_request() ) {
			return true;
		}

		$post_id = (int) $request->get_param( 'post_id' );

		if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
			return new WP_Error(
				'invalid_user_permission_publicize',
				__( 'Sorry, you are not allowed to access Jetpack Social data for this post.', 'jetpack-publicize-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Render the message for the given post and network.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error The rendered message, or an error.
	 */
	public function render_message( $request ) {
		$post_id        = (int) $request->get_param( 'post_id' );
		$network        = (string) $request->get_param( 'network' );
		$message        = (string) $request->get_param( 'message' );
		$is_social_post = (bool) $request->get_param( 'is_social_post' );

		if ( Utils::is_wpcom() ) {
			require_lib( 'publicize/util/message-templates' );

			if ( ! \Publicize\is_message_templates_enabled() ) {
				return new WP_Error(
					'feature_not_enabled',
					__( 'Publicize message templates are not enabled for this site.', 'jetpack-publicize-pkg' ),
					array( 'status' => 403 )
				);
			}

			$post = get_post( $post_id );

			if ( ! $post ) {
				return new WP_Error(
					'post_not_found',
					__( 'Post not found.', 'jetpack-publicize-pkg' ),
					array( 'status' => 404 )
				);
			}

			$rendered = \Publicize\render_message_for_network( $post, $network, $message, null, $is_social_post );

			if ( null === $rendered ) {
				$rendered = '';
			}

			return rest_ensure_response(
				array(
					'rendered_message' => $rendered,
				)
			);
		}

		// Self-hosted Jetpack: proxy the request to WPCOM.
		return rest_ensure_response(
			$this->proxy_request_to_wpcom_as_blog( $request )
		);
	}
}
