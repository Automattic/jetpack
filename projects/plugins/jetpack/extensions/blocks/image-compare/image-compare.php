<?php
/**
 * Image Compare Block.
 *
 * @since 8.6
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\ImageCompare;

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
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Image Compare block registration/dependency declaration.
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array  $attr    Array containing the image-compare block attributes.
 * @param string $content String containing the image-compare block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	require_once __DIR__ . '/render.php';
	return render_implementation( $attr, $content );
}
