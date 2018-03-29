<?php

/**
 * Register and load the widget.
 *
 * @access public
 * @return void
 */
function jetpack_widget_social_icons_load() {
	if ( ! class_exists( 'Jetpack_Widget_Social_Icons' ) ) {
		require_once( __DIR__ . '/social-icons/class.php' );
		register_widget( 'Jetpack_Widget_Social_Icons' );
	}
}
add_action( 'widgets_init', 'jetpack_widget_social_icons_load' );
