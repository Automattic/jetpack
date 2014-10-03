<?php
/**
 * Module Name: Extra Sidebar Widgets
 * Module Description: Add images, Twitter streams, your site’s RSS links, and more to your sidebar.
 * Sort Order: 4
 * First Introduced: 1.2
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Social, Appearance
 */

function jetpack_load_widgets() {
	$widgets_include = array();

	foreach ( Jetpack::glob_php( dirname( __FILE__ ) . '/widgets' ) as $file ) {
		$widgets_include[] = $file;
	}

	$widgets_include = apply_filters( 'jetpack_widgets_to_include', $widgets_include );

	foreach( $widgets_include as $include ) {
		include $include;
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
 * Add the "(Jetpack)" suffix to the widget names
 */
function jetpack_widgets_add_suffix( $widget_name ) {
	return sprintf( __( '%s (Jetpack)', 'jetpack' ), $widget_name );
}
add_filter( 'jetpack_widget_name', 'jetpack_widgets_add_suffix' );



jetpack_load_widgets();
