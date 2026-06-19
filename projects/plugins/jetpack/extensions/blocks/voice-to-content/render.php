<?php
/**
 * "Voice to content" block render implementation.
 *
 * Loaded lazily from voice-to-content.php only when the block is rendered, to keep
 * the render body out of the eager front-end PHP/opcache footprint.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Voice_To_Content;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * "Voice to content" block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the "Voice to content" block attributes.
 * @param string $content String containing the "Voice to content" block content.
 *
 * @return string
 */
function load_assets_implementation( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		$content
	);
}
