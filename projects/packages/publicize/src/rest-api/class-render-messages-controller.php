<?php
/**
 * Publicize: Render Messages Controller
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Publicize: Render Messages Controller class.
 *
 * Renders Publicize message templates for a given post and a batch of
 * connection inputs in a single request, so the block-editor preview can
 * fetch all enabled connections' previews in one round-trip when the
 * `social-message-templates` feature is enabled.
 *
 * POST takes a JSON body of `{ post_id, items: [...] }` and returns one
 * record per input item, in input order, keyed by client-supplied `id`
 * (typically the connection_id). Body-based POST is used instead of a GET
 * collection so multi-connection / long-message batches don't hit
 * infrastructure URL caps.
 *
 * @phan-constructor-used-for-side-effects
 */
class Render_Messages_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/render-messages';

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
				'callback'                       => array( $this, 'render_messages' ),
				'permission_callback'            => array( $this, 'permissions_check' ),
				'private_site_security_settings' => array(
					'allow_blog_token_access' => true,
				),
				'args'                           => array(
					'post_id' => array(
						'description' => __( 'The ID of the post to render the messages for.', 'jetpack-publicize-pkg' ),
						'type'        => 'integer',
						'required'    => true,
					),
					'items'   => array(
						'description' => __( 'List of per-connection render inputs.', 'jetpack-publicize-pkg' ),
						'type'        => 'array',
						'required'    => true,
						'minItems'    => 1,
						'items'       => array(
							'type'                 => 'object',
							'additionalProperties' => false,
							'required'             => array( 'id', 'network' ),
							'properties'           => array(
								'id'             => array(
									'description' => __( 'Client-supplied identifier echoed back in the response (typically the connection_id).', 'jetpack-publicize-pkg' ),
									'type'        => 'string',
								),
								'network'        => array(
									'description' => __( 'The social network slug (e.g. facebook, x, linkedin).', 'jetpack-publicize-pkg' ),
									'type'        => 'string',
								),
								'message'        => array(
									'description' => __( 'The message template to render. Empty uses the network default.', 'jetpack-publicize-pkg' ),
									'type'        => 'string',
									'default'     => '',
								),
								'is_social_post' => array(
									'description' => __( 'Whether the post will be shared as a social post (media attached) rather than a link share.', 'jetpack-publicize-pkg' ),
									'type'        => 'boolean',
									'default'     => false,
								),
							),
						),
					),
				),
				'schema'                         => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Retrieves the JSON schema for a single rendered-message item.
	 *
	 * @return array Schema data.
	 */
	public function get_item_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'publicize-render-messages-item',
			'type'       => 'object',
			'properties' => array(
				'id'               => array(
					'description' => __( 'Client-supplied identifier echoed back from the request.', 'jetpack-publicize-pkg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit' ),
				),
				'rendered_message' => array(
					'description' => __( 'The rendered message for this item. Absent when the item failed to render.', 'jetpack-publicize-pkg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit' ),
				),
				'error'            => array(
					'description' => __( 'Per-item error. Present only when this item failed to render.', 'jetpack-publicize-pkg' ),
					'type'        => 'object',
					'readonly'    => true,
					'context'     => array( 'view', 'edit' ),
					'properties'  => array(
						'code'    => array( 'type' => 'string' ),
						'message' => array( 'type' => 'string' ),
					),
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
	 * Render the messages for the given post and items.
	 *
	 * Top-level errors (feature off, post not found) short-circuit the whole batch.
	 * Per-item failures are returned as `{ id, error: { code, message } }` so a
	 * single bad item never fails the batch.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return mixed The rendered items array, or a WP_Error for top-level failures.
	 */
	public function render_messages( $request ) {
		if ( Utils::is_wpcom() ) {
			require_lib( 'publicize/util/message-templates' );

			if ( ! \Publicize\is_message_templates_enabled() ) {
				return new WP_Error(
					'feature_not_enabled',
					__( 'Publicize message templates are not enabled for this site.', 'jetpack-publicize-pkg' ),
					array( 'status' => 403 )
				);
			}

			$post_id = (int) $request->get_param( 'post_id' );
			$items   = (array) $request->get_param( 'items' );

			$post = get_post( $post_id );

			if ( ! $post ) {
				return new WP_Error(
					'post_not_found',
					__( 'Post not found.', 'jetpack-publicize-pkg' ),
					array( 'status' => 404 )
				);
			}

			return rest_ensure_response(
				\Publicize\render_messages_for_networks( $post, $items )
			);
		}

		// Self-hosted Jetpack: proxy the GET (with its query string) to WPCOM.
		return rest_ensure_response(
			$this->proxy_request_to_wpcom_as_blog( $request )
		);
	}
}
