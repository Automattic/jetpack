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
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Visitor;

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
 * Retrieve a daily blogging prompt from the wpcom API and cache it.
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

	$blog_id = \Jetpack_Options::get_option( 'id' );
	$path    = '/sites/' . $blog_id . '/blogging-prompts?from=' . $today . '&number=1';
	$args    = array(
		'headers' => array(
			'Content-Type'    => 'application/json',
			'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
		),
		// `method` and `url` are needed for using `WPCOM_API_Direct::do_request`
		// `wpcom_json_api_request_as_user` will generate and overwrite these.
		'method'  => \WP_REST_Server::READABLE,
		'url'     => JETPACK__WPCOM_JSON_API_BASE . '/wpcom/v2' . $path,
	);

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		// This will load the library, but the `enqueue_block_assets` hook is too late to load any endpoints
		// using WPCOM_API_Direct::register_endpoints.
		require_lib( 'wpcom-api-direct' );
		$response = \WPCOM_API_Direct::do_request( $args );
	} else {
		$response = Client::wpcom_json_api_request_as_user( $path, 'v2', $args, null, 'wpcom' );
	}
	$response_status = wp_remote_retrieve_response_code( $response );

	if ( is_wp_error( $response ) || $response_status !== \WP_Http::OK ) {
		return null;
	}

	$prompt = wp_remote_retrieve_body( $response );
	set_transient( $transient_key, $prompt, DAY_IN_SECONDS );

	return $prompt;
}

/**
 * Checks URL params to determine if we should load a blogging prompt.
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

	// And only for blogging sites.
	if ( ! jetpack_is_potential_blogging_site() ) {
		return;
	}

	$daily_prompt = get_daily_writing_prompt();

	if ( $daily_prompt ) {
		wp_add_inline_script( 'jetpack-blocks-editor', 'var Jetpack_BloggingPrompts = JSON.parse( decodeURIComponent( "' . rawurlencode( $daily_prompt ) . '" ) );', 'before' );
	}
}

add_action( 'init', __NAMESPACE__ . '\register_extension' );
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\inject_writing_prompts' );
