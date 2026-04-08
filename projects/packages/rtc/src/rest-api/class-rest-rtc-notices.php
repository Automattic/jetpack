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

	// Kept as wpcom_* for backward compatibility with existing user meta.
	const OPTION_KEY          = 'wpcom_rtc_welcome_notice_dismissed';
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
	 * Check if the current user is logged in.
	 *
	 * @return bool
	 */
	public function check_permission() {
		return is_user_logged_in();
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
	 * Dismiss the welcome notice.
	 *
	 * @return WP_REST_Response
	 */
	public function dismiss_notice() {
		update_user_option( get_current_user_id(), self::OPTION_KEY, 'dismissed' );
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
	 * Uses user options (not user meta) so dismissal is per-site on multisite/Simple.
	 *
	 * @return bool
	 */
	public static function is_dismissed() {
		return 'dismissed' === get_user_option( self::OPTION_KEY, get_current_user_id() );
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

		// Send async notifications (bell + email) to the plan owner so
		// they see it even when they are not in the editor.
		self::send_async_admin_notifications( $post_id, $user );

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Send async notifications (bell + email) to the plan owner when a
	 * non-admin is blocked by the collaborator limit.
	 *
	 * Rate-limited: only fires once per configurable interval (default 24 h)
	 * per (blog, post, blocked user) combination.
	 *
	 * @param int      $post_id The post the user was trying to join.
	 * @param \WP_User $user    The blocked user.
	 */
	public static function send_async_admin_notifications( $post_id, $user ) {
		// Only send when limit notices are enabled.
		if ( ! apply_filters( 'jetpack_rtc_enable_limit_notices', false ) ) {
			return;
		}

		$owner_id = \Automattic\Jetpack\RTC::get_plan_owner_id();
		if ( ! $owner_id ) {
			return;
		}

		// Rate-limit: one notification set per (blog, post, user) per interval.
		$blog_id          = get_current_blog_id();
		$throttle_key     = sprintf( 'rtc_notif_sent_%d_%d_%d', $blog_id, $post_id, $user->ID );
		$throttle_seconds = (int) apply_filters( 'jetpack_rtc_async_notification_interval', DAY_IN_SECONDS );

		if ( get_transient( $throttle_key ) ) {
			return;
		}

		// Set the throttle *before* sending so concurrent requests don't
		// race past the check.
		set_transient( $throttle_key, 1, $throttle_seconds );

		self::send_admin_bell_notification( $blog_id, $post_id, $user, $owner_id );
		self::send_admin_email_notification( $blog_id, $post_id, $user, $owner_id );
	}

	/**
	 * Send a WordPress.com bell notification to the plan owner.
	 *
	 * @param int      $blog_id  The blog ID.
	 * @param int      $post_id  The post the user was trying to join.
	 * @param \WP_User $user     The blocked user.
	 * @param int      $owner_id The plan owner's user ID.
	 */
	public static function send_admin_bell_notification( $blog_id, $post_id, $user, $owner_id ) {
		wpcom_send_bell_notification(
			$owner_id,
			'rtc_collaborator_blocked',
			array(
				'blog_id' => $blog_id,
				'post_id' => $post_id,
				'user_id' => $user->ID,
			),
			sprintf( 'rtc-blocked-%d-%d-%d', $blog_id, $post_id, $user->ID )
		);
	}

	/**
	 * Send an HTML email to the plan owner about a blocked collaborator.
	 *
	 * The email design mirrors the in-editor RTC modal: hero illustration,
	 * title, description, and an upgrade CTA button.
	 *
	 * @param int      $blog_id  The blog ID.
	 * @param int      $post_id  The post the user was trying to join.
	 * @param \WP_User $user     The blocked user.
	 * @param int      $owner_id The plan owner's user ID.
	 */
	public static function send_admin_email_notification( $blog_id, $post_id, $user, $owner_id ) {
		$owner = get_userdata( $owner_id );
		if ( ! $owner || ! $owner->user_email ) {
			return;
		}

		$post_title = get_the_title( $post_id );
		$site_slug  = wpcom_get_site_slug();
		$post_edit  = get_edit_post_link( $post_id, 'raw' );

		$upgrade_url = 'https://wordpress.com/setup/plan-upgrade/plans?' . http_build_query(
			array(
				'siteSlug'  => $site_slug,
				'feature'   => 'wpcom-ws-rtc',
				'cancel_to' => $post_edit ? $post_edit : admin_url( 'edit.php' ),
			)
		);

		$hero_url = 'https://s0.wp.com/wp-content/mu-plugins/jetpack-mu-wpcom-plugin/moon/jetpack_vendor/automattic/jetpack-mu-wpcom/src/features/gutenberg-rtc-notices/rtc-hero.png';

		/* translators: %s: site name */
		$subject = sprintf( __( 'A team member is waiting to collaborate on %s', 'jetpack-rtc' ), get_bloginfo( 'name' ) );

		$heading = __( "Someone\xe2\x80\x99s waiting to join", 'jetpack-rtc' );

		$body = sprintf(
			/* translators: 1: user name, 2: post title */
			__( '%1$s wanted to join the editing session for &#8220;%2$s&#8221;, but your plan&#8217;s collaborator limit has been reached. Upgrade to remove the limit and let your team work together in real time.', 'jetpack-rtc' ),
			esc_html( $user->display_name ),
			esc_html( $post_title )
		);

		$cta_label = __( 'Upgrade to collaborate', 'jetpack-rtc' );

		$html = wpcom_build_email_html( $hero_url, $heading, $body, $upgrade_url, $cta_label );
		wpcom_send_email_notification( $owner->user_email, $subject, $html );
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
