<?php
/**
 * Block Editor - Block Notes plugin feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\BlockNotes;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\My_Jetpack\Products\Jetpack_Ai;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

const FEATURE_NAME            = 'block-notes';
const ASSET_BASE_PATH         = 'widgets.wp.com/agents-manager/';
const ASSET_JS_URL            = 'https://' . ASSET_BASE_PATH . 'block-notes.min.js';
const ASSET_JSON_URL          = 'https://' . ASSET_BASE_PATH . 'block-notes.asset.json';
const ASSET_JSON_PATH         = ASSET_BASE_PATH . 'block-notes.asset.json';
const ASSET_TRANSIENT         = 'jetpack_block_notes_asset';
const HEADLESS_AGENT_PROVIDER = 'block-notes/headless-agent-provider';

/**
 * Check if Block Notes is enabled.
 *
 * Enabled when the Big Sky plugin is active, or when the site has
 * a paid Jetpack AI plan and AI features are not disabled.
 *
 * @return bool
 */
function is_block_notes_enabled() {
	/**
	 * Temporarily disabled while we investigate expensive API calls
	 * triggered by has_paid_ai_plan() on every Gutenberg page load for
	 * self-hosted sites. Filter allows tests and development to re-enable.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $enabled Whether Block Notes is force-enabled. Default false.
	 */
	if ( ! apply_filters( 'jetpack_block_notes_enabled', false ) ) {
		return false;
	}

	if ( is_big_sky_enabled() ) {
		return true;
	}

	if ( ! has_jetpack_ai_features() ) {
		return false;
	}

	if ( ! has_paid_ai_plan() ) {
		return false;
	}

	return true;
}

/**
 * Check if the site has a paid Jetpack AI plan.
 *
 * On WordPress.com, uses the lightweight wpcom_site_has_feature() lookup.
 * On self-hosted and Atomic sites, uses the My Jetpack product class.
 *
 * @return bool
 */
function has_paid_ai_plan() {
	$has_paid_plan = false;

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM && function_exists( 'wpcom_site_has_feature' ) ) {
		$has_paid_plan = wpcom_site_has_feature( 'ai-assistant', get_current_blog_id() );
	} elseif ( class_exists( Jetpack_Ai::class ) ) {
		$has_paid_plan = Jetpack_Ai::has_paid_plan_for_product();
	}

	/**
	 * Filter whether the site has a paid AI plan.
	 *
	 * @since 15.7
	 *
	 * @param bool $has_paid_plan Whether the site has a paid AI plan.
	 */
	return apply_filters( 'jetpack_block_notes_has_paid_ai_plan', $has_paid_plan );
}

/**
 * Check if the Big Sky plugin is active and enabled.
 *
 * Defaults to enabled ('1') when the Big_Sky class exists but the option
 * has never been set — plugin presence implies the feature should be on.
 *
 * @return bool
 */
function is_big_sky_enabled() {
	return class_exists( 'Big_Sky' ) && get_option( 'big_sky_enable', '1' );
}

/**
 * Check whether AI features are available.
 *
 * - wpcom simple: always returns true. The jetpack_ai_enabled filter
 *   does not apply here; the paid plan check in has_paid_ai_plan()
 *   gates access instead.
 * - Otherwise requires a connected owner, not in offline mode, and
 *   AI not disabled via the jetpack_ai_enabled filter.
 *
 * @return bool
 */
function has_jetpack_ai_features() {
	$host = new Host();

	if ( $host->is_wpcom_simple() ) {
		return true;
	}

	return ( new Connection_Manager( 'jetpack' ) )->has_connected_owner()
		&& ! ( new Status() )->is_offline_mode()
		&& apply_filters( 'jetpack_ai_enabled', true );
}

/**
 * Check if the current screen is the post editor for a 'post' post type.
 *
 * Block Notes is only for the post editor (not site editor, pages, or other contexts).
 *
 * @return bool
 */
function is_post_editor() {
	if ( ! function_exists( 'get_current_screen' ) ) {
		return false;
	}

	$screen = get_current_screen();
	return $screen
		&& $screen->is_block_editor()
		&& 'post' === $screen->base
		&& 'post' === $screen->post_type;
}

/**
 * Determine if Block Notes should load on the current screen.
 *
 * @return bool
 */
function should_load_on_current_screen() {
	return is_post_editor();
}

/**
 * Register the Block Notes plugin.
 *
 * Registers when Block Notes is enabled. Screen-level gating happens at
 * enqueue time since get_current_screen() is not available here.
 *
 * @return void
 */
function register_plugin() {
	if ( ! is_block_notes_enabled() ) {
		return;
	}

	\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugin' );

/**
 * Fetch and cache the remote asset manifest.
 *
 * On WordPress.com, the asset file may be accessible on the local filesystem
 * (under ABSPATH). This avoids an HTTP round-trip and works on sandboxes where
 * outbound requests to widgets.wp.com may be blocked.
 *
 * @return array|false The decoded asset data, or false on failure.
 */
function get_asset_data() {
	$cached = get_transient( ASSET_TRANSIENT );
	if ( false !== $cached ) {
		return $cached;
	}

	$data = get_asset_data_from_file();
	if ( false === $data ) {
		$data = get_asset_data_from_remote();
	}

	if ( false === $data ) {
		return false;
	}

	if ( ! ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ) {
		set_transient( ASSET_TRANSIENT, $data, HOUR_IN_SECONDS );
	}
	return $data;
}

/**
 * Try to read the asset manifest from the local filesystem.
 *
 * On WordPress.com, widgets.wp.com assets are available at ABSPATH.
 *
 * @return array|false The decoded asset data, or false if not available locally.
 */
function get_asset_data_from_file() {
	$local_path = ABSPATH . ASSET_JSON_PATH;
	if ( ! file_exists( $local_path ) ) {
		return false;
	}

	// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reading a local file, not a remote URL.
	$contents = file_get_contents( $local_path );
	if ( false === $contents ) {
		return false;
	}

	$data = json_decode( $contents, true );
	if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $data ) ) {
		return false;
	}

	return $data;
}

