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
 * Register the `ai-assistant-support` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-support' );
		}
	}
);

/**
 * Register the `ai-assistant-form-support` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-form-support' );
		}
	}
);

/**
 * Register the `ai-content-lens` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-content-lens' );
		}
	}
);

/**
 * Register the `ai-assistant-backend-prompts` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-backend-prompts' );
		}
	}
);

/**
 * Register the `ai-assistant-usage-panel` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-usage-panel' );
		}
	}
);

/**
 * Register the `ai-featured-image-generator` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-featured-image-generator' );
		}
	}
);

/**
 * Register the `ai-title-optimization` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-title-optimization' );
		}
	}
);

/**
 * Register the `ai-assistant-experimental-image-generation-support` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-experimental-image-generation-support' );
		}
	}
);

/**
 * Register the `ai-general-purpose-image-generator` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-general-purpose-image-generator' );
		}
	}
);

/**
 * Register the `ai-proofread-breve` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) && apply_filters( 'breve_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-proofread-breve' );
		}
	}
);

/**
 * Register the `ai-assistant-site-logo-support` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-assistant-site-logo-support' );
		}
	}
);

/**
 * Register the `ai-title-optimization-keywords-support` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) ) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-title-optimization-keywords-support' );
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
			apply_filters( 'ai_response_feedback_enabled', false )
		) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-response-feedback' );
		}
	}
);

/**
 * Register the `ai-seo-assistant` extension.
 */
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		if ( apply_filters( 'jetpack_ai_enabled', true ) &&
			apply_filters( 'ai_seo_assistant_enabled', false )
		) {
			\Jetpack_Gutenberg::set_extension_available( 'ai-seo-assistant' );
		}
	}
);
