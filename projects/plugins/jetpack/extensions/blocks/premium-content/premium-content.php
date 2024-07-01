<?php
/**
 * Premium Content Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;
use WP_Post;
use const Automattic\Jetpack\Extensions\Subscriptions\META_NAME_CONTAINS_PAID_CONTENT;

require_once __DIR__ . '/_inc/access-check.php';
require_once __DIR__ . '/logged-out-view/logged-out-view.php';
require_once __DIR__ . '/subscriber-view/subscriber-view.php';
require_once __DIR__ . '/buttons/buttons.php';
require_once __DIR__ . '/login-button/login-button.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/constants.php';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	// Determine required `context` key based on Gutenberg version.
	$deprecated = function_exists( 'gutenberg_get_post_from_context' );
	$provides   = $deprecated ? 'providesContext' : 'provides_context';

	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			$provides         => array(
				'premium-content/planId'  => 'selectedPlanId', // Deprecated.
				'premium-content/planIds' => 'selectedPlanIds',
				'isPremiumContentChild'   => 'isPremiumContentChild',
			),
		)
	);

	register_post_meta(
		'post',
		META_NAME_CONTAINS_PAID_CONTENT,
		array(
			'show_in_rest'  => true,
			'single'        => true,
			'type'          => 'boolean',
			'auth_callback' => function () {
				return wp_get_current_user()->has_cap( 'edit_posts' );
			},
		)
	);

	// This ensures Jetpack will sync this post meta to WPCOM.
	add_filter(
		'jetpack_sync_post_meta_whitelist',
		function ( $allowed_meta ) {
			return array_merge(
				$allowed_meta,
				array(
					META_NAME_CONTAINS_PAID_CONTENT,
				)
			);
		}
	);

	add_action( 'wp_after_insert_post', __NAMESPACE__ . '\add_paid_content_post_meta', 99, 2 );
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	if ( ! pre_render_checks() ) {
		return '';
	}

	// Render the Stripe nudge when Stripe is unconnected
	if ( ! membership_checks() ) {
		$stripe_nudge = render_stripe_nudge();
		return $stripe_nudge . $content;
	}

	// We don't use FEATURE_NAME here because styles are not in /container folder.
	Jetpack_Gutenberg::load_assets_as_required( 'premium-content' );
	return $content;
}

/**
 * Server-side rendering for the stripe connection nudge.
 *
 * @return string Final content to render.
 */
function render_stripe_nudge() {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		\require_lib( 'memberships' );
		$blog_id  = get_current_blog_id();
		$settings = (array) \get_memberships_settings_for_site( $blog_id );

		return stripe_nudge(
			$settings['connect_url'],
			__( 'Connect to Stripe to use this block on your site.', 'jetpack' ),
			__( 'Connect', 'jetpack' )
		);
	} else {
		// On WoA sites, the Stripe connection url is not easily available
		// server-side, so we redirect them to the post in the editor in order
		// to connect.
		return stripe_nudge(
			get_edit_post_link( get_the_ID() ),
			__( 'Connect to Stripe in the editor to use this block on your site.', 'jetpack' ),
			__( 'Edit post', 'jetpack' )
		);
	}
}

/**
 * Render the stripe nudge.
 *
 * @param string $checkout_url Url for the CTA.
 * @param string $description  Text of the nudge.
 * @param string $button_text  Text of the button.
 *
 * @return string Final content to render.
 */
function stripe_nudge( $checkout_url, $description, $button_text ) {
	require_once JETPACK__PLUGIN_DIR . '_inc/lib/components.php';
	return \Jetpack_Components::render_frontend_nudge(
		array(
			'checkoutUrl' => $checkout_url,
			'description' => $description,
			'buttonText'  => $button_text,
		)
	);
}

/**
 * Add a meta to prevent publication on firehose, ES AI or Reader
 *
 * @param int     $post_id Post id.
 * @param WP_Post $post Post being saved.
 * @return void
 */
function add_paid_content_post_meta( int $post_id, WP_Post $post ) {
	if ( $post->post_type !== 'post' && $post->post_type !== 'page' ) {
		return;
	}

	$contains_paid_content = has_block( 'premium-content/container', $post );
	if ( $contains_paid_content ) {
		update_post_meta(
			$post_id,
			META_NAME_CONTAINS_PAID_CONTENT,
			$contains_paid_content
		);
	}
	if ( ! $contains_paid_content ) {
		delete_post_meta(
			$post_id,
			META_NAME_CONTAINS_PAID_CONTENT
		);
	}
}
