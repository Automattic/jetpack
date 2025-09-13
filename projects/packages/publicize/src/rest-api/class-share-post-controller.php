<?php
/**
 * Publicize: Share post
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

/**
 * Publicize: Share post class.
 *
 * @phan-constructor-used-for-side-effects
 */
class Share_Post_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * The constructor sets the route namespace, rest_base, and registers our API route and endpoint.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/share-post';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {

		$args = array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'share_post' ),
			'permission_callback' => array( $this, 'permissions_check' ),
			'args'                => array(
				'message'             => array(
					'description'       => __( 'The message to share.', 'jetpack-publicize-pkg' ),
					'type'              => 'string',
					'required'          => true,
					'validate_callback' => function ( $param ) {
						return is_string( $param );
					},
					'sanitize_callback' => 'sanitize_textarea_field',
				),
				'skipped_connections' => array(
					'description'       => __( 'Array of external connection IDs to skip sharing.', 'jetpack-publicize-pkg' ),
					'type'              => 'array',
					'required'          => false,
					'validate_callback' => function ( $param ) {
						return is_array( $param );
					},
					'sanitize_callback' => function ( $param ) {
						return array_map( 'absint', $param );
					},
				),
				'async'               => array(
					'description' => __( 'Whether to share the post asynchronously.', 'jetpack-publicize-pkg' ),
					'type'        => 'boolean',
					'default'     => false,
				),
			),
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<postId>\d+)',
			$args
		);

		if ( Utils::is_wpcom() ) {
			// WPCOM Legacy route for backwards compatibility.
			// TODO: Remove this after April 2025 release of Jetpack.
			register_rest_route(
				$this->namespace,
				'/posts/(?P<postId>\d+)/publicize',
				$args
			);
		}
	}

	/**
	 * Ensure the user has proper tokens and permissions to publish posts on this blog.
	 *
	 * @return WP_Error|boolean
	 */
	public function permissions_check() {
		return $this->publicize_permissions_check();
	}

	/**
	 * If this method callback is executed on WPCOM, we share the post using republicize_post(). If this method callback
	 * is executed on a Jetpack site, we make an API call to WPCOM using wpcom_json_api_request_as_user() and return
	 * the results. In both cases, this file and method are executed, as this file is synced from Jetpack to WPCOM.
	 *
	 * @param  WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error The publicize results, including two arrays: `results` and `errors`
	 */
	public function share_post( $request ) {
		$post_id = $request->get_param( 'postId' );

		if ( ! Utils::is_wpcom() ) {
			return rest_ensure_response(
				$this->proxy_request_to_wpcom_as_user( $request, $post_id )
			);
		}

		$message             = trim( $request->get_param( 'message' ) );
		$skip_connection_ids = $request->get_param( 'skipped_connections' );
		$async               = (bool) $request->get_param( 'async' );
		$post                = get_post( $post_id );

		if ( empty( $post ) ) {
			return new WP_Error( 'not_found', __( 'Cannot find that post.', 'jetpack-publicize-pkg' ), array( 'status' => 404 ) );
		}
		if ( 'publish' !== $post->post_status ) {
			return new WP_Error( 'not_published', __( 'Only published posts can be shared.', 'jetpack-publicize-pkg' ), array( 'status' => 400 ) );
		}

		global $publicize;

		// @phan-suppress-next-line PhanUndeclaredMethod - We are on WPCOM where republicize_post is available.
		$result = $publicize->republicize_post( (int) $post_id, $message, $skip_connection_ids, true, ! $async, get_current_user_id() );
		if ( false === $result ) {
			return new WP_Error( 'not_found', __( 'Cannot find that post.', 'jetpack-publicize-pkg' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response( $result );
	}
}
