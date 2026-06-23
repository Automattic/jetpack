<?php
/**
 * Business Hours Block.
 *
 * @since 7.1.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Business_Hours;

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
		array(
			'render_callback' => __NAMESPACE__ . '\render',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Dynamic rendering of the block.
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array $attributes Array containing the business hours block attributes.
 *
 * @return string
 */
function render( $attributes ) {
	require_once __DIR__ . '/render.php';
	return render_implementation( $attributes );
}
