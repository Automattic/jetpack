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
use Automattic\Jetpack\Status\Visitor;
use function Automattic\Jetpack\Extensions\Shared\determine_iso_639_locale;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/../../shared/cdn-locale.php';

const FEATURE_NAME           = 'image-studio';
const FEATURE_CLIP_META_KEY  = '_jetpack_feature_clip_id';
const ASSET_BASE_PATH        = 'widgets.wp.com/agents-manager/';
const ASSET_JS_URL           = 'https://' . ASSET_BASE_PATH . 'image-studio.min.js';
const ASSET_CSS_URL          = 'https://' . ASSET_BASE_PATH . 'image-studio.css';
const ASSET_RTL_URL          = 'https://' . ASSET_BASE_PATH . 'image-studio.rtl.css';
const ASSET_JSON_URL         = 'https://' . ASSET_BASE_PATH . 'image-studio.asset.json';
const ASSET_JSON_PATH        = ASSET_BASE_PATH . 'image-studio.asset.json';
const ASSET_TRANSLATIONS_URL = 'https://' . ASSET_BASE_PATH . 'languages/';
const ASSET_TRANSIENT        = 'jetpack_image_studio_asset';

/**
 * Check whether Image Studio is offered on this site.
 *
 * This is a site-level ownership check and intentionally does not consider the
 * current user's connection (see is_current_user_connected() for that). It
 * drives the Big Sky stand-down signal and the suppression of the legacy AI
 * image extensions, so it must stay true for the whole site even when a given
 * visitor can't use the feature. Enabled in CIAB and Big Sky contexts, or when
 * the site has Jetpack AI features available.
 *
 * @return bool
 */
function is_image_studio_enabled() {
	if ( is_ciab_environment() || is_big_sky_enabled() ) {
		return true;
	}

	if ( ! has_jetpack_ai_features() ) {
		return false;
	}

	return true;
}

/**
 * Whether the current user may load Image Studio's editor assets.
 *
 * True on WordPress.com Simple, which has no per-user Jetpack connection, so the
 * current user is always treated as connected. Atomic (WoA), self-hosted and VIP
 * all have per-user connections, so there the current user must have connected
 * their own WordPress.com account — a user who has disconnected is correctly
 * treated as not connected. Gates the asset enqueue and the media-library entry
 * point so non-connected users aren't shown tools that would only error out.
 *
 * @return bool
 */
function is_current_user_connected() {
	// Simple has no per-user connection; Atomic/WoA does, so it uses the real
	// per-user check like self-hosted and VIP rather than short-circuiting.
	if ( ( new Host() )->is_wpcom_simple() ) {
		return true;
	}

	return ( new Connection_Manager( 'jetpack' ) )->is_user_connected();
}

/**
 * Check if the Big Sky plugin is active and enabled.
 *
 * @return bool
 */
function is_big_sky_enabled() {
	return class_exists( 'Big_Sky' ) && get_option( 'big_sky_enable', '1' );
}

/**
 * Check if current environment is CIAB (Commerce in a Box) / Next Admin.
 *
 * Uses the same detection method as Help Center and Agents Manager
 *
 * @return bool True if CIAB/Next Admin environment.
 */
function is_ciab_environment() {
	return (bool) did_action( 'next_admin_init' );
}

/**
 * Signal to Big Sky that Jetpack is handling Image Studio.
 *
 * Sets the jetpack_image_studio_enabled filter to true so that
 * Big Sky skips its own Image Studio loading when Jetpack has
 * AI features available.
 *
 * @return void
 */
function signal_image_studio_active() {
	if ( is_image_studio_enabled() ) {
		add_filter( 'jetpack_image_studio_enabled', '__return_true', 5 );
	}
}
add_action( 'init', __NAMESPACE__ . '\signal_image_studio_active' );

