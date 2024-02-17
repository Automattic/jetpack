<?php
/**
 * Star Rating Block.
 *
 * @since 8.0.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Rating_Star;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

// Load generic function definitions.
require_once __DIR__ . '/rating-meta.php';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Dynamic rendering of the block.
 *
 * @param array $attributes Array containing the block attributes.
 *
 * @return string
 */
function render_block( $attributes ) {
	// Tell Jetpack to load the assets registered via jetpack_register_block.
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return jetpack_rating_meta_render_block( $attributes );
}

/**
 * Older versions of AMP (0.6.2) are unable to render the markup, so we hide it
 * Newer versions of AMP (1.4.1+) seem OK, but need the screen-reader text hidden
 */
function amp_add_inline_css() {
	if ( defined( 'AMP__VERSION' ) && version_compare( AMP__VERSION, '1.4.1', '>=' ) ) {
		echo '.wp-block-jetpack-rating-star span.screen-reader-text { border: 0; clip: rect(1px, 1px, 1px, 1px); clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; width: 1px; word-wrap: normal; }';
	} else {
		echo '.wp-block-jetpack-rating-star span:not([aria-hidden="true"]) { display: none; }';
	}
}
add_action( 'amp_post_template_css', __NAMESPACE__ . '\amp_add_inline_css', 11 );
