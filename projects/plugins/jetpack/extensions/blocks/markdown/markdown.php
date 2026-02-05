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

// Add source:markdown element to RSS feeds for posts containing the Markdown block.
require_once JETPACK__PLUGIN_DIR . '_inc/lib/markdown/rss.php';
if ( class_exists( 'WP_Block_Processor' ) ) {
	add_action( 'rss2_ns', 'jetpack_markdown_rss_namespace' );
	add_action( 'rss2_item', 'jetpack_markdown_block_rss_output_source_markdown' );
}
