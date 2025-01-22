<?php
/**
 * Adds a "launch site" button to the admin bar.
 */

use Automattic\Jetpack\Status;

/**
 * Adds a "launch site" button to the admin bar.
 * 
 * @param WP_Admin_Bar $admin_bar The WordPress admin bar.
 */
function wpcom_add_launch_button_to_admin_bar( WP_Admin_Bar $admin_bar ) {
	$is_launched = true;
	$blog_id = get_current_blog_id();

	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		$is_launched = get_option( 'launch-status' ) === 'launched';
		$blog_domain = ( new Status() )->get_site_suffix();
	} else if ( function_exists( '\WPCOM\Lib\Launch_Site\is_launched' ) ) {
		$is_launched = \WPCOM\Lib\Launch_Site\is_launched( $blog_id );
		$blog_domain  = preg_replace( '!^https?://!', '', get_primary_redirect( $blog_id ) );
	}
	if ( $is_launched ) {
		return;
	}
	$admin_bar->add_menu(
		array(
			'id'     => 'menu-id',
			'parent' => null,
			'group'  => null,
			'title'  => __( 'Launch site', 'jetpack-mu-wpcom' ),
			'href'   => 'https://wordpress.com/start/launch-site?siteSlug=' . $blog_domain,
			'meta'   => array(
				'class' => 'launch-site',
			),
		)
	);
}

/**
 * Enqueue the necessary styles for the admin bar button.
 */
function wpcom_enqueue_launch_button_styles() {
	wp_enqueue_style( 'launch-banner', plugins_url( 'style.css', __FILE__ ) );
}

add_action( 'admin_bar_menu', 'wpcom_add_launch_button_to_admin_bar', 500 );
add_action( 'wp_enqueue_scripts', 'wpcom_enqueue_launch_button_styles' );
