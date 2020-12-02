<?php
/**
 * Dialogue Block.
 *
 * @since 9.x
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Dialogue;

use Jetpack_Gutenberg;

use Automattic\Jetpack\Blocks;

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
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			$uses             => array(
				'jetpack/conversation-speakers',
				'jetpack/transcription-showtimestamp',
			),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Dialogue block registration/dependency declaration.
 *
 * @param array  $attrs    Array containing the Dialogue block attributes.
 * @param string $block_content String containing the Dialogue block content.
 * @param object $block Block object data.
 *
 * @return string
 */
function render_block( $attrs, $block_content, $block ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	// Attributes..
	$speaker_slug_attr = isset( $attrs['speakerSlug'] ) ? $attrs['speakerSlug'] : null;
	$speaker_name_attr = isset( $attrs['speaker'] ) ? $attrs['speaker'] : null;
	$timestamp         = isset( $attrs['timeStamp'] ) ? esc_attr( $attrs['timeStamp'] ) : '00:00';
	$content           = '';

	if ( isset( $attrs['content'] ) ) {
		$content = wp_kses(
			$attrs['content'],
			array(
				'small'  => true,
				'code'   => true,
				'strong' => true,
				'b'      => true,
				'em'     => true,
			)
		);
	}

	// Pick up transcription data from context.
	$speakers       = $block->context['jetpack/conversation-speakers'];
	$show_timestamp = isset( $block->context['jetpack/transcription-showtimestamp'] );

	// Set current speaker slug, considering it could be null from block attrs.
	$speaker_slug = ! $speaker_slug_attr && ! $speaker_name_attr ? 'speaker-0' : $speaker_slug_attr;

	// Speaker names map.
	$speaker_names_map = array();
	foreach ( $speakers as $speaker ) {
		$speaker_names_map[ $speaker['speakerSlug'] ] = $speaker;
	}

	// Current Speaker object.
	$current_speaker = isset( $speaker_names_map[ $speaker_slug ] )
		? $speaker_names_map[ $speaker_slug ]
		: false;

	// Pick up speaker data from context.
	$speaker_name = isset( $current_speaker['speaker'] )
		? esc_attr( $current_speaker['speaker'] )
		: $speaker_name_attr;

	$speaker_has_bold_style = isset( $current_speaker['hasBoldStyle'] )
		? $current_speaker['hasBoldStyle']
		: false;

	$speaker_has_italic_style = isset( $current_speaker['hasItalicStyle'] )
		? $current_speaker['hasItalicStyle']
		: false;

	$speaker_has_uppercase_style = isset( $current_speaker['hasUppercaseStyle'] )
		? $current_speaker['hasUppercaseStyle']
		: false;

	// CSS classes and inline styles..
	$base_classname = 'wp-block-jetpack-dialogue';

	$speaker_css_classes = array( $base_classname . '__speaker' );
	if ( $speaker_has_bold_style ) {
		array_push( $speaker_css_classes, 'has-bold-style' );
	}

	if ( $speaker_has_italic_style ) {
		array_push( $speaker_css_classes, 'has-italic-style' );
	}

	if ( $speaker_has_uppercase_style ) {
		array_push( $speaker_css_classes, 'has-uppercase-style' );
	}

	// Markup.
	return '<div class="' . $base_classname . '" >' .
		'<div class="' . $base_classname . '__meta">' .
			'<div class="' . implode( ' ', $speaker_css_classes ) . '">' .
				$speaker_name .
			'</div>' .
			( $show_timestamp
				? '<div class="' . $base_classname . '__timestamp">' .
					$timestamp .
				'</div>'
				: ''
			) .
		'</div>' .
		'<div>' . $content . '</div>' .
	'</div>';
}
