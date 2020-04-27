<?php
/**
 * Schedule Content Block.
 *
 * @since 8.5
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Schedule_Content;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'schedule-content';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Schedule Content block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Schedule Content block attributes.
 * @param string $content String containing the Schedule Content block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
	$time   = $attr['date'] - ( strtotime( current_time( 'mysql' ) ) * 1000 );
	$option = isset( $attr['radioOption'] ) ? $attr['radioOption'] : 'displayBlock';
	if ( ( $time < 0 && $option === 'displayBlock' ) || ( $time > 0 && $option === 'hideBlock' ) ) {
		return $content;
	}
}
