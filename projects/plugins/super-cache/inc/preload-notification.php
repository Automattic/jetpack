<?php

function wpsc_preload_notification_scripts() {
	global $cache_path;
	if (
		isset( $_GET['page'] ) && $_GET['page'] === 'wpsupercache' &&
		isset( $_GET['tab'] ) && $_GET['tab'] === 'preload' &&
		@file_exists( $cache_path . 'preload_permalink.txt' )
	) {
		wp_enqueue_script( 'preload-notification', plugins_url( '/preload-notification.js', __FILE__ ), array('jquery'), '1.0', 1 );
		wp_localize_script( 'preload-notification', 'wpsc_preload_ajax', array( 'preload_permalink_url' => home_url( str_replace( $_SERVER['DOCUMENT_ROOT'], '', $cache_path ) . '/preload_permalink.txt' ) ) );
	}
}
add_action( 'admin_enqueue_scripts', 'wpsc_preload_notification_scripts' );