/**
 * Fetch the asset manifest via HTTP.
 *
 * Used as a fallback when the file is not available locally (e.g. self-hosted sites).
 *
 * @return array|false The decoded asset data, or false on failure.
 */
function get_asset_data_from_remote() {
	$response = wp_safe_remote_get( ASSET_JSON_URL );
	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return false;
	}

	$content_type = wp_remote_retrieve_header( $response, 'content-type' );
	if ( is_string( $content_type ) && false === stripos( $content_type, 'json' ) ) {
		return false;
	}

	$body = wp_remote_retrieve_body( $response );
	$data = json_decode( $body, true );
	if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $data ) ) {
		return false;
	}

	return $data;
}

/**
 * Enqueue Block Notes script asset.
 *
 * @return void
 */
function do_enqueue_assets() {
	if ( ! is_block_notes_enabled() ) {
		return;
	}

	$asset_data = get_asset_data();
	if ( ! $asset_data ) {
		return;
	}

	$version      = $asset_data['version'] ?? false;
	$dependencies = $asset_data['dependencies'] ?? array();

	wp_enqueue_script(
		FEATURE_NAME,
		ASSET_JS_URL,
		$dependencies,
		$version,
		true
	);

	wp_add_inline_script(
		FEATURE_NAME,
		'if ( typeof window.blockNotesData === "undefined" ) { window.blockNotesData = ' . wp_json_encode( array( 'enabled' => true ), JSON_HEX_TAG | JSON_HEX_AMP ) . '; }',
		'before'
	);
}

/**
 * Enqueue Block Notes assets in the post editor.
 *
 * Only loads when should_load_on_current_screen() returns true.
 *
 * @return void
 */
function enqueue_block_notes() {
	if ( ! should_load_on_current_screen() ) {
		return;
	}

	do_enqueue_assets();
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_block_notes' );

/**
 * Enable the agents manager unified experience on self-hosted sites
 * when Block Notes is enabled.
 *
 * This ensures the agents manager loads and can host the headless agent
 * even when the unified chat experience is not otherwise enabled.
 *
 * @param bool $use_unified_experience Current value of the filter.
 * @return bool
 */
function enable_agents_manager_for_block_notes( $use_unified_experience ) {
	if ( $use_unified_experience ) {
		return true;
	}

	return is_block_notes_enabled();
}
add_filter( 'agents_manager_use_unified_experience', __NAMESPACE__ . '\enable_agents_manager_for_block_notes' );

/**
 * Register the Block Notes headless agent provider with the agents manager.
 *
 * When Block Notes is enabled, adds the Block Notes headless
 * agent provider module so the agents manager can load it.
 *
 * @param array $providers Existing agent provider module IDs.
 * @return array Modified array of provider module IDs.
 */
function register_headless_agent_provider( $providers ) {
	if ( ! is_block_notes_enabled() ) {
		return $providers;
	}

	$providers[] = HEADLESS_AGENT_PROVIDER;
	return $providers;
}
add_filter( 'agents_manager_agent_providers', __NAMESPACE__ . '\register_headless_agent_provider' );

/**
 * Register Block Notes meta fields and filters.
 *
 * Registers the comment meta field used to track AI processing, and hooks
 * the avatar filter for AI-authored notes.
 *
 * @return void
 */
function register_meta_fields() {
	if ( ! is_block_notes_enabled() ) {
		return;
	}

	register_meta(
		'comment',
		'bigsky_ai_processed_date',
		array(
			'type'              => 'string',
			'description'       => 'ISO date when this note was processed by AI (empty if not processed)',
			'single'            => true,
			'show_in_rest'      => true,
			'auth_callback'     => __NAMESPACE__ . '\meta_auth_callback',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);

	add_filter( 'get_avatar_data', __NAMESPACE__ . '\customize_ai_avatar', 10, 2 );
}
add_action( 'init', __NAMESPACE__ . '\register_meta_fields' );

/**
 * Authorization callback for the bigsky_ai_processed_date comment meta.
 *
 * @return bool
 */
function meta_auth_callback() {
	return current_user_can( 'edit_posts' );
}

/**
 * Customize the avatar for AI-authored block notes.
 *
 * @param array $args         Avatar data arguments.
 * @param mixed $id_or_email  The Gravatar to retrieve.
 * @return array Modified avatar arguments.
 */
function customize_ai_avatar( $args, $id_or_email ) {
	if ( is_object( $id_or_email ) && isset( $id_or_email->comment_author ) ) {
		if ( 'AI [experimental]' === $id_or_email->comment_author ) {
			$args['url'] = plugins_url( 'images/big-sky.svg', JETPACK__PLUGIN_FILE );
		}
	}
	return $args;
}
