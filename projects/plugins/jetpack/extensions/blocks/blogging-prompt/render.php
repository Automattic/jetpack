<?php
/**
 * Blogging Prompt block render implementation.
 *
 * Loaded lazily from blogging-prompt.php only when the block is rendered, to keep
 * the render body out of the eager front-end PHP/opcache footprint.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blogging_Prompt;

use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Dynamic rendering of the block.
 *
 * @param array  $attr    Array containing the Blogging Prompt block attributes.
 * @param string $content String containing the Blogging Prompt block content.
 *
 * @return string
 */
function render_implementation( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return $content;
}
