<?php
/**
 * Subscriber Login Block.
 *
 * @since $$next-version$$
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
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Subscriber Login block registration/dependency declaration.
 *
 * @param array $attr    Array containing the Subscriber Login block attributes.
 *
 * @return string
 */
function load_assets( $attr ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	if ( ! is_user_logged_in() ) {
		return sprintf(
			'<div class="%1$s"><a href="#">%2$s</a></div>',
			esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
			__( 'Log in', 'jetpack' )
		);
	}

	if ( Jetpack_Memberships::is_current_user_subscribed() ) {
		return sprintf(
			'<div class="%1$s"><a href="#">%2$s</a></div>',
			esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
			__( 'Manage subscriptions', 'jetpack' )
		);
	}

	return sprintf(
		'<div class="%1$s"><a href="#">%2$s</a></div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		__( 'Log out', 'jetpack' )
	);
}
