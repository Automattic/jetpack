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

const FEATURE_NAME = 'blogging-prompts';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the blogging prompt integration for the block editor.
 */
function register_extension() {
	Blocks::jetpack_register_block( BLOCK_NAME );

	// Load the blogging-prompts endpoint here on init so its route will be registered.
	// We can use it with `WPCOM_API_Direct::do_request` to avoid a network request on Simple Sites.
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM && should_load_blogging_prompts() ) {
		wpcom_rest_api_v2_load_plugin_files( 'wp-content/rest-api-plugins/endpoints/blogging-prompts.php' );
	}
}

/**
 * Loads the blogging prompt extension within the editor, if appropriate.
 */
function inject_blogging_prompts() {
	// Return early if we are not in the block editor.
	if ( ! wp_should_load_block_editor_scripts_and_styles() ) {
		return;
	}

	// Or if we aren't creating a new post.
	if ( ! jetpack_is_new_post_screen() ) {
		return;
	}

	// And only for blogging sites or those explicitly responding to the prompt.
	if ( should_load_blogging_prompts() ) {
		$daily_prompts = jetpack_get_daily_blogging_prompts();

		if ( $daily_prompts ) {
			wp_add_inline_script(
				'jetpack-blocks-editor',
				'var Jetpack_BloggingPrompts = ' . wp_json_encode( $daily_prompts, JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
				'before'
			);
		}
	}
}

/**
 * Determines if the blogging prompts extension should be loaded in the editor.
 *
 * @return bool
 */
function should_load_blogging_prompts() {
	return jetpack_has_write_intent() ||
			jetpack_has_posts_page() ||
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Clicking a prompt response link can happen from notifications, Calypso, wp-admin, email, etc and only sets up a response post (tag, meta, prompt text); the user must take action to actually publish the post.
			( isset( $_GET['answer_prompt'] ) && absint( $_GET['answer_prompt'] ) );
}

add_action( 'init', __NAMESPACE__ . '\register_extension' );
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\inject_blogging_prompts' );
