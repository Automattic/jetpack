<?php
/**
 * Slideshow Block.
 *
 * @since 7.1.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Slideshow;

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
			'render_callback'       => __NAMESPACE__ . '\load_assets',
			'render_email_callback' => __NAMESPACE__ . '\render_email',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Slideshow block registration/dependency declaration.
 *
 * The heavy render implementation lives in render.php and is only loaded when
 * the block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array  $attr    Array containing the slideshow block attributes.
 * @param string $content String containing the slideshow block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	require_once __DIR__ . '/render.php';
	return render( $attr, $content );
}

/**
 * Render slideshow block for email.
 *
 * @since 15.0
 *
 * @param string $block_content     The original block HTML content.
 * @param array  $parsed_block      The parsed block data including attributes.
 * @param object $rendering_context Email rendering context.
 *
 * @return string
 */
function render_email( $block_content, array $parsed_block, $rendering_context ) {
	require_once __DIR__ . '/render.php';
	return render_email_implementation( $block_content, $parsed_block, $rendering_context );
}
