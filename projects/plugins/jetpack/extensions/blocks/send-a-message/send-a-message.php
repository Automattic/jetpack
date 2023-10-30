<?php
/**
 * Send a Message Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Send_A_Message;

require_once __DIR__ . '/whatsapp-button/whatsapp-button.php';

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			'plan_check'      => true,
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	Jetpack_Gutenberg::load_styles_as_required( Blocks::get_block_feature( __DIR__ ) );

	return $content;
}
