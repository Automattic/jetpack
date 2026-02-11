<?php
/**
 * Block Editor & Media Library - Image Studio plugin feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\ImageStudio;

const FEATURE_NAME    = 'image-studio';
const ASSET_BASE_PATH = 'widgets.wp.com/agents-manager/';
const ASSET_JS_URL    = 'https://' . ASSET_BASE_PATH . 'image-studio.min.js';
const ASSET_CSS_URL   = 'https://' . ASSET_BASE_PATH . 'image-studio.css';
const ASSET_RTL_URL   = 'https://' . ASSET_BASE_PATH . 'image-studio.rtl.css';
const ASSET_JSON_URL  = 'https://' . ASSET_BASE_PATH . 'image-studio.asset.json';
const ASSET_JSON_PATH = ASSET_BASE_PATH . 'image-studio.asset.json';
const ASSET_TRANSIENT = 'jetpack_image_studio_asset';

/**
 * Check if Image Studio is enabled.
 *
 * Returns true if either the unified chat experience or the
 * jetpack_image_studio_enabled filter is active.
 *
 * @return bool
 */
function is_image_studio_enabled() {
	return apply_filters( 'agents_manager_use_unified_experience', false )
		|| apply_filters( 'jetpack_image_studio_enabled', false );
}

/**
 * Check if the current screen is a block editor (Post Editor or Site Editor).
 *
 * @return bool
 */
function is_block_editor() {
	if ( ! function_exists( 'get_current_screen' ) ) {
		return false;
	}

	$screen = get_current_screen();
	return $screen && $screen->is_block_editor();
}

/**
 * Check if the current screen is the Media Library.
 *
 * @return bool
 */
function is_media_library() {
	if ( ! function_exists( 'get_current_screen' ) ) {
		return false;
	}

	$screen = get_current_screen();
	return $screen && 'upload' === $screen->base;
}

/**
 * Check if Image Studio has been explicitly enabled via query parameter.
 *
 * @return bool
 */
function has_enable_image_studio_param() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a feature flag check, not a form submission.
	if ( ! isset( $_GET['enable_image_studio'] ) || ! is_string( $_GET['enable_image_studio'] ) ) {
		return false;
	}
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- This is a feature flag check, not a form submission.
	return '1' === sanitize_text_field( wp_unslash( $_GET['enable_image_studio'] ) );
}

/**
 * Determine if Image Studio should load on the current screen.
 *
 * - Media Library: load if either filter is true (no query param needed).
 * - Block editors (Post/Site Editor): load only with `enable_image_studio=1` query param.
 * - Other screens: don't load.
 *
 * @return bool
 */
function should_load_on_current_screen() {
	return is_media_library() || ( is_block_editor() && has_enable_image_studio_param() );
}

/**
 * Register the Image Studio plugin.
 *
 * Registers unconditionally when either filter is true. Screen-level gating
 * happens at enqueue time since get_current_screen() is not available here.
 *
 * @return void
 */
function register_plugin() {
	if ( ! is_image_studio_enabled() ) {
		return;
	}

	\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugin' );

// Populate the available extensions with image-studio.
add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			(array) $extensions,
			array(
				FEATURE_NAME,
			)
		);
	}
);

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

	$cache_duration = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? 0 : HOUR_IN_SECONDS;
	set_transient( ASSET_TRANSIENT, $data, $cache_duration );
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
	$response = wp_remote_get( ASSET_JSON_URL );
	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return false;
	}

	$content_type = wp_remote_retrieve_header( $response, 'content-type' );
	if ( is_string( $content_type ) && false === strpos( $content_type, 'json' ) ) {
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
 * Enqueue Image Studio script and style assets.
 *
 * @return void
 */
function do_enqueue_assets() {
	if ( ! is_image_studio_enabled() ) {
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
		'if ( typeof window.imageStudioData === "undefined" ) { window.imageStudioData = ' . wp_json_encode( array( 'enabled' => true ), JSON_HEX_TAG | JSON_HEX_AMP ) . '; }',
		'before'
	);

	wp_enqueue_style(
		FEATURE_NAME . '-style',
		is_rtl() ? ASSET_RTL_URL : ASSET_CSS_URL,
		array( 'wp-components' ),
		$version
	);
}

/**
 * Enqueue Image Studio assets in the block editor when opted in via query param.
 *
 * @return void
 */
function enqueue_image_studio() {
	if ( ! is_block_editor() || ! has_enable_image_studio_param() ) {
		return;
	}

	do_enqueue_assets();
}
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_image_studio' );

/**
 * Enqueue Image Studio assets on admin screens (Media Library).
 *
 * @return void
 */
function enqueue_image_studio_admin() {
	if ( ! is_media_library() ) {
		return;
	}

	do_enqueue_assets();
}
add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\enqueue_image_studio_admin' );

/**
 * Get the list of AI image extensions that conflict with Image Studio.
 *
 * @return array
 */
function get_ai_image_extensions() {
	return array(
		'ai-featured-image-generator',
		'ai-assistant-image-extension',
		'ai-general-purpose-image-generator',
		'ai-assistant-experimental-image-generation-support',
	);
}

/**
 * Disable Jetpack AI image extensions when Image Studio is active on the current screen.
 *
 * This hook fires on `jetpack_register_gutenberg_extensions` which may run multiple
 * times: once during initial module load (before get_current_screen() is available)
 * and again inside Jetpack_Gutenberg::get_availability() during enqueue (where the
 * screen IS available).
 *
 * - First call (no screen): blanket disable as a safe default.
 * - Subsequent calls (screen available): only disable if Image Studio will actually
 *   load on this screen (i.e. should_load_on_current_screen() is true).
 *
 * This ensures AI extensions are restored on screens where Image Studio won't load
 * (e.g. Post Editor without the enable_image_studio=1 query param).
 *
 * @return void
 */
function disable_jetpack_ai_image_extensions() {
	if ( ! is_image_studio_enabled() ) {
		return;
	}

	// When the screen is available, only disable if Image Studio will actually load.
	if ( function_exists( 'get_current_screen' ) && get_current_screen() ) {
		if ( ! should_load_on_current_screen() ) {
			return;
		}
	}

	foreach ( get_ai_image_extensions() as $extension ) {
		\Jetpack_Gutenberg::set_extension_unavailable( $extension, 'image_studio_active' );
	}
}
// Priority 99 ensures this runs after all AI extensions are registered at default priority.
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\disable_jetpack_ai_image_extensions', 99 );
