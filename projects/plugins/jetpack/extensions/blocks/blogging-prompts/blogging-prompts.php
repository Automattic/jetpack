<?php
/**
 * Blogging prompts.
 *
 * @since 11.6
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\BloggingPrompts;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'blogging-prompts';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

// TODO: Enqueue styles for front-end view of block

/**
 * Registers the blogging prompt integration for the block editor.
 */
function register_extension() {
	Blocks::jetpack_register_block( BLOCK_NAME, array( 'render_callback' => __NAMESPACE__ . '\render_block' ) );

	// Load the blogging-prompts endpoint here on init so its route will be registered.
	// We can use it with `WPCOM_API_Direct::do_request` to avoid a network request on Simple Sites.
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM && should_load_blogging_prompts() ) {
		wpcom_rest_api_v2_load_plugin_files( 'wp-content/rest-api-plugins/endpoints/blogging-prompts.php' );
	}
}

function render_block( $attr ) {
	$wrapper_attributes = get_block_wrapper_attributes();

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		'Hello World!'
	);
}

/**
 * Loads the blogging prompt extension within the editor, if appropriate.
 */
function inject_blogging_prompts() {
	// Return early if we are not in the block editor.
	if ( ! wp_should_load_block_editor_scripts_and_styles() ) {
		return;
	}

	// Or if the editor's loading in a webview within the mobile app.
	if ( User_Agent_Info::is_mobile_app() ) {
		return;
	}

	// Or if we aren't creating a new post.
	if ( ! jetpack_is_new_post_screen() ) {
		return;
	}

	$prompt_id = get_blogging_prompt_answer_id();

	// And only for blogging sites or those explicitly responding to the prompt.
	if ( $prompt_id ) {
		$prompts = jetpack_get_blogging_prompts_by_id( $prompt_id );

		if ( $prompts ) {
			wp_add_inline_script(
				'jetpack-blocks-editor',
				'var Jetpack_BloggingPrompts = ' . wp_json_encode( $prompts, JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
				'before'
			);
		}
	}
}

/**
 * Get the blogging prompt id to answer, if there is one.
 *
 * @return int
 */
function get_blogging_prompt_answer_id() {
	 // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Clicking a prompt response link can happen from notifications, Calypso, wp-admin, email, etc and only sets up a response post (tag, meta, prompt text); the user must take action to actually publish the post.
	return isset( $_GET['answer_prompt'] ) && absint( $_GET['answer_prompt'] ) ? absint( $_GET['answer_prompt'] ) : 0;
}

add_action( 'init', __NAMESPACE__ . '\register_extension' );
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\inject_blogging_prompts' );
