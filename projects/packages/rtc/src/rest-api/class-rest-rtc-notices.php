<?php
/**
 * REST API controller for RTC notices.
 *
 * Handles:
 * - Join requests: when a non-admin is blocked by the collaborator limit,
 *   their browser records a join request so the admin can be notified.
 *
 * @package automattic/jetpack-rtc
 */

namespace Automattic\Jetpack\RTC;

use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Class REST_RTC_Notices
 */
class REST_RTC_Notices extends WP_REST_Controller {

	const JOIN_REQUEST_OPTION = 'rtc_pending_join_requests';

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			'wpcom/v2',
			'/rtc-notices/join-request',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'record_join_request' ),
				'permission_callback' => array( $this, 'check_edit_post_permission' ),
				'args'                => array(
					'post_id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			'wpcom/v2',
			'/rtc-notices/join-requests',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_join_requests' ),
				'permission_callback' => array( $this, 'check_admin_edit_post_permission' ),
				'args'                => array(
					'post_id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			'wpcom/v2',
			'/rtc-notices/join-requests/clear',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'clear_join_requests' ),
				'permission_callback' => array( $this, 'check_admin_edit_post_permission' ),
				'args'                => array(
					'post_id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * Check if the current user can edit the post specified in the request.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return bool|\WP_Error
	 */
	public function check_edit_post_permission( $request ) {
		$post_id = $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) ) {
			return new \WP_Error( 'rest_post_invalid_id', __( 'Invalid post ID.', 'jetpack-rtc' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to edit this post.', 'jetpack-rtc' ), array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * Check if the current user is an admin who can edit the post.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return bool|\WP_Error
	 */
	public function check_admin_edit_post_permission( $request ) {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		return $this->check_edit_post_permission( $request );
	}

	/**
	 * Record a join request from a blocked user.
	 * Stored as a transient per post so it auto-expires.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response
	 */
	public function record_join_request( $request ) {
		$post_id = $request->get_param( 'post_id' );
		$user    = wp_get_current_user();

		$key      = self::JOIN_REQUEST_OPTION . '_' . $post_id;
		$requests = get_transient( $key );
		if ( ! is_array( $requests ) ) {
			$requests = array();
		}

		$requests[ $user->ID ] = array(
			'userName' => $user->display_name,
			'userId'   => $user->ID,
			'time'     => time(),
		);

		// Expire after 2 minutes.
		set_transient( $key, $requests, 2 * MINUTE_IN_SECONDS );

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Get pending join requests for a post. Admin only.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response
	 */
	public function get_join_requests( $request ) {
		$post_id  = $request->get_param( 'post_id' );
		$key      = self::JOIN_REQUEST_OPTION . '_' . $post_id;
		$requests = get_transient( $key );

		if ( ! is_array( $requests ) ) {
			$requests = array();
		}

		// Filter out requests older than 60 seconds.
		$now    = time();
		$recent = array();
		foreach ( $requests as $uid => $req ) {
			if ( $now - $req['time'] < 60 ) {
				$recent[ $uid ] = $req;
			}
		}

		return rest_ensure_response( array( 'requests' => array_values( $recent ) ) );
	}

	/**
	 * Clear join requests for a post.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response
	 */
	public function clear_join_requests( $request ) {
		$post_id = $request->get_param( 'post_id' );
		delete_transient( self::JOIN_REQUEST_OPTION . '_' . $post_id );
		return rest_ensure_response( array( 'success' => true ) );
	}
}
