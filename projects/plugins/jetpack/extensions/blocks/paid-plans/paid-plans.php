<?php
/**
 * Paywall Block.
 *
 * @since 12.5
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\PaidPlans;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'paid-plans';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( ! \Jetpack::is_module_active( 'subscriptions' ) ) {
		return;
	}
	if ( ! class_exists( '\Jetpack_Memberships' ) ) {
		return;
	}

	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Paid plans block registration/dependency declaration.
 *
 * @param array $attr    Array containing the paid plans block attributes.
 *
 * @return string
 */
function load_assets( $attr ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$iframe_src = add_query_arg(
		array(
			'blog'              => \Jetpack_Options::get_option( 'id' ),
			'plan'              => 'newsletter',
			'source'            => 'jetpack_subscribe',
			'post_access_level' => 'everybody',
			'display'           => 'alternate',
			'email'             => '',
		),
		'https://subscribe.wordpress.com/memberships/'
	);

	return sprintf(
		'<div class="%1$s" style="width: 520px;"><iframe src="%2$s"></iframe></div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$iframe_src
	);
}
