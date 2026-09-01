<?php
/**
 * Premium Content Buttons Child Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

const BUTTONS_NAME = 'premium-content/buttons';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_buttons_block() {
	Blocks::jetpack_register_block(
		BUTTONS_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_buttons_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_buttons_block' );

/**
 * Render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_buttons_block( $attributes, $content ) {
	Jetpack_Gutenberg::load_styles_as_required( BUTTONS_NAME );

	return $content;
}
