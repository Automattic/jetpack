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

/**
 * Adds a polyfill for DOMRect in environments which do not support it.
 *
 * This can be removed when plugin support requires WordPress 5.4.0+.
 *
 * @see gutenberg_add_url_polyfill
 * @see https://core.trac.wordpress.org/ticket/49360
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMRect
 * @see https://developer.wordpress.org/reference/functions/wp_default_packages_vendor/
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function wpcomsh_add_dom_rect_polyfill( $scripts ) {
	// WP.com: Only register if viewing the block editor.
	global $pagenow;
	if ( ! ( 'post.php' === $pagenow || 'post-new.php' === $pagenow ) ) {
		return;
	}

	// Only register polyfill if not already registered. This prevents handling
	// in an environment where core has updated to manage the polyfill. This
	// depends on the action being handled after default script registration.
	$is_polyfill_script_registered = (bool) $scripts->query( 'wp-polyfill-dom-rect', 'registered' );
	if ( $is_polyfill_script_registered ) {
		return;
	}

	$scripts->add(
		'wp-polyfill-dom-rect',
		plugins_url( 'assets/wp-polyfill-dom-rect.js', __DIR__ ),
		array(),
		'3.42.0'
	);

	did_action( 'init' ) && $scripts->add_inline_script(
		'wp-polyfill',
		wp_get_script_polyfill(
			$scripts,
			array(
				'window.DOMRect' => 'wp-polyfill-dom-rect',
			)
		)
	);
}

add_action( 'wp_default_scripts', 'wpcomsh_add_dom_rect_polyfill', 30 );
