<?php
/**
 * The Social Note Controller class.
 * Registers the REST routes for Social.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

use Automattic\Jetpack\Connection\Rest_Authentication;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Server;

/**
 * Registers the REST routes for Social.
 */
class REST_Social_Note_Controller extends WP_REST_Controller {
	const SOCIAL_SHARES_POST_META_KEY = '_publicize_shares';
	/**
	 * Registers the REST routes for Social.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jetpack/v4',
			'/social/update-post-meta',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_post_shares_meta' ),
					'permission_callback' => array( $this, 'update_post_shares_meta_permission_callback' ),
					'args'                => array(
						'post_id' => array(
							'type'     => 'integer',
							'required' => true,
						),
						'meta'    => array(
							'type'       => 'object',
							'required'   => true,
							'properties' => array(
								'_publicize_shares' => array(
									'type'     => 'array',
									'required' => true,
								),
							),
						),
					),
				),
			)
		);
	}

	/**
	 * Update the post meta
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public function update_post_shares_meta( $request ) {
		$request_body = $request->get_json_params();

		$post_id   = $request_body['post_id'];
		$post_meta = $request_body['meta'];
		$post      = get_post( $post_id );

		if ( $post && $post->post_type === Note::JETPACK_SOCIAL_NOTE_CPT && $post->post_status === 'publish' && isset( $post_meta[ self::SOCIAL_SHARES_POST_META_KEY ] ) ) {
			update_post_meta( $post_id, self::SOCIAL_SHARES_POST_META_KEY, $post_meta[ self::SOCIAL_SHARES_POST_META_KEY ] );
			return rest_ensure_response( new \WP_REST_Response() );
		}

		return new WP_Error(
			'rest_cannot_edit',
			__( 'Failed to update the post meta', 'jetpack-social' ),
			array( 'status' => 500 )
		);
	}

	/**
	 * Permissions callback.
	 */
	public function update_post_shares_meta_permission_callback() {
		if ( Rest_Authentication::is_signed_with_blog_token() ) {
			return true;
		}

		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-social'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}
}
