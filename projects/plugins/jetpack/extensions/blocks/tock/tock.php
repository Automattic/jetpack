<?php
/**
 * Tock Block.
 *
 * @since 12.3
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Tock;

use Automattic\Jetpack\Blocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Render the widget and associated JS
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array $attr    The block attributes.
 */
function render_block( $attr ) {
	require_once __DIR__ . '/render.php';
	return render_block_implementation( $attr );
}
