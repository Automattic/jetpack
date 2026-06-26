<?php
/**
 * Like Block.
 *
 * @since 12.9
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Like;

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
	$is_wpcom     = defined( 'IS_WPCOM' ) && IS_WPCOM;
	$is_connected = \Jetpack::is_connection_ready();

	if ( $is_wpcom || $is_connected ) {
		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'api_version'     => 3,
				'render_callback' => __NAMESPACE__ . '\render_block',
				'description'     => $is_wpcom ? __( 'Give your readers the ability to show appreciation for your posts and easily share them with others.', 'jetpack' ) : __( 'Give your readers the ability to show appreciation for your posts.', 'jetpack' ),
			)
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Like block render function.
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array  $attr Array containing the Like block attributes.
 * @param string $content String containing the Like block content.
 * @param object $block Object containing the Like block data.
 *
 * @return string
 */
function render_block( $attr, $content, $block ) {
	require_once __DIR__ . '/render.php';
	return render_block_implementation( $attr, $content, $block );
}
