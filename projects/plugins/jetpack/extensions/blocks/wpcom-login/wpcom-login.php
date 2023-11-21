<?php
/**
 * WordPress.com Login Block.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\WPCOM_Login;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * WordPress.com Login block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the WordPress.com Login block attributes.
 * @param string $content String containing the WordPress.com Login block content.
 *
 * @return string
 */
function load_assets( $attributes, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return render_block_wpcom_loginout( $attributes );
}

/**
 * Renders the `wpcom/loginout` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the login-out link or form.
 */
function render_block_wpcom_loginout( $attributes ) {

	// Build the redirect URL.
	$current_url = ( is_ssl() ? 'https://' : 'http://' ) . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];

	$classes  = is_user_logged_in() ? 'logged-in' : 'logged-out';
	$contents = wp_loginout(
		isset( $attributes['redirectToCurrent'] ) && $attributes['redirectToCurrent'] ? $current_url : '',
		false
	);

	// If logged-out and displayLoginAsForm is true, show the login form.
	if ( ! is_user_logged_in() && ! empty( $attributes['displayLoginAsForm'] ) ) {
		// Add a class.
		$classes .= ' has-login-form';

		// Get the form.
		$contents = wp_login_form( array( 'echo' => false ) );
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $classes ) );

	return '<div ' . $wrapper_attributes . '>' . $contents . '</div>';
}
