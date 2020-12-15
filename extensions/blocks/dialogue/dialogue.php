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
				'jetpack/conversation-showTimestamps',
			),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Return participant list.
 * It will try to pick them up from the block context.
 * Otherwise, it will return the default participants list.
 *
 * @param object $block Block object data.
 * @param array $default Default conversation data.
 * @return array dialogue participants list.
 */
function get_participantes_list( $block, $default ) {
	return ! empty( $block->context['jetpack/conversation-participants'] )
		? $block->context['jetpack/conversation-participants']
		: $default['list'];
}

/**
 * Return participan slug,
 * dependng on the slug and label fo the dialogue block,
 * and default slug defined in the conversation data.
 *
 * @param string $slug Dialoge block slug.
 * @param string $label Dialoge block label.
 * @param object $block Block object data.
 * @param array $default Default conversation data.
 * @return array Dialoge slug if it's defined. Otherwise, default conversation slug.
 */
function get_participant_slug( $slug, $label, $block, $default ) {
	return ! $slug && ! $label
		? $default['slug']
		: $slug;
}
/**
 * Helper function to filter dialogue content.
 * It will filter teh content in oder to provide
 * safe markup.
 * 
 * @param string $content Dialogue content.
 * @return string Safe dialgue content markup.
 */
function get_filtered_content( $content ) {
	if ( empty( $content ) ) {
		return '';
	}

	return wp_kses(
		$content,
		array(
			'small'  => true,
			'strong' => true,
			'b'      => true,
			'em'     => true,
		)
	);
}

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

	// Pick up conversation data from context.
	$default_participants = json_decode(
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		file_get_contents( JETPACK__PLUGIN_DIR . 'extensions/blocks/conversation/participants.json' ),
		true
	);

	// Dialogue Attributes.
	$slug_attr      = isset( $attrs['participantSlug'] ) ? $attrs['participantSlug'] : null;
	$label_attr     = isset( $attrs['participant'] ) ? $attrs['participant'] : null;
	$timestamp      = isset( $attrs['timestamp'] ) ? esc_attr( $attrs['timestamp'] ) : '00:00';
	$show_timestamp = isset( $block->context['jetpack/conversation-showTimestamps'] );

	// Conversation/Dialogue data.
	$participants      = get_participantes_list( $block, $default_participants );
	$participant_slug  = get_participant_slug( $slug_attr, $label_attr, $block, $default_participants );
	$is_custom_speaker = $label_attr && ! $slug_attr;
	$content           = get_filtered_content( $attrs['content'] );

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
		: $label_attr;

	$participant_has_bold_style = $is_custom_speaker && isset( $attrs['hasBoldStyle'] )
		? $attrs['hasBoldStyle']
		: (
			isset( $current_participant['hasBoldStyle'] )
				? $current_participant['hasBoldStyle']
				: false
		);

	$participant_has_italic_style = $is_custom_speaker && isset( $attrs['hasItalicStyle'] )
		? $attrs['hasItalicStyle']
		: (
			isset( $current_participant['hasItalicStyle'] )
				? $current_participant['hasItalicStyle']
				: false
		);

	$participant_has_uppercase_style = $is_custom_speaker && isset( $attrs['hasUppercaseStyle'] )
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
