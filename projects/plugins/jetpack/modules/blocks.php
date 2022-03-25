<?php
/**
 * Module Name: Blocks
 * Module Description: Jetpack Blocks give you the power to deliver quality content that hooks website visitors without needing to hire a developer or learn a single line of code.
 * First Introduced: 10.8.0
 * Requires Connection: No
 * Auto Activate: Yes
 * Feature: Writing
 * Additional Search Queries: block, blocks, gutenberg
 *
 * @package automattic/jetpack
 */

/**
 * Prepare Gutenberg Editor functionality
 */
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-gutenberg.php';
add_action( 'plugins_loaded', array( 'Jetpack_Gutenberg', 'init' ) );
add_action( 'plugins_loaded', array( 'Jetpack_Gutenberg', 'load_independent_blocks' ) );
add_action( 'plugins_loaded', array( 'Jetpack_Gutenberg', 'load_block_editor_extensions' ), 9 );
add_action( 'enqueue_block_editor_assets', array( 'Jetpack_Gutenberg', 'enqueue_block_editor_assets' ) );
