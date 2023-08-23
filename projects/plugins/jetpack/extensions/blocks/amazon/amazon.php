<?php
/**
 * Amazon Block.
 *
 * @since 8.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Amazon;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Returns the path to the directory containing the block.json file.
 *
 * @return string
 */
function get_block_path() {
	return dirname( JETPACK__PLUGIN_FILE ) . '/_inc/blocks/amazon';
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		get_block_path(),
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Amazon block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Amazon block attributes.
 * @param string $content String containing the Amazon block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( get_block_path() );

	return $content;
}
