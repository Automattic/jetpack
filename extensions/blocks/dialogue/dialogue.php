<?php
/**
 * Dialogue Block.
 *
 * @since 9.x
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Dialogue;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'dialogue';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	$deprecated = function_exists( 'gutenberg_get_post_from_context' );
	$uses       = $deprecated ? 'context' : 'uses_context';
	register_block_type(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			$uses             => array(
				'jetpack/conversation-speakers'
			),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Dialogue block registration/dependency declaration.
 *
 * @param array  $attrs    Array containing the Dialogue block attributes.
 * @param string $content String containing the Dialogue block content.
 *
 * @return string
 */
function render_block( $attrs, $content, $block ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	// Attributes..
	$speaker_slug = isset( $attrs[ 'speakerSlug' ] ) ? $attrs[ 'speakerSlug' ] : null;
	$speaker_name_attr = isset( $attrs[ 'speaker' ] ) ? $attrs[ 'speaker' ] : 'First';
	$timestamp = isset( $attrs[ 'timeStamp' ] ) ? esc_attr( $attrs[ 'timeStamp' ] ) : '00:00';

	// Pick up speaker name from block context.
	$speakers = $block->context['jetpack/conversation-speakers' ];	

	// Speaker names map.
	$speaker_names_map = array();
	foreach( $speakers as $speaker ) {
		$speaker_names_map[ $speaker['speakerSlug'] ] = array(
			'name' => $speaker['speaker'],
		);
	}

	// Get speaker name from context.
	$speaker_name =  isset( $speaker_names_map[ $speaker_slug ]['name' ] )
		? esc_attr( $speaker_names_map[ $speaker_slug ]['name' ] )
		: $speaker_name_attr;

	// Markup
	$base_classname = 'wp-block-jetpack-dialogue';
	$markup = '<div class="' . $base_classname .  '" >' .
		'<div class="'. $base_classname . '__meta">' .
			'<div class="'. $base_classname . '__speaker">' .
				$speaker_name .
			'</div>' .
			'<div class="'. $base_classname . '__timestamp">' .
				$timestamp .
			'</div>' .
		'</div>' .
		$content .
	'</div>';
	return $markup;
}
