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

const FEATURE_NAME                             = 'subscriptions';
const BLOCK_NAME                               = 'jetpack/' . FEATURE_NAME;
const META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS = 'jetpack_newsletter_access';

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
	if ( class_exists( 'Jetpack_Memberships' ) && Jetpack_Memberships::has_configured_plans_jetpack_recurring_payments( 'newsletter' ) ) {
		// We only want the sites that have newsletter plans to be graced by this JavaScript and thickbox.
		Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME, array( 'thickbox' ) );
	} else {
		Jetpack_Gutenberg::load_styles_as_required( FEATURE_NAME );
	}

	return $content;
}
