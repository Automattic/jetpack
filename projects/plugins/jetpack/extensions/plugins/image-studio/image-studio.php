<?php
/**
 * Block Editor & Media Library - Image Studio plugin feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\ImageStudio;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

const FEATURE_NAME           = 'image-studio';
const ASSET_BASE_PATH        = 'widgets.wp.com/agents-manager/';
const ASSET_JS_URL           = 'https://' . ASSET_BASE_PATH . 'image-studio.min.js';
const ASSET_CSS_URL          = 'https://' . ASSET_BASE_PATH . 'image-studio.css';
const ASSET_RTL_URL          = 'https://' . ASSET_BASE_PATH . 'image-studio.rtl.css';
const ASSET_JSON_URL         = 'https://' . ASSET_BASE_PATH . 'image-studio.asset.json';
const ASSET_JSON_PATH        = ASSET_BASE_PATH . 'image-studio.asset.json';
const ASSET_TRANSLATIONS_URL = 'https://' . ASSET_BASE_PATH . 'languages/';
const ASSET_TRANSIENT        = 'jetpack_image_studio_asset';

/**
 * Check if Image Studio is enabled.
 *
 * Requires AI features (Big Sky or AI Assistant) plus at least one of:
 * - The unified chat experience (agents_manager_use_unified_experience).
 * - The jetpack_image_studio_enabled filter.
 *
 * @return bool
 */
function is_image_studio_enabled() {
	if ( ! has_ai_features() ) {
		return false;
	}

	return apply_filters( 'agents_manager_use_unified_experience', false )
		|| apply_filters( 'jetpack_image_studio_enabled', false );
}

/**
 * Check whether AI features are available.
 *
 * - wpcom simple: always available.
 * - Atomic: requires Big Sky or AI Assistant feature flags.
 * - Self-hosted: requires a connected owner with AI not disabled
 *   (same conditions the AI Assistant plugin uses to register).
 *
 * @return bool
 */
function has_ai_features() {
	$host = new Host();

	if ( $host->is_wpcom_simple() ) {
		return true;
	}

	return ( new Connection_Manager( 'jetpack' ) )->has_connected_owner()
		&& ! ( new Status() )->is_offline_mode()
		&& apply_filters( 'jetpack_ai_enabled', true );
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
 * Determine if Image Studio should load on the current screen.
 *
 * - Media Library: load if either filter is true.
 * - Block editors (Post/Site Editor): load if either filter is true.
 * - Other screens: don't load.
 *
 * @return bool
 */
function should_load_on_current_screen() {
	return is_media_library() || is_block_editor();
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
 * Determine the ISO 639 locale code for the current user.
 *
 * @return string The ISO 639 language code, defaulting to 'en'.
 */
function determine_iso_639_locale() {
	$language = get_user_locale();
	$language = strtolower( $language );

	if ( in_array( $language, array( 'pt_br', 'pt-br', 'zh_tw', 'zh-tw', 'zh_cn', 'zh-cn' ), true ) ) {
		$language = str_replace( '_', '-', $language );
	} else {
		$language = preg_replace( '/([-_].*)$/i', '', $language );
	}

	if ( empty( $language ) ) {
		return 'en';
	}

	return $language;
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
	$locale       = determine_iso_639_locale();

	if ( 'en' !== $locale ) {
		// Load translations from widgets.wp.com.
		wp_enqueue_script(
			'image-studio-translations',
			ASSET_TRANSLATIONS_URL . $locale . '-v1.js',
			array( 'wp-i18n' ),
			$version,
			true
		);

		$dependencies[] = 'image-studio-translations';
	}

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
 * Enqueue Image Studio assets in the block editor.
 *
 * @return void
 */
function enqueue_image_studio() {
	if ( ! is_block_editor() ) {
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
 * Only disables AI extensions when we can confirm Image Studio will actually load
 * on the current screen (i.e. screen is available and should_load_on_current_screen()
 * returns true). If the screen is not available or Image Studio won't load on this
 * screen, AI extensions remain enabled.
 *
 * This ensures AI extensions are available on screens where Image Studio won't load
 * (e.g. dashboard, other non-editor screens, or early initialization).
 *
 * @return void
 */
function disable_jetpack_ai_image_extensions() {
	if ( ! is_image_studio_enabled() ) {
		return;
	}

	// Only disable if screen is available and Image Studio will actually load.
	if ( ! function_exists( 'get_current_screen' ) || ! get_current_screen() || ! should_load_on_current_screen() ) {
		return;
	}

	foreach ( get_ai_image_extensions() as $extension ) {
		\Jetpack_Gutenberg::set_extension_unavailable( $extension, 'image_studio_active' );
	}
}
// Priority 99 ensures this runs after all AI extensions are registered at default priority.
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\disable_jetpack_ai_image_extensions', 99 );
