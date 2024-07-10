<?php
/**
 * Event Countdown Block
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\EventCountdown;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

define( 'MU_WPCOM_JETPACK_COUNTDOWN_BLOCK', true );

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * EventCountdown block.
 *
 * @param array  $attr    Array containing the EventCountdown block attributes.
 * @param string $content String containing the EventCountdown block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );
	return $content;
}
