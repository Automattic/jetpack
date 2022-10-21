<?php
/**
 * Writing prompts.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\WritingPrompts;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Status\Visitor;

const FEATURE_NAME = 'writing-prompts';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the writing prompt integration for the block editor.
 */
function register_extension() {
	Blocks::jetpack_register_block( BLOCK_NAME );
}

/**
 * Retrieve a daily writing prompt from the wpcom API and cache it.
 *
 * @return string JSON response from the API, as a string.
 */
function get_daily_writing_prompt() {
	$today         = date_i18n( 'Y-m-d', true );
	$transient_key = 'jetpack_writing_prompt_' . $today;
	$prompt_today  = get_transient( $transient_key );

	// Return the cached prompt, if we have it. Otherwise fetch it from the API.
	if ( false !== $prompt_today ) {
		return $prompt_today;
	}

	$blog_id  = \Jetpack_Options::get_option( 'id' );
	$response = \Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_user(
		'/sites/' . $blog_id . '/blogging-prompts?from=' . $today . '&number=1',
		'v2',
		array(
			'headers' => array(
				'Content-Type'    => 'application/json',
				'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
			),
		),
		null,
		'wpcom'
	);

	$response_status = wp_remote_retrieve_response_code( $response );

	if ( is_wp_error( $response ) || $response_status !== \WP_Http::OK ) {
		return null;
	}

	$prompt = wp_remote_retrieve_body( $response );
	set_transient( $transient_key, $prompt, DAY_IN_SECONDS );

	return $prompt;
}

/**
 * Checks URL params to determine if we should load a writing prompt.
 */
function inject_writing_prompts() {
	global $current_screen;

	// Return early if we are not in the block editor.
	if ( ! $current_screen instanceof \WP_Screen || ! wp_should_load_block_editor_scripts_and_styles() ) {
		return;
	}

	// Or if we aren't creating a new post.
	if ( 'add' !== $current_screen->action || 'post' !== $current_screen->post_type ) {
		return;
	}

	$daily_prompt = get_daily_writing_prompt();

	if ( $daily_prompt ) {
		wp_add_inline_script( 'jetpack-blocks-editor', 'var Jetpack_WritingPrompts = JSON.parse( decodeURIComponent( "' . rawurlencode( $daily_prompt ) . '" ) );', 'before' );
	}
}

add_action( 'init', __NAMESPACE__ . '\register_extension' );
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\inject_writing_prompts' );
