<?php
/**
 * Subscriber Login Block.
 *
 * @since 13.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Subscriber_Login;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Status\Request;
use Jetpack;
use Jetpack_Gutenberg;
use Jetpack_Memberships;
use Jetpack_Options;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/class-jetpack-subscription-site.php';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
		! Jetpack::is_module_active( 'subscriptions' ) ||
		! class_exists( 'Jetpack_Memberships' ) ||
		! class_exists( 'Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service' )
	) {
		return;
	}

	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);

	add_filter(
		'jetpack_options_whitelist',
		function ( $options ) {
			$options[] = 'jetpack_subscriptions_login_navigation_enabled';

			return $options;
		}
	);

	// If called via REST API, we need to register later in the lifecycle
	if ( ( new Host() )->is_wpcom_platform() && ! Request::is_frontend() ) {
		add_action(
			'restapi_theme_init',
			function () {
				Jetpack_Subscription_Site::init()->handle_subscriber_login_block_placements();
			}
		);
	} else {
		Jetpack_Subscription_Site::init()->handle_subscriber_login_block_placements();
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

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
 * Renders Subscriber Login block.
 *
 * @param array $attributes The block attributes.
 *
 * @return string
 */
function render_block( $attributes ) {
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$block_template             = '<div %1$s><a href="%2$s">%3$s</a></div>';
	$redirect_url               = ! empty( $attributes['redirectToCurrent'] ) ? get_current_url() : get_site_url();
	$log_in_label               = ! empty( $attributes['logInLabel'] ) ? sanitize_text_field( $attributes['logInLabel'] ) : esc_html__( 'Log in', 'jetpack' );
	$log_out_label              = ! empty( $attributes['logOutLabel'] ) ? sanitize_text_field( $attributes['logOutLabel'] ) : esc_html__( 'Log out', 'jetpack' );
	$show_manage_link           = ! empty( $attributes['showManageSubscriptionsLink'] );
	$manage_subscriptions_label = ! empty( $attributes['manageSubscriptionsLabel'] ) ? sanitize_text_field( $attributes['manageSubscriptionsLabel'] ) : esc_html__( 'Manage subscription', 'jetpack' );

	if ( ! is_subscriber_logged_in() ) {
		return sprintf(
			$block_template,
			get_block_wrapper_attributes(),
			get_subscriber_login_url( $redirect_url ),
			$log_in_label
		);
	}

	if ( $show_manage_link && Jetpack_Memberships::is_current_user_subscribed() ) {
		return sprintf(
			$block_template,
			get_block_wrapper_attributes(),
			'https://wordpress.com/reader/site/subscription/' . Jetpack_Memberships::get_blog_id(),
			$manage_subscriptions_label
		);
	}

	return sprintf(
		$block_template,
		get_block_wrapper_attributes(),
		wp_logout_url( $redirect_url ),
		$log_out_label
	);
}
