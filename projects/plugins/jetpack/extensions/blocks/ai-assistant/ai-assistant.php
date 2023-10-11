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
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'ai-assistant';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers our block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
		( new Host() )->is_wpcom_simple()
		|| ! ( new Status() )->is_offline_mode()
	) {
		Blocks::jetpack_register_block(
			BLOCK_NAME,
			array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

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

/**
 * Register the `ai-assistant-support` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-support' );
	}
);

/**
 * Register the `ai-assistant-form-support` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-form-support' );
	}
);

/**
 * Register the `ai-content-lens` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( 'ai-content-lens' );
	}
);

/**
 * Register the `ai-assistant-backend-prompts` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-backend-prompts' );
	}
);
