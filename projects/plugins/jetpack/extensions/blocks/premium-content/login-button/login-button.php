<?php
/**
 * Premium Content Login Button Child Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;
use Jetpack_Options;

require_once dirname( __DIR__ ) . '/_inc/subscription-service/include.php';

const LOGIN_BUTTON_NAME = 'premium-content/login-button';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_login_button_block() {
	Blocks::jetpack_register_block(
		LOGIN_BUTTON_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_login_button_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_login_button_block' );

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
 * @param string $redirect Path to redirect to on login.
 *
 * @return string
 */
function get_subscriber_login_url( $redirect ) {
	$redirect = ! empty( $redirect ) ? $redirect : get_site_url();

	if ( ( new Host() )->is_wpcom_simple() ) {
		// On WPCOM we will redirect immediately
		return wpcom_logmein_redirect_url( $redirect, false, null, 'link', get_current_blog_id() );
	}

	// On self-hosted we will save and hide the token
	$redirect_url = get_site_url() . '/wp-json/jetpack/v4/subscribers/auth';
	$redirect_url = add_query_arg( 'redirect_url', $redirect, $redirect_url );

	return add_query_arg(
		array(
			'site_id'      => intval( Jetpack_Options::get_option( 'id' ) ),
			'redirect_url' => rawurlencode( $redirect_url ),
		),
		'https://subscribe.wordpress.com/memberships/jwt/'
	);
}

/**
 * Determines whether the current visitor is a logged in user or a subscriber.
 *
 * @return bool
 */
function is_subscriber_logged_in() {
	return is_user_logged_in() || Abstract_Token_Subscription_Service::has_token_from_cookie();
}

/**
 * Render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_login_button_block( $attributes, $content ) {
	if ( ! pre_render_checks() ) {
		return '';
	}

	// The viewer is logged it, so they shouldn't see the login button.
	if ( is_subscriber_logged_in() ) {
		return '';
	}

	Jetpack_Gutenberg::load_styles_as_required( LOGIN_BUTTON_NAME );

	$redirect_url = get_current_url();
	$url          = get_subscriber_login_url( $redirect_url );

	return preg_replace( '/(<a\b[^><]*)>/i', '$1 href="' . esc_url( $url ) . '">', $content );
}
