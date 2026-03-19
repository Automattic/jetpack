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
	}
);

/**
 * Get the maximum number of peers allowed per room.
 *
 * @return int Max peers per room.
 */
function wpcom_get_rtc_max_peers_per_room() {
	return (int) apply_filters( 'wpcom_rtc_max_peers_per_room', 2 );
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
 * Enqueue block editor assets for RTC notices and limits.
 */
function wpcom_enqueue_rtc_notices_assets() {
	if ( ! wpcom_is_gutenberg_rtc_enabled() ) {
		return;
	}

	// Don't show notices if the user has turned off RTC in Writing Settings.
	if ( ! get_option( 'wp_enable_real_time_collaboration', false ) ) {
		return;
	}

	$handle = jetpack_mu_wpcom_enqueue_assets( 'gutenberg-rtc-notices', array( 'js', 'css' ) );
	wp_set_script_translations( $handle, 'jetpack-mu-wpcom' );

	require_once __DIR__ . '/class-wp-rest-rtc-notices.php';

	$is_admin_user = current_user_can( 'manage_options' );

	$data = wp_json_encode(
		array(
			'isAdmin'           => $is_admin_user,
			'welcomeDismissed'  => WP_REST_RTC_Notices::is_dismissed(),
			'postId'            => get_the_ID(),
			'postTitle'         => get_the_title(),
			'postEditUrl'       => get_edit_post_link( get_the_ID(), 'raw' ),
			'postsListUrl'      => admin_url( 'edit.php' ),
			'siteSlug'          => wpcom_get_site_slug(),
			'maxPeersPerRoom'   => wpcom_get_rtc_max_peers_per_room(),
			'maxClientsPerUser' => wpcom_get_rtc_max_clients_per_user(),
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
