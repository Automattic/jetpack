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
use Jetpack_Gutenberg;

require_once  __DIR__ . '/../../../modules/sharedaddy/sharing-service.php' ;

const FEATURE_NAME = 'sharing-buttons';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
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
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$sharing_element = sharing_display( 'SHARE', false );

	return $content;

	return sprintf(
		'<div class="%1$s">%2$s <div class="cool_sharing_elements">%3$s</div></div>',
		esc_attr( Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attr ) ),
		$content,
		$sharing_element,
	);
}
