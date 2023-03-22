<?php
/**
 * Yoast Collaboration Block.
 *
 * @since 8.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Yoast_Promo;

use Automattic\Jetpack\Blocks;

const FEATURE_NAME = 'yoast-promo';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the Yoast Collaboration feature with the block editor.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
			'plan_check' => false,
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );
