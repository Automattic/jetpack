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
 * Helper function to convert the given time value
 * in a time code string with the `HH:MM:SS` shape.
 *
 * @param {integer} $time - Time, in seconds, to convert.
 * @return {string} Time converted in HH:MM:SS.
 */
function convert_time_code_to_seconds( $time ) {
	$sec = 0;
	foreach ( array_reverse( explode( ':', $time ) ) as $k => $v ) {
		$sec += pow( 60, $k ) * $v;
	}
	return $sec;
}

/**
 * Helper to check dialogue block attributes.
 *
 * @param array  $attrs Dialogue block attributes.
 * @param object $block Block object data.
 * @return array Checked block attribues.
 */
function check_dialogue_attrs( $attrs, $block ) {
	return array(
		'slug'           => isset( $attrs['participantSlug'] ) ? $attrs['participantSlug'] : null,
		'label'          => isset( $attrs['participant'] ) ? $attrs['participant'] : null,
		'timestamp'      => isset( $attrs['timestamp'] ) ? esc_attr( $attrs['timestamp'] ) : '00:00',
		'show_timestamp' => isset( $block->context['jetpack/conversation-showTimestamps'] ),
	);
}
/**
 * Return participant list.
 * It will try to pick them up from the block context.
 * Otherwise, it will return the default participants list.
 *
 * @param object $block Block object data.
 * @param array  $default Default conversation data.
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
 * @param array  $attrs Checked dialogue attributes array.
 * @param object $block Block object data.
 * @param array  $default Default conversation data.
 * @return array Dialoge slug if it's defined. Otherwise, default conversation slug.
 */
function get_participant_slug( $attrs, $block, $default ) {
	return ! $attrs['slug'] && ! $attrs['label']
		? $default['slug']
		: $attrs['slug'];
}

/**
 * Helper function to pick the dialogie participant object.
 *
 * @param array  $participants Dialogue participants.
 * @param string $slug participant slug.
 * @return array Dialogue participant when exists. Otherwise, False.
 */
function get_current_participant( $participants, $slug ) {
	// Participant names map.
	$participant_names_map = array();
	foreach ( $participants as $participant ) {
		$participant_names_map[ $participant['participantSlug'] ] = $participant;
	}

	return isset( $participant_names_map[ $slug ] )
		? $participant_names_map[ $slug ]
		: false;
}

/**
 * Helper function to get the participant name.
 *
 * @param array  $participants Dialogue participants.
 * @param string $slug participant slug.
 * @param array  $attrs checked dialogue block atteributes.
 * @return string Participant name.
 */
function get_participant_name( $participants, $slug, $attrs ) {
	// Try to pick up participant data from context.
	$participant = get_current_participant( $participants, $slug );

	return isset( $participant['participant'] )
		? $participant['participant']
		: $attrs['label'];
}

/**
 * Helper function to build CSS class,
 * for the given participant.
 *
 * @param array  $participants Dialogue participants.
 * @param string $slug participant slug.
 * @param array  $attrs checked dialogue block atteributes.
 * @param string $css_class Base dialogue block CSS classname.
 * @return string Participant CSS classnames.
 */
function build_participant_css_classes( $participants, $slug, $attrs, $css_class ) {
	$is_custom_speaker   = $attrs['label'] && ! $attrs['slug'];
	$current_participant = get_current_participant( $participants, $slug );

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

	$participant_css_classes = array( $css_class . '__participant' );
	if ( $participant_has_bold_style ) {
		array_push( $participant_css_classes, 'has-bold-style' );
	}

	if ( $participant_has_italic_style ) {
		array_push( $participant_css_classes, 'has-italic-style' );
	}

	if ( $participant_has_uppercase_style ) {
		array_push( $participant_css_classes, 'has-uppercase-style' );
	}

	return implode( ' ', $participant_css_classes );
}

/**
 * Dialogue block registration/dependency declaration.
 *
 * @param array  $attrs         Array containing the Dialogue block attributes.
 * @param string $block_content String containing the Dialogue block content.
 * @param object $block         Block object data.
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
	$sanitized_attrs = check_dialogue_attrs( $attrs, $block );

	// Conversation/Dialogue data.
	$participants     = get_participantes_list( $block, $default_participants );
	$participant_slug = get_participant_slug( $sanitized_attrs, $block, $default_participants );
	$participant_name = get_participant_name( $participants, $participant_slug, $sanitized_attrs );
	// Class list includes custom classes defined in block settings.
	$block_class_list = Blocks::classes( FEATURE_NAME, $attrs );
	// Only the generated class name for the block, without custom classes.
	$block_class = explode( ' ', $block_class_list )[0];

	$markup = sprintf(
		'<div class="%1$s"><div class="%2$s__meta"><div class="%3$s">%4$s</div>',
		esc_attr( $block_class_list ),
		esc_attr( $block_class ),
		esc_attr( build_participant_css_classes( $participants, $participant_slug, $sanitized_attrs, $block_class ) ),
		esc_html( $participant_name )
	);

	// Display timestamp if we have info about it.
	if ( $sanitized_attrs['show_timestamp'] ) {
		$markup .= sprintf(
			'<div class="%1$s__timestamp"><a href="#" class="%1$s__timestamp_link" data-timestamp="%2$s">%3$s</a></div>',
			esc_attr( $block_class ),
			convert_time_code_to_seconds( $sanitized_attrs['timestamp'] ),
			esc_attr( $sanitized_attrs['timestamp'] )
		);
	}

	$markup .= sprintf(
		'</div><div>%s</div></div>',
		! empty( $attrs['content'] ) ? wp_kses_post( $attrs['content'] ) : ''
	);

	return $markup;
}
