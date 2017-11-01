<?php
/**
 * Module Name: Extra Sidebar Widgets
 * Module Description: Add images, Twitter streams, and more to your sidebar.
 * Sort Order: 4
 * First Introduced: 1.2
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Social, Appearance
 * Feature: Appearance
 * Additional Search Queries: widget, widgets, facebook, gallery, twitter, gravatar, image, rss
 */

function jetpack_load_widgets() {
	$widgets_include = array();

	foreach ( Jetpack::glob_php( dirname( __FILE__ ) . '/widgets' ) as $file ) {
		$widgets_include[] = $file;
	}
	/**
	 * Modify which Jetpack Widgets to register.
	 *
	 * @module widgets
	 *
	 * @since 2.2.1
	 *
	 * @param array $widgets_include An array of widgets to be registered.
	 */
	$widgets_include = apply_filters( 'jetpack_widgets_to_include', $widgets_include );

	foreach( $widgets_include as $include ) {
		include $include;
	}

	include_once dirname( __FILE__ ) . '/widgets/migrate-to-core/image-widget.php';
	include_once dirname( __FILE__ ) . '/widgets/migrate-to-core/gallery-widget.php';
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

/**
 * Enqueue utilities to work with widgets in Customizer.
 *
 * @since 4.4.0
 */
function jetpack_widgets_customizer_assets_preview() {
	wp_enqueue_script( 'jetpack-customizer-widget-utils', plugins_url( '/widgets/customizer-utils.js', __FILE__ ), array( 'customize-base' ) );
}
add_action( 'customize_preview_init', 'jetpack_widgets_customizer_assets_preview' );

/**
 * Enqueue styles to stylize widgets in Customizer.
 *
 * @since 4.4.0
 */
function jetpack_widgets_customizer_assets_controls() {
	wp_enqueue_style( 'jetpack-customizer-widget-controls', plugins_url( '/widgets/customizer-controls.css', __FILE__ ), array( 'customize-widgets' ) );
}
add_action( 'customize_controls_enqueue_scripts', 'jetpack_widgets_customizer_assets_controls' );
