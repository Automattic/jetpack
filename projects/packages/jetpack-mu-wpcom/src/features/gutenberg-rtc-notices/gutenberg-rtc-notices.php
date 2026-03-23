<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Gutenberg RTC Notices file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

require_once __DIR__ . '/../../utils.php';

/**
 * Register the RTC notices REST endpoints.
 */
add_action(
	'rest_api_init',
	function () {
		if ( ! \Automattic\Jetpack\RTC::is_enabled() ) {
			return;
		}
		require_once __DIR__ . '/class-wp-rest-rtc-notices.php';
		( new WP_REST_RTC_Notices() )->register_routes();
	},
	20
);

/**
 * Get the maximum number of peers allowed per room.
 *
 * @return int Max peers per room.
 */
function wpcom_get_rtc_max_peers_per_room() {
	return (int) apply_filters( 'wpcom_rtc_max_peers_per_room', 3 );
}

/**
 * Get the maximum number of clients (tabs) allowed per user in a room.
 *
 * @return int Max clients per user.
 */
function wpcom_get_rtc_max_clients_per_user() {
	return (int) apply_filters( 'wpcom_rtc_max_clients_per_user', 2 );
}

/**
 * Check if the current user is the plan owner for this site.
 * Works on Simple sites (via wpcom_get_blog_owner) and Atomic sites
 * (via Jetpack connection master_user). Returns false on self-hosted
 * since there is no WP.com plan to upgrade.
 *
 * @return bool
 */
function wpcom_rtc_is_plan_owner() {
	$current_user_id = get_current_user_id();

	// Simple sites: wpcom_get_blog_owner is the canonical source.
	if ( function_exists( 'wpcom_get_blog_owner' ) ) {
		$owner_id = wpcom_get_blog_owner( get_wpcom_blog_id() );
		return (int) $current_user_id === (int) $owner_id;
	}

	// Atomic sites: the Jetpack connection master_user is the plan owner.
	if ( class_exists( 'Jetpack_Options' ) ) {
		$master_user = \Jetpack_Options::get_option( 'master_user' );
		if ( $master_user ) {
			return (int) $current_user_id === (int) $master_user;
		}
	}

	return false;
}

/**
 * Enqueue block editor assets for RTC notices and limits.
 */
function wpcom_enqueue_rtc_notices_assets() {
	global $pagenow;

	if ( ! \Automattic\Jetpack\RTC::is_enabled() ) {
		return;
	}

	// Real-time collaboration is not enabled in the site editor.
	if (
		'site-editor.php' === $pagenow ||
		( 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'site-editor-v2' === sanitize_text_field( wp_unslash( $_GET['page'] ) ) ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	) {
		return;
	}

	// Don't show notices if the user has turned off RTC in Writing Settings.
	// Both the old and new option names must be false to consider it disabled.
	$old_option = get_option( 'wp_enable_real_time_collaboration', false );
	$new_option = get_option( 'wp_collaboration_enabled', false );
	if ( ! $old_option && ! $new_option ) {
		return;
	}

	// Notices are not relevant for P2 sites.
	if ( function_exists( '\WPForTeams\is_wpforteams_site' ) && \WPForTeams\is_wpforteams_site( get_current_blog_id() ) ) {
		return;
	}

	$handle = jetpack_mu_wpcom_enqueue_assets( 'gutenberg-rtc-notices', array( 'js', 'css' ) );
	wp_set_script_translations( $handle, 'jetpack-mu-wpcom' );

	require_once __DIR__ . '/class-wp-rest-rtc-notices.php';

	$is_admin_user = current_user_can( 'manage_options' );
	$is_plan_owner = wpcom_rtc_is_plan_owner();

	$data = wp_json_encode(
		array(
			'isAdmin'            => $is_admin_user,
			'isPlanOwner'        => $is_plan_owner,
			'welcomeDismissed'   => WP_REST_RTC_Notices::is_dismissed(),
			'postId'             => get_the_ID(),
			'postTitle'          => get_the_title(),
			'postEditUrl'        => get_edit_post_link( get_the_ID(), 'raw' ),
			'postsListUrl'       => admin_url( 'edit.php' ),
			'siteSlug'           => wpcom_get_site_slug(),
			'maxPeersPerRoom'    => wpcom_get_rtc_max_peers_per_room(),
			'maxClientsPerUser'  => wpcom_get_rtc_max_clients_per_user(),
			'enableLimitNotices' => apply_filters( 'wpcom_rtc_enable_limit_notices', false ),
		),
		JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
	);

	wp_add_inline_script(
		$handle,
		"var wpcomRtcNotices = $data;",
		'before'
	);
}
add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_rtc_notices_assets' );
