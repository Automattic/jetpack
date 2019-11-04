<?php
/**
 * Customizations for the Gutenberg plugin.
 *
 * Since we'll be trying to keep up with latest Gutenberg versions both on Simple and Atomic sites,
 * we need to ensure that some experimental functionality is not exposed yet.
 */

// Disable all Gutenberg experiments.
// See: https://github.com/WordPress/gutenberg/blob/e6d8284b03799136915495654e821ca6212ae6d8/lib/load.php#L22
add_filter( 'option_gutenberg-experiments', '__return_false' );

// Remove Gutenberg's Experiments submenu item.
function wpcomsh_remove_gutenberg_experimental_menu() {
	remove_submenu_page( 'gutenberg', 'gutenberg-experiments' );
}
add_action( 'admin_init', 'wpcomsh_remove_gutenberg_experimental_menu' );
