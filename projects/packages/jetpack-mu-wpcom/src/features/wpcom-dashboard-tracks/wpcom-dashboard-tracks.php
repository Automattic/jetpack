<?php
/**
 * Tracks events for the Dashboard widgets: what renders, and what people toggle, move, and click.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use function Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Unified_Admin_Page_View\wpcom_unified_admin_tracks_props;

/**
 * Enqueue the Dashboard tracking script.
 *
 * @return void
 */
function wpcom_dashboard_tracks_enqueue() {
	$screen = get_current_screen();
	if ( ! $screen || 'dashboard' !== $screen->id ) {
		return;
	}

	$props = wpcom_unified_admin_tracks_props();
	if ( null === $props ) {
		return;
	}

	$handle = jetpack_mu_wpcom_enqueue_assets( 'wpcom-dashboard-tracks', array( 'js' ) );

	$data = wp_json_encode(
		array(
			'props'      => $props,
			'siteDomain' => wp_parse_url( home_url(), PHP_URL_HOST ),
			'adminPath'  => wp_parse_url( admin_url(), PHP_URL_PATH ),
		),
		JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
	);

	wp_add_inline_script( $handle, "var wpcomDashboardTracks = $data;", 'before' );
}

add_action( 'admin_enqueue_scripts', 'wpcom_dashboard_tracks_enqueue' );
