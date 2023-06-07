<?php
/**
 * Jetpack AI Assistant Block.
 *
 * @since 12.2
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AIAssistant;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'ai-assistant';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers our block for use in Gutenberg
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
 * Get the initial state data for hydrating the React UI.
 *
 * @return array|null
 */
function get_initial_state() {
	$base = null;

	if ( function_exists( 'get_current_screen' ) ) {
		$screen = get_current_screen();
		$base   = $screen->base;
	}

	return array(
		'currentScreen' => $base,
	);
}

/**
 * Render the initial state into a JavaScript variable.
 *
 * @return string
 */
function render_initial_state() {
	$initial_state = get_initial_state();

	if ( empty( $initial_state['currentScreen'] ) ) {
		return null;
	}

	return 'var jetpackAIAssistantInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $initial_state ) ) . '"));';
}

/**
 * Enqueue block scripts.
 */
function enqueue_scripts() {
	$initial_state_script = render_initial_state();

	if ( ! empty( $initial_state_script ) ) {
		wp_register_script( 'jetpack-ai-assistant', '', array(), \JETPACK__VERSION, false );
		wp_enqueue_script( 'jetpack-ai-assistant' );
		wp_add_inline_script( 'jetpack-ai-assistant', $initial_state_script, 'before' );
	}
}

add_action( 'current_screen', __NAMESPACE__ . '\enqueue_scripts' );

/**
 * Jetpack AI Assistant block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Jetpack AI Assistant block attributes.
 * @param string $content String containing the Jetpack AI Assistant block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$content
	);
}
