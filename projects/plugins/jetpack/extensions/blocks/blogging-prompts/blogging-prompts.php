<?php
/**
 * Blogging prompts.
 *
 * @since $$next-version$$
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
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM && jetpack_is_potential_blogging_site() ) {
		wpcom_rest_api_v2_load_plugin_files( 'wp-content/rest-api-plugins/endpoints/blogging-prompts.php' );
	}
}

/**
 * Checks URL params to determine if we should load a blogging prompt.
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

	// And only for blogging sites.
	if ( ! jetpack_is_potential_blogging_site() ) {
		return;
	}

	$daily_prompts = wp_json_encode( jetpack_get_daily_blogging_prompts() );

	if ( $daily_prompts ) {
		wp_add_inline_script( 'jetpack-blocks-editor', 'var Jetpack_BloggingPrompts = JSON.parse( decodeURIComponent( "' . rawurlencode( $daily_prompts ) . '" ) );', 'before' );
	}
}

add_action( 'init', __NAMESPACE__ . '\register_extension' );
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\inject_blogging_prompts' );
