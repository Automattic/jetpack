<?php
/**
 * Gathering Tweetstorms Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Gathering_Tweetstorms;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'gathering-tweetstorms';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Gathering Tweetstorms block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Gathering Tweetstorms block attributes.
 * @param string $content String containing the Gathering Tweetstorms block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attr ) ),
		$content
	);
}