/**
 * Check whether AI features are available.
 *
 * - wpcom simple: always available.
 * - Otherwise requires a connected owner with AI not disabled
 *   (same conditions the AI Assistant plugin uses to register).
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
 * Check whether the video clip generation flow can run on the current site.
 *
 * Image Studio enablement is always required — video clip generation is only
 * offered on the same plans/environments that surface Image Studio itself,
 * on WPCOM and off. On WPCOM the helper also mirrors the server-side
 * `wpcom_site_can_upload_videos()` capability check so the client and server
 * agree. Off-WPCOM (self-hosted Jetpack, standalone VideoPress, dev
 * environments) that helper isn't loaded, so only the Image Studio gate
 * applies; the server is the source of truth if generation is unsupported.
 *
 * @return bool
 */
function image_studio_can_generate_video_clips() {
	if ( ! is_image_studio_enabled() ) {
		return false;
	}

	if ( function_exists( 'wpcom_site_can_upload_videos' ) && ! wpcom_site_can_upload_videos() ) {
		return false;
	}

	/**
	 * Filter the video clip generation capability. Consulted only after the
	 * Image Studio and `wpcom_site_can_upload_videos()` hard gates pass.
	 *
	 * @since 15.9
	 *
	 * @param bool|null $override Override value, or null to use default detection.
	 */
	$override = apply_filters( 'jetpack_image_studio_can_generate_video_clips', null );
	if ( null !== $override ) {
		return (bool) $override;
	}

	return true;
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
 * Permission check for reading or writing the feature clip meta on a given
 * post. WordPress runs `auth_callback` for both REST GET and POST against the
 * meta key, so this gate determines visibility as well as mutability.
 *
 * @param bool   $allowed   Whether the user is allowed (unused — recomputed here).
 * @param string $meta_key  Meta key being checked.
 * @param int    $object_id Post ID.
 * @return bool
 */
function feature_clip_meta_auth_callback( $allowed, $meta_key, $object_id ) {
	unset( $allowed, $meta_key );
	return current_user_can( 'edit_post', (int) $object_id );
}

/**
 * Register the post meta that links a generated video clip to a post.
 *
 * Stored as the attachment ID; the URL is resolved client-side via the
 * Media Library so deletes/replacements stay consistent. Registered for
 * `post` only — pages can be added later if there's a use case.
 *
 * @return void
 */
function register_feature_clip_post_meta() {
	if ( ! is_image_studio_enabled() ) {
		return;
	}

	register_post_meta(
		'post',
		FEATURE_CLIP_META_KEY,
		array(
			'type'              => 'integer',
			'description'       => 'Attachment ID of the generated video clip designated as this post\'s feature clip.',
			'single'            => true,
			'default'           => 0,
			'show_in_rest'      => true,
			'sanitize_callback' => 'absint',
			'auth_callback'     => __NAMESPACE__ . '\feature_clip_meta_auth_callback',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_feature_clip_post_meta' );

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
 * Get the current site's WordPress.com blog ID for tracking.
 *
 * @return int The WordPress.com blog ID, or 0 when unavailable.
 */
function get_tracking_blog_id() {
	$blog_id = ( new Host() )->get_wpcom_site_id();

	return $blog_id ? absint( $blog_id ) : 0;
}

/**
 * Get the current site type for Image Studio tracking.
 *
 * @return string The site type: simple, atomic, or jetpack.
 */
function get_tracking_site_type() {
	$host = new Host();

	if ( $host->is_wpcom_simple() ) {
		return 'simple';
	}

	if ( $host->is_woa_site() ) {
		return 'atomic';
	}

	return 'jetpack';
}

/**
 * Check whether the current visitor should be treated as an Automattician.
 *
 * @return bool True when the current visitor is an Automattician.
 */
function is_tracking_automattician() {
	if ( function_exists( 'wpcom_is_proxied_request' )
		&& \wpcom_is_proxied_request()
		&& function_exists( 'is_automattician' )
	) {
		return (bool) \is_automattician();
	}

	return ( new Visitor() )->is_automattician_feature_flags_only();
}

/**
 * Enqueue Image Studio script and style assets.
 *
 * @return void
 */
function do_enqueue_assets() {
	if ( ! is_image_studio_enabled() || ! is_current_user_connected() ) {
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
		// Shared handle with the Agents Manager package, which enqueues the same
		// file. Both register it, so WordPress de-duplicates when both load and
		// each still works on its own.
		wp_enqueue_script(
			'agents-manager-translations',
			ASSET_TRANSLATIONS_URL . $locale . '-v1.js',
			array( 'wp-i18n' ),
			$version,
			true
		);

		$dependencies[] = 'agents-manager-translations';
	}

	wp_enqueue_script(
		FEATURE_NAME,
		ASSET_JS_URL,
		$dependencies,
		$version,
		true
	);

	$image_studio_data = array(
		'enabled'               => true,
		'version'               => '1.0',
		'blogId'                => get_tracking_blog_id(),
		'siteType'              => get_tracking_site_type(),
		'isA11n'                => is_tracking_automattician(),
		'isDevMode'             => jetpack_is_internal_testing_environment(),
		'canGenerateVideoClips' => image_studio_can_generate_video_clips(),
	);

	wp_add_inline_script(
		FEATURE_NAME,
		'if ( typeof window.imageStudioData === "undefined" ) { window.imageStudioData = ' . wp_json_encode( $image_studio_data, JSON_HEX_TAG | JSON_HEX_AMP ) . '; }',
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
 * Adds an "Edit with AI" row action for supported image types in the media library list view.
 *
 * Inserts the action before the default "Edit" link so it's prominently visible.
 * Only appears for image MIME types that Image Studio supports.
 *
 * @param array    $actions Row actions array.
 * @param \WP_Post $post    The attachment post object.
 * @return array Modified row actions.
 */
function add_image_studio_row_action( $actions, $post ) {
	// Keep in sync with IMAGE_STUDIO_SUPPORTED_MIME_TYPES in wp-calypso/packages/image-studio/src/types/index.ts.
	$supported_mime_types = array(
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/webp',
		'image/bmp',
		'image/tiff',
	);

	if ( ! in_array( $post->post_mime_type, $supported_mime_types, true ) ) {
		return $actions;
	}

	if ( ! current_user_can( 'edit_post', $post->ID ) ) {
		return $actions;
	}

	$link = sprintf(
		'<a href="#" class="big-sky-image-studio-link" data-attachment-id="%d">%s</a>',
		absint( $post->ID ),
		esc_html__( 'Edit with AI', 'jetpack' )
	);

	// Insert before the 'edit' action, or append if 'edit' is not present.
	$new_actions = array();
	foreach ( $actions as $key => $value ) {
		if ( 'edit' === $key ) {
			$new_actions['edit-with-ai'] = $link;
		}
		$new_actions[ $key ] = $value;
	}

	if ( ! isset( $new_actions['edit-with-ai'] ) ) {
		$new_actions['edit-with-ai'] = $link;
	}

	return $new_actions;
}

/**
 * Register the "Edit with AI" row action on the Media Library screen.
 *
 * @return void
 */
function register_row_action() {
	if ( ! is_image_studio_enabled() || ! is_current_user_connected() || ! is_media_library() ) {
		return;
	}

	add_filter( 'media_row_actions', __NAMESPACE__ . '\add_image_studio_row_action', 10, 2 );
}
add_action( 'current_screen', __NAMESPACE__ . '\register_row_action' );

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
 * Disable Jetpack AI image extensions when Image Studio is available.
 *
 * When Image Studio is available (via Jetpack_Gutenberg::is_available), AI image
 * extensions are disabled globally to avoid duplicate functionality.
 *
 * @return void
 */
function disable_jetpack_ai_image_extensions() {
	if ( ! \Jetpack_Gutenberg::is_available( FEATURE_NAME ) ) {
		return;
	}

	foreach ( get_ai_image_extensions() as $extension ) {
		\Jetpack_Gutenberg::set_extension_unavailable( $extension, 'image_studio_active' );
	}
}
// Priority 99 ensures this runs after all AI extensions are registered at default priority.
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\disable_jetpack_ai_image_extensions', 99 );
