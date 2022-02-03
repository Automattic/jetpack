<?php
/**
 * Donations Custom Amount Child Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Donations_Editable;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const DONATIONS_CUSTOM_AMOUNT_BLOCK_NAME = 'donations-custom-amount';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_custom_donations_amount_block() {
	Blocks::jetpack_register_block(
		DONATIONS_CUSTOM_AMOUNT_BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_custom_amount_block',
		)
	);
}

add_action( 'init', __NAMESPACE__ . '\register_custom_donations_amount_block' );

/**
 * Render callback.
 *
 * @param array  $attr Array containing the block attributes.
 * @param string $content   String containing the block content.
 *
 * @return string
 */
function render_custom_amount_block( $attr, $content ) {
	Jetpack_Gutenberg::load_styles_as_required( DONATIONS_CUSTOM_AMOUNT_BLOCK_NAME );

	return $content;
}
