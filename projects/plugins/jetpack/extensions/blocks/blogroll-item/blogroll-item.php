<?php
/**
 * Blogroll Item Block.
 *
 * @since 12.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blogroll_Item;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'blogroll-item';
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
			'render_callback' => __NAMESPACE__ . '\render',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Blogroll item block registration/dependency declaration.
 *
 * @param array  $attributes    Array containing the Blogroll item block attributes.
 * @param string $content String containing the Blogroll item block content.
 *
 * @return string
 */
function render( $attributes, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
	return '<div>Blogroll Item</div>';
}


