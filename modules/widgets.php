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
		include_once $include;
	}

	include_once dirname( __FILE__ ) . '/widgets/migrate-to-core/image-widget.php';
	include_once dirname( __FILE__ ) . '/widgets/migrate-to-core/gallery-widget.php';
}

add_action( 'jetpack_modules_loaded', 'jetpack_widgets_loaded' );

function jetpack_widgets_loaded() {
	Jetpack::enable_module_configurable( __FILE__ );
	Jetpack::module_configuration_load( __FILE__, 'jetpack_widgets_configuration_load' );
	add_filter( 'jetpack_module_configuration_url_widgets', 'jetpack_widgets_configuration_url' );
}

function jetpack_widgets_configuration_load() {
	wp_safe_redirect( admin_url( 'widgets.php' ) );
	exit;
}

/**
 * Overrides default configuration url
 *
 * @uses admin_url
 * @return string module settings URL
 */
function jetpack_widgets_configuration_url() {
	return admin_url( 'customize.php?autofocus[panel]=widgets' );
}

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

function jetpack_widgets_remove_old_widgets() {
	$old_widgets = array(
		'googleplus-badge',
	);

	foreach ( $old_widgets as $old_widget ) {
		jetpack_widgets_remove_widget( $old_widget );
		jetpack_widgets_purge_widget_option( $old_widget );
	}
}

function jetpack_widgets_remove_widget( $widget_base ) {
	$post_global = $_POST;

	$i = 0;
	while ( $sidebar_id = is_active_widget( false, false, $widget_base, false ) ) {
		$i++;
		if ( 100 < $i ) {
			break;
		}

		$sidebars_widgets = wp_get_sidebars_widgets();
		$sidebar = $sidebars_widgets[$sidebar_id];

		foreach ( $sidebar as $i => $widget_id ) {
			if ( _get_widget_id_base( $widget_id ) !== $widget_base ) {
				continue;
			}

			unset( $sidebar[$i] );

			// Is this important?
			$_POST = array( 'sidebar' => $sidebar_id, 'widget-' . $widget_base => array(), 'the-widget-id' => $widget_id, 'delete_widget' => '1' );

			do_action( 'delete_widget', $widget_id, $sidebar_id, $widget_base );
		}

		$sidebars_widgets[$sidebar_id] = array_values( $sidebar );

		wp_set_sidebars_widgets( $sidebars_widgets );
	}

	$_POST = $post_global;
}

function jetpack_widgets_purge_widget_option( $widget_base ) {
	delete_option( "widget_{$widget_base}" );
}

add_action( 'updating_jetpack_version', 'jetpack_widgets_remove_old_widgets' );
