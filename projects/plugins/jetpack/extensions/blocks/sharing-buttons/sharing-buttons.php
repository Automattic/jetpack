<?php
/**
 * Sharing Buttons Block.
 *
 * @since 11.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing_Buttons;

use Automattic\Jetpack\Blocks;
/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Sharing Buttons block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Sharing Buttons block attributes.
 * @param string $content String containing the Sharing Buttons block content.
 *
 * @return string
 */
function render_block( $attr, $content ) {
	// Render nothing in other contexts than frontend (i.e. feed, emails, API, etc.).
	if ( ! jetpack_is_frontend() ) {
		return '';
	}
	return $content;
}

/**
 * Add the services list to the block
 */
function add_sharing_buttons_block_data() {
	$services = array(
		'print',
		'facebook',
		'linkedin',
		'mail',
		'mastodon',
		'pinterest',
		'pocket',
		'reddit',
		'telegram',
		'tumblr',
		'whatsapp',
		'x',
		'nextdoor',
	);

	wp_add_inline_script(
		'jetpack-block-sharing-button',
		'var jetpack_sharing_buttons_services = ' . wp_json_encode( $services, JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
		'before'
	);
}
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\add_sharing_buttons_block_data' );
