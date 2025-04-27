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
 * Adds a connection banner to the Pages screen linking to homepage editing.
 */
function wpcom_add_pages_homepage_connection_banner() {
	$screen = get_current_screen();
	if ( ! $screen || 'edit-page' !== $screen->id ) {
		return;
	}

	if ( ! wp_is_block_theme() ) {
		return;
	}

	$show_on_front  = get_option( 'show_on_front' );
	$front_page_id  = (int) get_option( 'page_on_front' );
	$posts_on_front = $show_on_front === 'posts' || ( $show_on_front === 'page' && ! $front_page_id );
	if ( ! $posts_on_front ) {
		return;
	}

	$can_edit     = current_user_can( 'edit_theme_options' );
	$edit_link    = admin_url( 'site-editor.php' );
	$display_text = __( 'Your homepage is set to display latest posts.', 'jetpack-mu-wpcom' );

	wp_register_style(
		'wpcom-pages-homepage-connection-banner',
		plugin_dir_url( __FILE__ ) . 'css/pages-homepage-connection-banner.css',
		array(),
		'20250312'
	);
	wp_enqueue_style( 'wpcom-pages-homepage-connection-banner' );

	wp_register_script(
		'wpcom-pages-homepage-connection-banner',
		plugin_dir_url( __FILE__ ) . 'js/pages-homepage-connection-banner.js',
		array( 'jquery' ),
		'20250312',
		true
	);

	// Passing data to JavaScript
	wp_localize_script(
		'wpcom-pages-homepage-connection-banner',
		'wpcomPagesHomepageConnectionBanner',
		array(
			'text'     => esc_html( $display_text ),
			'editLink' => $can_edit ? esc_url( $edit_link ) : '',
			'editText' => esc_html__( 'Edit homepage', 'jetpack-mu-wpcom' ),
			'canEdit'  => $can_edit,
		)
	);
	wp_enqueue_script( 'wpcom-pages-homepage-connection-banner' );
}

add_action( 'current_screen', 'wpcom_add_pages_homepage_connection_banner' );
