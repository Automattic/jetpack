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
 * Helper function to filter dialogue content,
 * in order to provide a safe markup.
 *
 * @param string $content Dialogue content.
 * @return string Safe dialgue content markup.
 */
function filter_content( $content ) {
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
			'br'     => true,
		)
	);
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
		'content'        => ! empty( $attrs['content'] ) ? filter_content( $attrs['content'] ) : '',
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
		? esc_attr( $participant['participant'] )
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
 * @param array  $dialogue_attrs Array containing the Dialogue block attributes.
 * @param string $block_content String containing the Dialogue block content.
 * @param object $block Block object data.
 *
 * @return string
 */
function render_block( $dialogue_attrs, $block_content, $block ) {
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	// Pick up conversation data from context.
	$default_participants = json_decode(
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		file_get_contents( JETPACK__PLUGIN_DIR . 'extensions/blocks/conversation/participants.json' ),
		true
	);

	// Dialogue Attributes.
	$attrs = check_dialogue_attrs( $dialogue_attrs, $block );

	// Conversation/Dialogue data.
	$participants     = get_participantes_list( $block, $default_participants );
	$participant_slug = get_participant_slug( $attrs, $block, $default_participants );
	$participant_name = get_participant_name( $participants, $participant_slug, $attrs );

	// CSS classes and inline styles.
	$css_classname           = Blocks::classes( FEATURE_NAME, $dialogue_attrs );
	$participant_css_classes = build_participant_css_classes( $participants, $participant_slug, $attrs, $css_classname );

	// Markup.
	return '<div class="' . $css_classname . '" >' .
		'<div class="' . $css_classname . '__meta">' .
			'<div class="' . $participant_css_classes . '">' .
				$participant_name .
			'</div>' .
			( $attrs['show_timestamp']
				? '<div class="' . $css_classname . '__timestamp">' .
					$attrs['timestamp'] .
				'</div>'
				: ''
			) .
		'</div>' .
		'<div>' . $attrs['content'] . '</div>' .
	'</div>';
}
