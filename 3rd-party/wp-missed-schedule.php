<?php
add_action( 'plugins_loaded', 'jetpack_update_actions_wp_missed_schedule' );

/*
 * The plugin wp-missed-schedule initiates the wpms_init function way to early for our listeners.
 *
 */
function jetpack_update_actions_wp_missed_schedule() {
	if ( function_exists( 'wpms_init' ) ) {
		remove_action( 'init', 'wpms_init', 0 );
		add_action( 'init', 'wpms_init', 91 );
	}
}
