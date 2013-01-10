<?php
/**
 * Module Name: Extra Sidebar Widgets
 * Module Description: Easily add images, Twitter updates, and your site's RSS links to your theme's sidebar.
 * Sort Order: 13
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

/**
 * Loads file for front-end widget styles.
 */
function jetpack_widgets_styles() {
	wp_enqueue_style( 'jetpack-widgets', plugins_url( 'widgets/widgets.css', __FILE__ ), array(), '20121003' );
}
add_action( 'wp_enqueue_scripts', 'jetpack_widgets_styles' );

/**
 * Add the "(Jetpack)" suffix to the widget names
 */
function jetpack_widgets_add_suffix( $widget_name ) {
    return sprintf( __( '%s (Jetpack)', 'jetpack' ), $widget_name );
}
add_filter( 'jetpack_widget_name', 'jetpack_widgets_add_suffix' );



jetpack_load_widgets();
