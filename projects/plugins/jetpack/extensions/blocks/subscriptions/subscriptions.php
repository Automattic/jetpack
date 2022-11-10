<?php
/**
 * Subscriptions Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Subscriptions;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Status;
use Jetpack;
use Jetpack_Gutenberg;
use Jetpack_Memberships;

require_once __DIR__ . '/constants.php';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
		( defined( 'IS_WPCOM' ) && IS_WPCOM )
		|| ( Jetpack::is_connection_ready() && Jetpack::is_module_active( 'subscriptions' ) && ! ( new Status() )->is_offline_mode() )
	) {
		Blocks::jetpack_register_block(
			BLOCK_NAME,
			array(
				'render_callback' => __NAMESPACE__ . '\render_block',
				'supports'        => array(
					'spacing' => array(
						'margin'  => true,
						'padding' => true,
					),
					'align'   => array( 'wide', 'full' ),
				),
			)
		);
	}

	register_post_meta(
		'post',
		META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS,
		array(
			'show_in_rest'  => true,
			'single'        => true,
			'type'          => 'string',
			'auth_callback' => function () {
				return wp_get_current_user()->has_cap( 'edit_posts' );
			},
		)
	);

	// This ensures Jetpack will sync this post meta to WPCOM.
	add_filter(
		'jetpack_sync_post_meta_whitelist',
		function ( $allowed_meta ) {
			return array_merge( $allowed_meta, array( META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ) );
		},
		10
	);

	add_filter( 'get_the_excerpt', __NAMESPACE__ . '\jetpack_filter_excerpt_for_newsletter', 10, 2 );

	if ( \Automattic\Jetpack\Constants::get_constant( 'JETPACK_BETA_BLOCKS' ) ) {
		add_action( 'the_content', __NAMESPACE__ . '\maybe_get_locked_content' );
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block', 9 );

/**
 * Subscriptions block render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	if (
		\Automattic\Jetpack\Constants::get_constant( 'JETPACK_BETA_BLOCKS' ) &&
		class_exists( 'Jetpack_Memberships' ) &&
		Jetpack_Memberships::has_configured_plans_jetpack_recurring_payments( 'newsletter' )
	) {
		// We only want the sites that have newsletter plans to be graced by this JavaScript and thickbox.
		Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME, array( 'thickbox' ) );
		if ( ! wp_style_is( 'enqueued' ) ) {
			wp_enqueue_style( 'thickbox' );
		}
	} else {
		Jetpack_Gutenberg::load_styles_as_required( FEATURE_NAME );
	}

	return $content;
}

/**
 * Filter excerpts looking for subscription data.
 *
 * @param string   $excerpt The extrapolated excerpt string.
 * @param \WP_Post $post    The current post being processed (in `get_the_excerpt`).
 *
 * @return mixed
 */
function jetpack_filter_excerpt_for_newsletter( $excerpt, $post ) {
	if ( false !== strpos( $post->post_content, '<!-- wp:jetpack/subscriptions -->' ) ) {
		$excerpt .= sprintf(
			// translators: %s is the permalink url to the current post.
			__( "<p><a href='%s'>View post</a> to subscribe to site newsletter.</p>", 'jetpack' ),
			get_post_permalink()
		);
	}
	return $excerpt;
}

/**
 * Gate access to posts
 *
 * @param string $the_content Post content.
 *
 * @return string
 */
function maybe_get_locked_content( $the_content ) {
	require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';

	if ( Jetpack_Memberships::user_can_view_post() ) {
		return $the_content;
	}
	return get_locked_content_placeholder_text();
}

/**
 * Placeholder text for non-subscribers
 *
 * @return string
 */
function get_locked_content_placeholder_text() {
	return do_blocks(
		'<!-- wp:group {"layout":{"type":"constrained","contentSize":"400px"},"style":{"spacing":{"padding":{"top":"var:preset|spacing|80","right":"var:preset|spacing|80","bottom":"var:preset|spacing|80","left":"var:preset|spacing|80"}}},"backgroundColor":"tertiary"} -->
			<div class="wp-block-group has-tertiary-background-color has-background" style="padding-top:var(--wp--preset--spacing--80);padding-right:var(--wp--preset--spacing--80);padding-bottom:var(--wp--preset--spacing--80);padding-left:var(--wp--preset--spacing--80)"><!-- wp:heading {"textAlign":"center"} -->
			<h2 class="has-text-align-center">' . esc_html__( 'Subscribe to get access.', 'jetpack' ) . '</h2>
			<!-- /wp:heading -->

			<!-- wp:paragraph {"align":"center","fontSize":"small"} -->
			<p class="has-text-align-center has-small-font-size">' . esc_html__( 'Read more of this content if you subscribe today.', 'jetpack' ) . '</p>
			<!-- /wp:paragraph -->

			<!-- wp:jetpack/subscriptions {"subscribePlaceholder":' . esc_html__( 'Email address', 'jetpack' ) . ',"buttonBackgroundColor":"primary","textColor":"secondary","borderRadius":50,"borderColor":"primary","className":"is-style-compact"} -->
				<div class="wp-block-jetpack-subscriptions wp-block-jetpack-subscriptions__supports-newline is-style-compact">
					[jetpack_subscription_form subscribe_placeholder="Email Address" show_subscribers_total="false" button_on_newline="false" custom_font_size="16px" custom_border_radius="50" custom_border_weight="1" custom_padding="15" custom_spacing="10" submit_button_classes="has-primary-border-color has-text-color has-secondary-color has-background has-primary-background-color" email_field_classes="has-primary-border-color" show_only_email_and_button="true"]
				</div>
			<!-- /wp:jetpack/subscriptions --></div>
		<!-- /wp:group -->'
	);
}
