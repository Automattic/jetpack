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
	if ( ! \Automattic\Jetpack\RTC::is_enabled() ) {
		return;
	}

	// RTC notices are only relevant for sites with multiple users who can edit posts.
	$editors = new \WP_User_Query(
		array(
			'capability' => 'edit_posts',
			'number'     => 2,
			'fields'     => 'ID',
		)
	);
	if ( $editors->get_total() < 2 ) {
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
