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

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers our block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
	( ( new Host() )->is_wpcom_simple()
		|| ! ( new Status() )->is_offline_mode()
	) && apply_filters( 'jetpack_ai_enabled', true )
	) {
		Blocks::jetpack_register_block(
			__DIR__,
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
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		$content
	);
}

/**
 * Register extensions.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-support' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-form-support' );
			Jetpack_Gutenberg::set_extension_available( 'ai-content-lens' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-backend-prompts' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-usage-panel' );
			Jetpack_Gutenberg::set_extension_available( 'ai-featured-image-generator' );
			Jetpack_Gutenberg::set_extension_available( 'ai-title-optimization' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-experimental-image-generation-support' );
			Jetpack_Gutenberg::set_extension_available( 'ai-general-purpose-image-generator' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-site-logo-support' );
			Jetpack_Gutenberg::set_extension_available( 'ai-title-optimization-keywords-support' );
			Jetpack_Gutenberg::set_extension_available( 'ai-assistant-image-extension' );

			if ( apply_filters( 'breve_enabled', true ) ) {
				Jetpack_Gutenberg::set_extension_available( 'ai-proofread-breve' );
			}

			if ( apply_filters( 'ai_seo_enhancer_enabled', true ) ) {
				Jetpack_Gutenberg::set_availability_for_plan( 'ai-seo-enhancer' );
			}
		}
	}
);

/**
 * Register the `ai-list-to-table-transform` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) &&
			apply_filters( 'list_to_table_transform_enabled', false )
		) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-list-to-table-transform' );
		}
	}
);

/**
 * Register the `ai-response-feedback` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) &&
			apply_filters( 'ai_response_feedback_enabled', true )
		) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-response-feedback' );
		}
	}
);
