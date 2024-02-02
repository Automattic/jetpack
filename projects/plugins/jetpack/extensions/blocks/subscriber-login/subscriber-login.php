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
use Jetpack;
use Jetpack_Gutenberg;
use Jetpack_Memberships;
use Jetpack_Options;

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

	add_action( 'wp_logout', __NAMESPACE__ . '\subscriber_logout' );

	function spray_block_hook_positions( $hooked_blocks, $relative_position, $anchor_block, $context ) {
		$suffix = $anchor_block;

		l( $relative_position );

		if ( $context instanceof \WP_Block_Template ) {
				$prefix = $context->slug;
				$suffix = empty( $anchor_block ) ? 'template' : $anchor_block;
		}

		if ( is_array( $context ) ) {
				$prefix = $context['slug'];
				$suffix = $context['blockTypes'][0];
		}

		$block_id   = '[' . $prefix . ' | ' . $relative_position . ' | ' . $suffix . ']';
		$block_hash = md5( $block_id );

		$block_name = 'debug/' . $block_hash;
		if ( ! \WP_Block_Type_Registry::get_instance()->is_registered( $block_name ) ) {
				register_block_type(
					$block_name,
					array(
						'api_version'     => 3,
						'attributes'      => array(),
						'render_callback' => function () use ( $block_id ) {
								return '<span style="background: yellow;">' . $block_id . '</span>';
						},
					)
				);
		}

		$hooked_blocks[] = $block_name;
		return $hooked_blocks;
	}

	// add_filter( 'hooked_block_types', __NAMESPACE__ . '\spray_block_hook_positions', 10, 4 );

	// Subscribe block after post content
	function register_subscriber_block_after_post_content( $hooked_blocks, $position, $anchor_block ) {
		if ( $anchor_block === 'core/post-content' && $position === 'after' ) {
			$hooked_blocks[] = 'jetpack/subscriptions';
		}

		return $hooked_blocks;
	}
	add_filter( 'hooked_block_types', __NAMESPACE__ . '\register_subscriber_block_after_post_content', 10, 4 );

	function the_content_filter( $content ) {
		return $content . '<!-- wp:jetpack/subscriptions {"showSubscribersTotal":true} /-->';
	}
	add_filter( 'the_content', __NAMESPACE__ . '\the_content_filter', 1 );

	// function wp_list_pages_filter( $output ) {
	// return $output . '<li>AAAA</li>';
	// }
	// add_filter( 'wp_list_pages', __NAMESPACE__ . '\wp_list_pages_filter', 1 );

	function register_logout_block_as_navigation_last_child( $hooked_blocks, $position, $anchor_block, $context ) {
		if ( $anchor_block === 'core/navigation' && $position === 'last_child' ) {
						$hooked_blocks[] = 'core/loginout';
		}

		return $hooked_blocks;
	}

	// add_filter( 'hooked_block_types', __NAMESPACE__ . '\register_logout_block_as_navigation_last_child', 10, 4 );
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Logs the subscriber out by clearing out the premium content cookie.
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
 * @param string $redirect Path to redirect to on login.
 *
 * @return string
 */
function get_subscriber_login_url( $redirect ) {
	$redirect = ! empty( $redirect ) ? $redirect : get_site_url();

	// Taken from projects/plugins/jetpack/extensions/blocks/subscriptions/subscriptions.php and simplified a bit
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
		'https://subscribe.wordpress.com/memberships/jwt'
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
	$manage_subscriptions_label = ! empty( $attributes['manageSubscriptionsLabel'] ) ? sanitize_text_field( $attributes['manageSubscriptionsLabel'] ) : esc_html__( 'Manage subscriptions', 'jetpack' );

	if ( ! is_subscriber_logged_in() ) {
		return sprintf(
			$block_template,
			get_block_wrapper_attributes(),
			get_subscriber_login_url( $redirect_url ),
			$log_in_label
		);
	}

	if ( Jetpack_Memberships::is_current_user_subscribed() ) {
		return sprintf(
			$block_template,
			get_block_wrapper_attributes(),
			'https://wordpress.com/read/subscriptions',
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
