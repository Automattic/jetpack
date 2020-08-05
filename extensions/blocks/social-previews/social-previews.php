<?php
/**
 * Social Previews Block.
 *
 * @since 8.x
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Social_Previews;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'social-previews';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the Social Previews feature with the block editor.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array(
			'plan_check' => true,
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );
