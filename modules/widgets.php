<?php
/**
 * Module Name: Extra Sidebar Widgets
 * Module Description: Easily add images, Twitter updates, and your site's RSS links to your theme's sidebar.
 * Sort Order: 9
 * First Introduced: 1.2
 */

function jetpack_load_widgets() {
	foreach ( Jetpack::glob_php( dirname( __FILE__ ) . '/widgets' ) as $file ) {
		include $file;
	}
}

add_action( 'jetpack_modules_loaded', 'jetpack_widgets_loaded' );

function jetpack_widgets_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'jetpack_widgets_configuration_load' );
}

function jetpack_widgets_configuration_load() {
	wp_safe_redirect( admin_url( 'widgets.php' ) );
	exit;
}
	
jetpack_load_widgets();

add_action( 'widgets_init', 'facebook_likebox_widget_init' );

function facebook_likebox_widget_init() {
	register_widget( 'WPCOM_Widget_Facebook_LikeBox' );
}
