<?php
/**
 * Module Name: Enhanced Distribution
 * Module Description: Share your public posts and comments to search engines and other services.
 * Sort Order: 5
 * First Introduced: 1.2
 * Requires Connection: Yes
 * Auto Activate: Public
 * Module Tags: Writing
 */

Jetpack_Sync::sync_posts( __FILE__ );
Jetpack_Sync::sync_comments( __FILE__ );

function jetpack_enhanced_distribution_activate() {
	Jetpack::check_privacy( __FILE__ );
}


// In case it's active prior to upgrading to 1.9
function jetpack_enhanced_distribution_before_activate_default_modules() {
	$old_version = Jetpack_Options::get_option( 'old_version' );
	list( $old_version ) = explode( ':', $old_version );

	if ( version_compare( $old_version, '1.9-something', '>=' ) ) {
		return;
	}

	Jetpack::check_privacy( __FILE__ );
}

add_action( 'jetpack_activate_module_enhanced-distribution', 'jetpack_enhanced_distribution_activate' );
add_action( 'jetpack_before_activate_default_modules', 'jetpack_enhanced_distribution_before_activate_default_modules' );

/**
 * If a request has ?get_freshly_pressed_data=true appended
 * to the end, then let's provide the necessary data back via JSON.
 */
if ( isset( $_GET['get_freshly_pressed_data'] ) ) {
	add_action( 'template_redirect', 'jetpack_get_freshly_pressed_data' );
	function jetpack_get_freshly_pressed_data() {
		if ( is_single() ) {
			wp_send_json_success( array(
				'blog_id' => Jetpack_Options::get_option( 'id' ),
				'post_id' => get_the_ID(),
			) );
		} else {
			wp_send_json_error( array(
				'message' => 'Not Singular',
			) );
		}
	}
}
