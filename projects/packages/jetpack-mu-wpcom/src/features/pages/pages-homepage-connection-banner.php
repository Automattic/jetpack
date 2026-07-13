<?php
/**
 * Banner connecting Pages screen to homepage editing.
 *
 * Displays a banner in the Pages admin list to help users navigate to homepage editing.
 * This addresses user confusion about where to edit their homepage when it's controlled by theme settings.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * User meta key storing whether the current user has dismissed the homepage connection banner.
 */
const WPCOM_HOMEPAGE_CONNECTION_BANNER_DISMISSED_META = 'wpcom_pages_homepage_connection_banner_dismissed';

/**
 * Displays the homepage connection banner in the admin notices.
 *
 * The markup is rendered directly (rather than via wp_admin_notice()) because
 * wp_admin_notice() passes its output through wp_kses_post(), which strips the
 * data-nonce attribute the dismissal AJAX request relies on.
 */
function homepage_connection_banner() {
	printf(
		'<div id="edit-homepage-banner" class="notice notice-info is-dismissible" data-nonce="%s"><p>%s</p><a href="%s" class="button-primary">%s</a></div>',
		esc_attr( wp_create_nonce( 'dismiss_homepage_connection_banner' ) ),
		esc_html__( 'Looking to customize your homepage?', 'jetpack-mu-wpcom' ),
		esc_url( admin_url( 'site-editor.php' ) ),
		esc_html__( 'Edit homepage', 'jetpack-mu-wpcom' )
	);
}

/**
 * Adds a connection banner to the Pages screen linking to homepage editing.
 */
function wpcom_add_pages_homepage_connection_banner() {
	$screen = get_current_screen();
	if ( ! $screen || ! wp_is_block_theme() ) {
		return;
	}

	$is_edit_page_screen = 'edit-page' === $screen->id;

	if ( ! $is_edit_page_screen ) {
		return;
	}

	// Don't show the banner if the current user has already dismissed it.
	if ( get_user_meta( get_current_user_id(), WPCOM_HOMEPAGE_CONNECTION_BANNER_DISMISSED_META, true ) ) {
		return;
	}

	$show_on_front  = get_option( 'show_on_front' );
	$front_page_id  = (int) get_option( 'page_on_front' );
	$posts_on_front = $show_on_front === 'posts' || ( $show_on_front === 'page' && ! $front_page_id );
	$can_edit       = current_user_can( 'edit_theme_options' );

	if ( ! $posts_on_front || ! $can_edit ) {
		return;
	}

	add_action( 'admin_notices', 'homepage_connection_banner' );

	wp_register_script_module(
		'wpcom-tracks-module',
		plugin_dir_url( __FILE__ ) . '../../common/tracks.js',
		array(),
		'20250604'
	);

	wp_enqueue_script_module(
		'wpcom-pages-homepage-connection-banner',
		plugin_dir_url( __FILE__ ) . 'js/pages-homepage-connection-banner.js',
		array( 'wpcom-tracks-module', 'jquery' ),
		'20250604'
	);
}

add_action( 'current_screen', 'wpcom_add_pages_homepage_connection_banner' );

/**
 * AJAX handler to persist the dismissal of the homepage connection banner in user meta.
 */
function wpcom_dismiss_pages_homepage_connection_banner() {
	check_ajax_referer( 'dismiss_homepage_connection_banner', 'nonce' );
	update_user_meta( get_current_user_id(), WPCOM_HOMEPAGE_CONNECTION_BANNER_DISMISSED_META, '1' );
	wp_send_json_success( null, 200, JSON_UNESCAPED_SLASHES );
}
add_action( 'wp_ajax_dismiss_homepage_connection_banner', 'wpcom_dismiss_pages_homepage_connection_banner' );
