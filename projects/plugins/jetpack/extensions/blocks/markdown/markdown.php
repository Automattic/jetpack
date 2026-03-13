<?php
/**
 * Markdown Block.
 *
 * @since 6.8.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Markdown;

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
	Blocks::jetpack_register_block( __DIR__ );
}
add_action( 'init', __NAMESPACE__ . '\register_block' );
