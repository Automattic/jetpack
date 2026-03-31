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
	 * @return bool|WP_Error
	 */
	public function check_edit_post_permission( $request ) {
		$post_id = $request->get_param( 'post_id' );

		if ( ! get_post( $post_id ) ) {
			return new \WP_Error( 'rest_post_invalid_id', __( 'Invalid post ID.', 'jetpack-mu-wpcom' ), array( 'status' => 404 ) );
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return new \WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to edit this post.', 'jetpack-mu-wpcom' ), array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * Check if the current user is an admin who can edit the post.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return bool|WP_Error
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
		if ( ! apply_filters( 'wpcom_rtc_enable_limit_notices', false ) ) {
			return;
		}

		if ( ! function_exists( 'wpcom_rtc_get_plan_owner_id' ) ) {
			return;
		}

		$owner_id = wpcom_rtc_get_plan_owner_id();
		if ( ! $owner_id ) {
			return;
		}

		// Rate-limit: one notification set per (blog, post, user) per interval.
		$blog_id          = get_current_blog_id();
		$throttle_key     = sprintf( 'rtc_notif_sent_%d_%d_%d', $blog_id, $post_id, $user->ID );
		$throttle_seconds = (int) apply_filters( 'wpcom_rtc_async_notification_interval', DAY_IN_SECONDS );

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
		if ( ! function_exists( 'notes_send_callback' ) ) {
			return;
		}

		notes_send_callback(
			$owner_id,
			'rtc_collaborator_blocked',
			array(
				'blog_id' => $blog_id,
				'post_id' => $post_id,
				'user_id' => $user->ID,
			),
			sprintf( 'rtc-blocked-%d-%d-%d', $blog_id, $post_id, $user->ID ),
			1,     // Mark as unread.
			false  // Allow updating existing note.
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
		$site_slug  = function_exists( 'wpcom_get_site_slug' ) ? wpcom_get_site_slug() : wp_parse_url( home_url(), PHP_URL_HOST );
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
		$subject = sprintf( __( 'A team member is waiting to collaborate on %s', 'jetpack-mu-wpcom' ), get_bloginfo( 'name' ) );

		$heading = __( "Someone\xe2\x80\x99s waiting to join", 'jetpack-mu-wpcom' );

		$body = sprintf(
			/* translators: 1: user name, 2: post title */
			__( '%1$s wanted to join the editing session for &#8220;%2$s&#8221;, but your plan&#8217;s collaborator limit has been reached. Upgrade to remove the limit and let your team work together in real time.', 'jetpack-mu-wpcom' ),
			esc_html( $user->display_name ),
			esc_html( $post_title )
		);

		$cta_label = __( 'Upgrade to collaborate', 'jetpack-mu-wpcom' );

		$html = self::build_email_html( $hero_url, $heading, $body, $upgrade_url, $cta_label );

		$send = function_exists( 'wp_html_mail' ) ? 'wp_html_mail' : 'wp_mail';

		if ( 'wp_mail' === $send ) {
			add_filter( 'wp_mail_content_type', array( __CLASS__, 'html_content_type' ) );
		}

		call_user_func( $send, $owner->user_email, $subject, $html );

		if ( 'wp_mail' === $send ) {
			remove_filter( 'wp_mail_content_type', array( __CLASS__, 'html_content_type' ) );
		}
	}

	/**
	 * Return text/html content type for wp_mail.
	 *
	 * @return string
	 */
	public static function html_content_type() {
		return 'text/html';
	}

	/**
	 * Build the HTML body for the collaborator-blocked email.
	 *
	 * The layout mirrors the in-editor RTC notice modal: a hero
	 * illustration at the top, followed by a title, body text,
	 * and a prominent CTA button.
	 *
	 * @param string $hero_url    URL to the hero illustration image.
	 * @param string $heading     Email heading / title.
	 * @param string $body        Email body text.
	 * @param string $cta_url     URL for the CTA button.
	 * @param string $cta_label   Label for the CTA button.
	 * @return string Full HTML email string.
	 */
	public static function build_email_html( $hero_url, $heading, $body, $cta_url, $cta_label ) {
		$hero_url  = esc_url( $hero_url );
		$cta_url   = esc_url( $cta_url );
		$cta_label = esc_html( $cta_label );
		$heading   = esc_html( $heading );

		return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:32px 0;">
<tr><td align="center">
<table role="presentation" width="409" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:409px;">
	<!-- Hero illustration -->
	<tr>
		<td style="padding:0;line-height:0;">
			<img src="{$hero_url}" alt="" width="409" style="width:100%;height:auto;display:block;border-radius:8px 8px 0 0;" />
		</td>
	</tr>
	<!-- Body -->
	<tr>
		<td style="padding:24px 32px 32px;">
			<h1 style="margin:0;font-size:20px;font-weight:600;line-height:1.3;color:#1e1e1e;">{$heading}</h1>
			<p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#1e1e1e;">{$body}</p>
			<!-- CTA button -->
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
			<tr><td align="center">
				<a href="{$cta_url}" target="_blank" style="display:inline-block;width:100%;padding:12px 24px;font-size:14px;font-weight:500;color:#ffffff;background-color:#3858e9;border-radius:4px;text-decoration:none;text-align:center;box-sizing:border-box;">{$cta_label}</a>
			</td></tr>
			</table>
		</td>
	</tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;
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
