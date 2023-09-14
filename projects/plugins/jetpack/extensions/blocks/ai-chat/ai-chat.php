<?php
/**
 * Jetpack AI Chat.
 *
 * @since 12.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AIChat;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers our block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Register the setting for the AI prompt override.
 */
function register_settings() {
	register_setting(
		'general',
		'jetpack_search_ai_prompt_override',
		array(
			'type'         => 'string',
			'show_in_rest' => true,
			'description'  => __( 'Override for the Jetpack AI prompt in the Jetpack AI Search feature.', 'jetpack' ),
			'defualt'      => '',
		)
	);
}

add_action( 'rest_api_init', __NAMESPACE__ . '\register_settings' );

/**
 * Jetpack AI Paragraph block registration/dependency declaration.
 *
 * @param array $attr Array containing the Jetpack AI Chat block attributes.
 *
 * @return string
 */
function load_assets( $attr ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$ask_button_label = isset( $attr['askButtonLabel'] ) ? $attr['askButtonLabel'] : __( 'Ask', 'jetpack' );

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id = get_current_blog_id();
		$type    = 'wpcom'; // WPCOM simple sites.
	} else {
		$blog_id = \Jetpack_Options::get_option( 'id' );
		$type    = 'jetpack'; // Self-hosted (includes Atomic)
	}

	return sprintf(
		'<div class="%1$s" data-ask-button-label="%2$s" id="jetpack-ai-chat" data-blog-id="%3$d" data-blog-type="%4$s"></div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		esc_attr( $ask_button_label ),
		esc_attr( $blog_id ),
		esc_attr( $type )
	);
}
