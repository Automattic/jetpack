<?php
/**
 * Enable line-height settings for all themes with Gutenberg.
 *
 * @package jetpack-mu-wpcom
 */

/**
 * Prior to Gutenberg 8.6, line-height was always enabled, which meant that wpcom
 * users had been utilizing the feature. With the 8.6 release, though, line-height
 * was turned off by default unless the theme supported it. As a result, users
 * suddenly were no longer able to access the settings they previously had access
 * to. This turns the setting on for all wpcom users regardless of theme.
 *
 * @see https://github.com/WordPress/gutenberg/pull/23904
 **/
function jetpack_mu_wpcom_gutenberg_enable_custom_line_height() {
	add_theme_support( 'custom-line-height' );
}
add_action( 'after_setup_theme', 'jetpack_mu_wpcom_gutenberg_enable_custom_line_height' );
