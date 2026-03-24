<?php
/**
 * Enqueue styles and scripts to display a warning message in the WordPress Customizer
 * if a theme background image is set to a deprecated ColourLovers URL.
 *
 * @package automattic/jetpack-mu-plugins
 */

/**
 * Hooks into `customize_controls_enqueue_scripts` to inject a warning message.
 */
function wpcom_colourlovers_deprecate_warning() {
	// Retrieve all theme mods (customizations) set for the current theme.
	$theme_mods = get_theme_mods();

	// If no background image is set, there’s no need to display a warning.
	if ( ! isset( $theme_mods['background_image'] ) ) {
		return;
	}

	// Check if the background image URL contains a deprecated ColourLovers URL.
	// If it doesn’t, we don’t need to show any warning.
	if ( ! str_contains( $theme_mods['background_image'], 'colourlovers-static-replica.s3.amazonaws.com' ) &&
		! str_contains( $theme_mods['background_image'], 'colourlovers.com.s3.amazonaws.com' ) ) {
		return;
	}

	// This message is shown to users in the Customizer.
	// It warns them that their current background image will no longer be available.
	$message = __( 'Update your background image before June 15 to keep your site looking great.', 'jetpack-mu-wpcom' );

	// Enqueue a JavaScript file that displays the warning message.
	wp_enqueue_script(
		'colourlovers-deprecate-warning', // A unique handle for the script.
		plugins_url( '/js/colourlovers-deprecated-message.js', __FILE__ ), // URL of the script.
		array( 'customize-controls' ), // This script depends on the Customizer controls.
		'1.0.0', // Version of the script for cache-busting.
		true // Load the script in the footer of the page.
	);

	// Pass the warning message to the JavaScript file so it can display it in the Customizer.
	wp_localize_script(
		'colourlovers-deprecate-warning',
		'colourloversDeprecate',
		array(
			'message' => $message,
		)
	);
}
add_action( 'customize_controls_enqueue_scripts', 'wpcom_colourlovers_deprecate_warning' );
