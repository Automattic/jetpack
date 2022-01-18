<?php
/**
 * Register Jetpack Search widget.
 *
 * @package automattic/jetpack
 */

add_action( 'widgets_init', 'jetpack_search_widget_init' );

/**
 * Register the widget if Jetpack Search is available and enabled.
 */
function jetpack_search_widget_init() {
	if (
		! Jetpack::is_connection_ready()
		|| ( method_exists( 'Jetpack_Plan', 'supports' ) && ! Jetpack_Plan::supports( 'search' ) )
		|| ! Jetpack::is_module_active( 'search' )
	) {
		return;
	}

	register_widget( 'Automattic\Jetpack\Search\Search_Widget' );
}
