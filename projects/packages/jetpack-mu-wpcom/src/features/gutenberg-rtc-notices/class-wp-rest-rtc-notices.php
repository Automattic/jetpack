<?php
/**
 * REST API controller for RTC notices.
 *
 * Handles:
 * - Per-user dismissal of the RTC welcome notice via user meta
 *   (works on Simple, Atomic, and self-hosted sites).
 * - Join requests: when a non-admin is blocked by the collaborator limit,
 *   their browser records a join request so the admin can be notified.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Class WP_REST_RTC_Notices
 */
class WP_REST_RTC_Notices extends WP_REST_Controller {

	const META_KEY            = 'wpcom_rtc_welcome_notice_dismissed';
	const JOIN_REQUEST_OPTION = 'rtc_pending_join_requests';

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			'wpcom/v2',
			'/rtc-notices/dismiss',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'dismiss_notice' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);

		register_rest_route(
			'wpcom/v2',
			'/rtc-notices/status',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_status' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);

		register_rest_route(
			'wpcom/v2',
			'/rtc-notices/join-request',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'record_join_request' ),
				'permission_callback' => array( $this, 'check_permission' ),
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
				'permission_callback' => array( $this, 'check_admin_permission' ),
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
				'permission_callback' => array( $this, 'check_admin_permission' ),
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
	 * Check if the current user is logged in.
	 *
	 * @return bool
	 */
	public function check_permission() {
		return is_user_logged_in();
	}

	/**
	 * Check if the current user is an admin.
	 *
	 * @return bool
	 */
	public function check_admin_permission() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Dismiss the welcome notice.
	 *
	 * @return WP_REST_Response
	 */
	public function dismiss_notice() {
		update_user_meta( get_current_user_id(), self::META_KEY, 'dismissed' );
		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Get the dismissed status.
	 *
	 * @return WP_REST_Response
	 */
	public function get_status() {
		return rest_ensure_response( array( 'dismissed' => self::is_dismissed() ) );
	}

	/**
	 * Check if the welcome notice is dismissed.
	 *
	 * @return bool
	 */
	public static function is_dismissed() {
		$user_id = get_current_user_id();

		if ( ! metadata_exists( 'user', $user_id, self::META_KEY ) ) {
			return false;
		}

		return 'dismissed' === get_user_meta( $user_id, self::META_KEY, true );
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
