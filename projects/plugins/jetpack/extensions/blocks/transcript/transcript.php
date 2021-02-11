<?php
/**
 * Transcript Block.
 *
 * @since 9.3.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Transcript;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'transcript';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	$deprecated = function_exists( 'gutenberg_get_post_from_context' );
	$provides   = $deprecated ? 'providesContext' : 'provides_context';

	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			$provides         => array(
				'jetpack/transcript-participants'   => 'participants',
				'jetpack/transcript-showTimestamps' => 'showTimestamps',
			),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Transcript block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Transcript block attributes.
 * @param string $content String containing the Transcript block content.
 *
 * @return string
 */
function render_block( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
	return $content;
}
