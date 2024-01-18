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
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;
use Jetpack_Memberships;
use Jetpack_Options;

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

	add_action( 'wp_logout', __NAMESPACE__ . '\subscriber_logout' );
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Logout subscriber.
 *
 * @return void
 */
function subscriber_logout() {
	Abstract_Token_Subscription_Service::clear_token_cookie();
}

/**
 * Returns current URL.
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
 * Returns subscriber log in URL.
 *
 * @return string
 */
function get_subscriber_login_url() {
	// Copied from projects/plugins/jetpack/extensions/blocks/subscriptions/subscriptions.php
	if ( ( new Host() )->is_wpcom_simple() ) {
		// On WPCOM we will redirect directly to the current page
		$redirect_url = get_current_url();
	} else {
		// On self-hosted we will save and hide the token
		$redirect_url = get_site_url() . '/wp-json/jetpack/v4/subscribers/auth';
		$redirect_url = add_query_arg( 'redirect_url', get_current_url(), $redirect_url );
	}

	return add_query_arg(
		array(
			'site_id'      => intval( Jetpack_Options::get_option( 'id' ) ),
			'redirect_url' => rawurlencode( $redirect_url ),
		),
		'https://subscribe.wordpress.com/memberships/jwt'
	);
}

/**
 * Renders Subscriber Login block.
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
			get_subscriber_login_url(),
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
