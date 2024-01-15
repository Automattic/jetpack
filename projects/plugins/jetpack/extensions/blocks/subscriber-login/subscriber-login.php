<?php
/**
 * Subscriber Login Block.
 *
 * @since 0.0.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Subscriber_Login;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;
use Jetpack_Memberships;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( ! \Jetpack::is_module_active( 'subscriptions' ) || ! class_exists( '\Jetpack_Memberships' ) ) {
		return;
	}

	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Returns current URL
 *
 * @return string
 */
function get_current_url() {
	if ( ! isset( $_SERVER['HTTP_HOST'] ) || ! isset( $_SERVER['REQUEST_URI'] ) ) {
		return '';
	}

	return ( is_ssl() ? 'https://' : 'http://' ) . wp_unslash( $_SERVER['HTTP_HOST'] ) . wp_unslash( $_SERVER['REQUEST_URI'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
}

/**
 * Renders Subscriber Login block
 *
 * @param array $attr    Array containing the Subscriber Login block attributes.
 *
 * @return string
 */
function render_block( $attr ) {
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	if ( ! is_user_logged_in() ) {
		return sprintf(
			'<div class="%1$s"><a href="%2$s">%3$s</a></div>',
			esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
			wp_login_url( get_current_url() ),
			__( 'Log in', 'jetpack' )
		);
	}

	if ( Jetpack_Memberships::is_current_user_subscribed() ) {
		return sprintf(
			'<div class="%1$s"><a href="%2$s">%3$s</a></div>',
			esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
			'https://wordpress.com/read/subscriptions',
			__( 'Manage subscriptions', 'jetpack' )
		);
	}

	return sprintf(
		'<div class="%1$s"><a href="%2$s">%3$s</a></div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		wp_logout_url( get_current_url() ),
		__( 'Log out', 'jetpack' )
	);
}
