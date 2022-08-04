<?php
/**
 * Register VideoPress block
 *
 * @package automattic/jetpack-videopress
 */

/**
 * Registers VideoPress block
 */
function create_block_videopress_block_init() {
	register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'create_block_videopress_block_init' );
