<?php
/**
 * Knowledge REST API Controller.
 *
 * @package automattic/jetpack-knowledge
 */

namespace Automattic\Jetpack\Knowledge;

use stdClass;
use WP_Error;
use WP_Post;
use WP_Post_Type;
use WP_REST_Posts_Controller;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST API controller for knowledge posts.
 */
class Knowledge_REST_Controller extends WP_REST_Posts_Controller {

	/**
	 * Gate the knowledge collection on the post-type read capability.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$post_type = get_post_type_object( $this->post_type );
		if ( ! current_user_can( $post_type->cap->read ) ) {
			return new WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to view knowledge.', 'jetpack-knowledge' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return parent::get_items_permissions_check( $request );
	}

	/**
	 * Scope collection queries to rows readable by the current user.
	 *
	 * @param array                $prepared_args Prepared WP_Query arguments.
	 * @param WP_REST_Request|null $request       Full details about the request.
	 * @return array Updated WP_Query arguments.
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		$query_args         = parent::prepare_items_query( $prepared_args, $request );
		$query_args['perm'] = 'readable';

		return $query_args;
	}

	/**
	 * Gate per-item reads on the user-specific read capability.
	 *
	 * @param WP_Post $post Post object.
	 * @return bool Whether the post can be read.
	 */
	public function check_read_permission( $post ) {
		if ( ! current_user_can( 'read_post', $post->ID ) ) {
			return false;
		}

		return parent::check_read_permission( $post );
	}

	/**
	 * Restrict the status surface for callers without publish capability
	 * to `private`. Administrators retain the parent's full status surface.
	 *
	 * @param string       $post_status Requested post status.
	 * @param WP_Post_Type $post_type   Post type object.
	 * @return string|WP_Error Status, or WP_Error if not permitted.
	 */
	protected function handle_status_param( $post_status, $post_type ) {
		if ( ! current_user_can( $post_type->cap->publish_posts ) ) {
			if ( 'private' !== $post_status ) {
				return new WP_Error(
					'rest_cannot_publish',
					__( 'Sorry, you are only allowed to set knowledge to a private status.', 'jetpack-knowledge' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
			return $post_status;
		}

		return parent::handle_status_param( $post_status, $post_type );
	}

	/**
	 * Default the status to `private` on create when none is supplied (the parent would fall back to
	 * `draft`).
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass|WP_Error Prepared post object or error.
	 */
	protected function prepare_item_for_database( $request ) {
		if ( ! isset( $request['id'] ) && null === $request['status'] ) {
			$request->set_param( 'status', 'private' );
		}
		return parent::prepare_item_for_database( $request );
	}
}
