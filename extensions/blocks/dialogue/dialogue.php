<?php
/**
 * Dialogue Block.
 *
 * @since 9.3.0
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
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			$uses             => array(
				'jetpack/conversation-participants',
				'jetpack/conversation-showtimestamp',
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

	$default_participants = json_decode(
		file_get_contents( JETPACK__PLUGIN_DIR . 'extensions/blocks/conversation/participants.json' ),
		true
	);

	// Attributes..
	$participant_slug_attr  = isset( $attrs['participantSlug'] ) ? $attrs['participantSlug'] : null;
	$participant_label_attr = isset( $attrs['participant'] ) ? $attrs['participant'] : null;
	$timestamp              = isset( $attrs['timeStamp'] ) ? esc_attr( $attrs['timeStamp'] ) : '00:00';
	$is_custom_spaker       = $participant_label_attr && ! $participant_slug_attr;
	$content                = '';

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

	// Pick up conversation data from context.
	$participants   = isset( $block->context['jetpack/conversation-participants'] )
		? $block->context['jetpack/conversation-participants']
		: $default_participants['list'];

	$show_timestamp = isset( $block->context['jetpack/conversation-showtimestamp'] );

	// Set current participant slug, considering it could be null from block $attrs.
	$participant_slug = ! $participant_slug_attr && ! $participant_label_attr ? 'participant-0' : $participant_slug_attr;

	// Participant names map.
	$participant_names_map = array();
	foreach ( $participants as $participant ) {
		$participant_names_map[ $participant['participantSlug'] ] = $participant;
	}

	// Current Participant object.
	$current_participant = isset( $participant_names_map[ $participant_slug ] )
		? $participant_names_map[ $participant_slug ]
		: false;

	// Pick up participant data from context.
	$participant_name = isset( $current_participant['participant'] )
		? esc_attr( $current_participant['participant'] )
		: $participant_label_attr;

	$participant_has_bold_style = $is_custom_spaker && isset( $attrs['hasBoldStyle'] )
		? $attrs['hasBoldStyle']
		: (
			isset( $current_participant['hasBoldStyle'] )
				? $current_participant['hasBoldStyle']
				: false
		);

	$participant_has_italic_style = $is_custom_spaker && isset( $attrs['hasItalicStyle'] )
		? $attrs['hasItalicStyle']
		: (
			isset( $current_participant['hasItalicStyle'] )
				? $current_participant['hasItalicStyle']
				: false
		);

	$participant_has_uppercase_style = $is_custom_spaker && isset( $attrs['hasUppercaseStyle'] )
		? $attrs['hasUppercaseStyle']
		: (
			isset( $current_participant['hasUppercaseStyle'] )
				? $current_participant['hasUppercaseStyle']
				: false
		);

	// CSS classes and inline styles..
	$base_classname = 'wp-block-jetpack-dialogue';

	$participant_css_classes = array( $base_classname . '__participant' );
	if ( $participant_has_bold_style ) {
		array_push( $participant_css_classes, 'has-bold-style' );
	}

	if ( $participant_has_italic_style ) {
		array_push( $participant_css_classes, 'has-italic-style' );
	}

	if ( $participant_has_uppercase_style ) {
		array_push( $participant_css_classes, 'has-uppercase-style' );
	}

	// Markup.
	return '<div class="' . $base_classname . '" >' .
		'<div class="' . $base_classname . '__meta">' .
			'<div class="' . implode( ' ', $participant_css_classes ) . '">' .
				$participant_name .
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
