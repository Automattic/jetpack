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
 * Displays the homepage connection banner in the admin notices.
 */
function homepage_connection_banner() {
	$message = sprintf(
		'<p>%s</p><a href="%s" class="button-primary">%s</a>',
		esc_html( __( 'Looking to customize your homepage?', 'jetpack-mu-wpcom' ) ),
		esc_url( admin_url( 'site-editor.php' ) ),
		esc_html__( 'Edit homepage', 'jetpack-mu-wpcom' )
	);

	wp_admin_notice(
		$message,
		array(
			'type' => 'info',
			'id'   => 'edit-homepage-banner',
		)
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
