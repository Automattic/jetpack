<?php
/**
 * Eventbrite Block.
 *
 * @since 8.2.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Eventbrite;

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
 * Eventbrite block registration/dependency delclaration.
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array  $attr    Eventbrite block attributes.
 * @param string $content Rendered embed element (without scripts) from the block editor.
 *
 * @return string Rendered block.
 */
function render_block( $attr, $content ) {
	require_once __DIR__ . '/render.php';
	return render( $attr, $content );
}
