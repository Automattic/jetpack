<?php
/**
 * Inline polyfills for built-ins the block editor calls without polyfilling.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Print an Array.prototype.toSorted() polyfill ahead of every other admin script.
 *
 * Gutenberg 24.3 calls it unpolyfilled, which crashes the editor on Chrome < 110, Safari < 16 and Firefox < 115.
 * Remove once a Gutenberg release with https://github.com/WordPress/gutenberg/pull/86159 reaches every site.
 */
function jetpack_mu_wpcom_print_editor_polyfills() {
	wp_print_inline_script_tag(
		'if(!Array.prototype.toSorted){Object.defineProperty(Array.prototype,"toSorted",{value:function(c){if(c!==void 0&&typeof c!=="function"){throw new TypeError("The comparison function must be either a function or undefined");}return Array.prototype.slice.call(this).sort(c);},writable:true,configurable:true});}'
	);
}
add_action( 'admin_print_scripts', 'jetpack_mu_wpcom_print_editor_polyfills', 0 );
// The Customizer's block-based widget editor prints its scripts on its own hook.
add_action( 'customize_controls_print_scripts', 'jetpack_mu_wpcom_print_editor_polyfills', 0 );
