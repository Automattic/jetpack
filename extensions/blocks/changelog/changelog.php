<?php
/**
 * Changelog Block.
 *
 * @since 9.x
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Changelog;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'changelog';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Changelog block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Changelog block attributes.
 * @param string $content String containing the Changelog block content.
 *
 * @return string
 */
function render_block( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
	return $content;
}
