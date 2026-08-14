<?php
/**
 * Story Block.
 *
 * @since 8.6.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Story;

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
 * Render story block
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array $attributes  - Block attributes.
 *
 * @return string
 */
function render_block( $attributes ) {
	require_once __DIR__ . '/render.php';
	return render( $attributes );
}
