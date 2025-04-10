<?php
/**
 * Widgets for WordPress.com
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * WP.com Widgets (in alphabetical order)
 */
require_once __DIR__ . '/class-jetpack-i-voted-widget.php';

/**
 * Some widgets are getting long in the tooth, hardly used, or just not very useful.
 * Disable these widgets on sites where they're not active.
 */
define(
	'JETPACK_MU_WPCOM_RETIRED_WIDGETS',
	array(
		'i_voted' => 'Jetpack_I_Voted_Widget',
	)
);

/**
 * Unregister retired widgets that aren't currently active.
 *
 * @global array $retired_widgets List of retired widgets.
 * @return void
 */
function jetpack_mu_wpcom_unregister_retired_widgets() {

	if ( ( function_exists( 'wpcom_is_vip' ) && wpcom_is_vip() ) || ! is_admin() ) {
		return;
	}

	// just in case this is in any way a saving operation
	if ( ! isset( $_SERVER['REQUEST_METHOD'] ) || 'POST' === $_SERVER['REQUEST_METHOD'] ) {
		return;
	}

	// let's only retire on the widgets page or in the Customizer
	// since plugins/themes might use `the_widget()`
	if ( ! in_array( $GLOBALS['pagenow'], array( 'widgets.php', 'customize.php' ), true ) ) {
		return;
	}

	foreach ( JETPACK_MU_WPCOM_RETIRED_WIDGETS as $widget_id => $widget_class ) {
		if ( is_active_widget( false, false, $widget_id ) ) {
			continue;
		}
		unregister_widget( $widget_class );
	}
}
add_action( 'widgets_init', 'jetpack_mu_wpcom_unregister_retired_widgets', 20 );

/**
 * Remove retired widgets from Legacy Widget block
 *
 * @see https://developer.wordpress.org/block-editor/how-to-guides/widgets/legacy-widget-block/
 *
 * @param array $widget_types Array of widget types to hide.
 * @return array Modified array of widget types.
 */
function jetpack_mu_wpcom_hide_retired_widgets_from_legacy_block( $widget_types ) {
	foreach ( JETPACK_MU_WPCOM_RETIRED_WIDGETS as $widget_id => $widget_class ) {
		$widget_types[] = $widget_id;
	}

	return $widget_types;
}
add_filter( 'widget_types_to_hide_from_legacy_widget_block', 'jetpack_mu_wpcom_hide_retired_widgets_from_legacy_block' );
