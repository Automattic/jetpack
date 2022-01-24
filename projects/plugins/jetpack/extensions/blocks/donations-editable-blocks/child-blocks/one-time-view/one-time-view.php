<?php
/**
 * Donations One Time View Child Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Donations_Editable;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const ONE_TIME_VIEW_BLOCK_NAME = 'donations-one-time-view';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_one_time_view_block() {
	Blocks::jetpack_register_block(
		MONTHLY_VIEW_BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_one_time_view_block',
		)
	);
}

add_action( 'init', __NAMESPACE__ . '\register_one_time_view_block' );

/**
 * Render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content   String containing the block content.
 *
 * @return string
 */
function render_one_time_view_block( $attributes, $content ) {
	Jetpack_Gutenberg::load_styles_as_required( ONE_TIME_VIEW_BLOCK_NAME );

	return $content;
}
