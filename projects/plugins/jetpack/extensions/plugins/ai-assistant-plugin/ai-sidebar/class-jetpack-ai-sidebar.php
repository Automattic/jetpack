<?php
/**
 * Jetpack AI Sidebar — Agents Manager CDN loader and provider registration.
 *
 * Loads the Agents Manager gutenberg variant from the widgets.wp.com CDN
 * (following the Image Studio pattern) and registers the Jetpack AI
 * provider for title optimization.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AiAssistantPlugin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

const AM_ASSET_BASE_PATH    = 'widgets.wp.com/agents-manager/';
const AM_ASSET_TRANSIENT    = 'jetpack_am_gutenberg_asset';
const AM_ASSET_DC_TRANSIENT = 'jetpack_am_gutenberg_dc_asset';

/**
 * Handles loading the Agents Manager from CDN and registering the
 * Jetpack AI provider in the block editor.
 */
class Jetpack_AI_Sidebar {

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		// Register as Agents Manager provider. The filter fires inside
		// Agents_Manager::enqueue_scripts() — harmless if AM is not active.
		// Priority 20 so Jetpack loads AFTER Image Studio (priority 10).
		add_filter( 'agents_manager_agent_providers', array( __CLASS__, 'register_provider' ), 20 );

		// Load AM from CDN if not already present.
		// Priority 200: runs AFTER the AM class in jetpack-mu-wpcom (priority 101),
		// so wp_script_is('agents-manager') correctly detects if AM is already loaded.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_am' ), 200 );
	}

	// ──────────────────────────────────────────────────
	// AM CDN loading
	// ──────────────────────────────────────────────────

	/**
	 * Load AM from CDN if not already present and we're in the block editor.
	 *
	 * @return void
	 */
	public static function maybe_enqueue_am(): void {
		if ( ! self::is_block_editor() ) {
			return;
		}

		// AM already loaded by jetpack-mu-wpcom — skip CDN load.
		if ( wp_script_is( 'agents-manager' ) ) {
			return;
		}

		if ( ! self::has_ai_features() ) {
			return;
		}

		$variant = self::get_variant();
		self::enqueue_am_from_cdn( $variant );
	}

	/**
	 * Determine which AM variant to load.
	 *
	 * @return string 'gutenberg' or 'gutenberg-disconnected'.
	 */
	private static function get_variant(): string {
		return self::is_jetpack_disconnected() ? 'gutenberg-disconnected' : 'gutenberg';
	}

	/**
	 * Enqueue the AM gutenberg variant from the widgets.wp.com CDN.
	 *
	 * @param string $variant The variant name ('gutenberg' or 'gutenberg-disconnected').
	 * @return void
	 */
	private static function enqueue_am_from_cdn( string $variant ): void {
		$asset_data = self::get_asset_data( $variant );
		if ( ! $asset_data ) {
			return;
		}

		$version      = $asset_data['version'] ?? false;
		$dependencies = $asset_data['dependencies'] ?? array();

		// Dev-mode cache busting — match AM class pattern.
		if ( self::is_dev_mode() ) {
			$version .= '-' . wp_rand();
		}

		// Translations.
		$locale = self::determine_iso_639_locale();
		if ( 'en' !== $locale ) {
			wp_enqueue_script(
				'agents-manager-translations',
				'https://' . AM_ASSET_BASE_PATH . "languages/{$locale}-v1.js",
				array( 'wp-i18n' ),
				$version,
				true
			);
			$dependencies[] = 'agents-manager-translations';
		}

		// Main JS bundle.
		$js_url = 'https://' . AM_ASSET_BASE_PATH . "agents-manager-{$variant}.min.js";
		wp_enqueue_script( 'agents-manager', $js_url, $dependencies, $version, true );

		// Inline data — injected for ALL variants (matching AM class behavior).
		$am_data = self::get_agents_manager_data( $variant );
		wp_add_inline_script(
			'agents-manager',
			'const agentsManagerData = ' . wp_json_encode(
				$am_data,
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);

		// CSS — disconnected variants skip CSS (matching AM class behavior).
		if ( ! str_contains( $variant, 'disconnected' ) ) {
			$css_url = 'https://' . AM_ASSET_BASE_PATH . "agents-manager-{$variant}.css";
			$rtl_url = 'https://' . AM_ASSET_BASE_PATH . "agents-manager-{$variant}.rtl.css";
			wp_enqueue_style(
				'agents-manager-style',
				is_rtl() ? $rtl_url : $css_url,
				array(),
				$version
			);
		}
	}

	/**
	 * Build the agentsManagerData object for the inline script.
	 *
	 * @param string $variant The loaded variant name.
	 * @return array The data array for JSON encoding.
	 */
	private static function get_agents_manager_data( string $variant ): array {
		/**
		 * Filter to register agent provider modules for the Agents Manager.
		 *
		 * @param array $providers Array of provider script module IDs.
		 */
		$agent_providers = apply_filters( 'agents_manager_agent_providers', array() );

		return array(
			'agentProviders'       => $agent_providers,
			'useUnifiedExperience' => false,
			'isDevMode'            => self::is_dev_mode(),
			'sectionName'          => $variant,
			'currentUser'          => self::get_current_user_data(),
			'site'                 => self::get_current_site(),
			'helpCenterUrl'        => 'https://wordpress.com/help?help-center=home',
		);
	}

	// ──────────────────────────────────────────────────
	// Asset manifest (Image Studio pattern)
	// ──────────────────────────────────────────────────

	/**
	 * Fetch and cache the remote asset manifest for a variant.
	 *
	 * @param string $variant The variant name.
	 * @return array|false The decoded asset data, or false on failure.
	 */
	private static function get_asset_data( string $variant ) {
		$transient_key = str_contains( $variant, 'disconnected' ) ? AM_ASSET_DC_TRANSIENT : AM_ASSET_TRANSIENT;
		$skip_cache    = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;

		if ( ! $skip_cache ) {
			$cached = get_transient( $transient_key );
			if ( false !== $cached ) {
				return $cached;
			}
		}

		$json_path = AM_ASSET_BASE_PATH . "agents-manager-{$variant}.asset.json";

		// Try local file first (available on WordPress.com).
		$data = self::get_asset_data_from_file( $json_path );

		// Fallback to remote fetch.
		if ( false === $data ) {
			$json_url = 'https://' . $json_path;
			$data     = self::get_asset_data_from_remote( $json_url );
		}

		if ( false === $data ) {
			return false;
		}

		if ( ! $skip_cache ) {
			set_transient( $transient_key, $data, HOUR_IN_SECONDS );
		}

		return $data;
	}

	/**
	 * Try to read the asset manifest from the local filesystem.
	 *
	 * On WordPress.com, widgets.wp.com assets are available at ABSPATH.
	 *
	 * @param string $relative_path The relative path to the JSON file.
	 * @return array|false The decoded asset data, or false if not available locally.
	 */
	private static function get_asset_data_from_file( string $relative_path ) {
		$local_path = ABSPATH . $relative_path;
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
	 * @param string $url The URL to fetch.
	 * @return array|false The decoded asset data, or false on failure.
	 */
	private static function get_asset_data_from_remote( string $url ) {
		$response = wp_safe_remote_get( $url );
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

	// ──────────────────────────────────────────────────
	// Provider registration (unchanged)
	// ──────────────────────────────────────────────────

	/**
	 * Register Jetpack AI as an Agents Manager provider.
	 *
	 * The AM frontend loads providers via dynamic import(url) which requires
	 * ES modules. Since webpack can't output ESM with WordPress script externals,
	 * we use a two-file approach:
	 *
	 * 1. jetpack-ai-provider.js — IIFE bundle that assigns exports to
	 *    window.__JetpackAIProvider. Enqueued as a regular <script>.
	 * 2. jetpack-ai-provider-esm.mjs — thin ESM wrapper that re-exports
	 *    from the global. This URL is registered with the AM.
	 *
	 * @param array $providers Existing provider URLs.
	 * @return array Updated providers.
	 */
	public static function register_provider( array $providers ): array {
		$asset_file = JETPACK__PLUGIN_DIR . '_inc/blocks/ai-sidebar/jetpack-ai-provider.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return $providers;
		}

		$asset   = require $asset_file;
		$version = $asset['version'] ?? filemtime( $asset_file );

		// Enqueue the IIFE bundle as a regular script. This sets
		// window.__JetpackAIProvider with the provider exports.
		wp_enqueue_script(
			'jetpack-ai-provider',
			plugins_url( '_inc/blocks/ai-sidebar/jetpack-ai-provider.js', JETPACK__PLUGIN_FILE ),
			$asset['dependencies'] ?? array(),
			$version,
			true
		);

		// Enqueue TitlePicker styles for the AM chat.
		wp_enqueue_style(
			'jetpack-ai-provider',
			plugins_url( '_inc/blocks/ai-sidebar/jetpack-ai-provider.css', JETPACK__PLUGIN_FILE ),
			array(),
			$version
		);

		// Register the ESM wrapper URL as the provider. The AM will
		// import(url) this module, which re-exports from the global.
		$esm_url     = plugins_url( '_inc/blocks/ai-sidebar/jetpack-ai-provider-esm.mjs', JETPACK__PLUGIN_FILE );
		$providers[] = $esm_url . '?ver=' . $version;

		return $providers;
	}

	// ──────────────────────────────────────────────────
	// Helper methods
	// ──────────────────────────────────────────────────

	/**
	 * Check if the current screen is a block editor.
	 *
	 * @return bool
	 */
	private static function is_block_editor(): bool {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$screen = get_current_screen();
		return $screen && $screen->is_block_editor();
	}

	/**
	 * Check whether AI features are available.
	 *
	 * - wpcom simple: always available.
	 * - Atomic/self-hosted: requires a connected owner with AI not disabled.
	 *
	 * @return bool
	 */
	private static function has_ai_features(): bool {
		$host = new Host();

		if ( $host->is_wpcom_simple() ) {
			return true;
		}

		return ( new Connection_Manager( 'jetpack' ) )->has_connected_owner()
			&& ! ( new Status() )->is_offline_mode()
			&& apply_filters( 'jetpack_ai_enabled', true );
	}

	/**
	 * Check if the current user's Jetpack connection is disconnected.
	 *
	 * Matches the AM class logic: only relevant on Atomic and Jetpack sites.
	 * On wpcom simple, users are never "disconnected" in this sense.
	 *
	 * @return bool
	 */
	private static function is_jetpack_disconnected(): bool {
		$user_id = get_current_user_id();
		$blog_id = get_current_blog_id();

		$is_jetpack_env = ( defined( 'IS_ATOMIC' ) && IS_ATOMIC )
			|| true === apply_filters( 'is_jetpack_site', false, $blog_id );

		if ( $is_jetpack_env ) {
			return ! ( new Connection_Manager( 'jetpack' ) )->is_user_connected( $user_id );
		}

		return false;
	}

	/**
	 * Check if the current request is from a development environment.
	 *
	 * Matches Agents_Manager::is_dev_mode() and Image Studio's is_dev_mode().
	 *
	 * IMPORTANT: Only use for feature gating, not authorization.
	 *
	 * @return bool
	 */
	private static function is_dev_mode(): bool {
		// Known local environments.
		$domain = wp_parse_url( get_site_url(), PHP_URL_HOST );
		if (
			$domain === 'localhost' ||
			'.jurassic.tube' === stristr( $domain, '.jurassic.tube' ) ||
			'.jurassic.ninja' === stristr( $domain, '.jurassic.ninja' )
		) {
			return true;
		}

		// Proxied A8C request via function.
		if ( function_exists( 'wpcom_is_proxied_request' ) && wpcom_is_proxied_request() ) {
			return true;
		}

		// Proxied A8C request via server variable or constant.
		if (
			( isset( $_SERVER['A8C_PROXIED_REQUEST'] ) && (bool) sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) ) ) ||
			( defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST )
		) {
			return true;
		}

		// Allowed Atomic client IDs.
		if ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST && defined( 'ATOMIC_CLIENT_ID' ) ) {
			switch ( ATOMIC_CLIENT_ID ) {
				case 1:
				case 2:
				case 3: // Pressable
				case 32:
				case 118: // Commerce garden client (ciab)
					return true;
			}
		}

		return false;
	}

	/**
	 * Determine the ISO 639 locale code for the current user.
	 *
	 * @return string The ISO 639 language code, defaulting to 'en'.
	 */
	private static function determine_iso_639_locale(): string {
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
	 * Get current user data for the agents manager.
	 *
	 * @return array|null User data array or null if not logged in.
	 */
	private static function get_current_user_data() {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return null;
		}

		$user_data = get_userdata( $user_id );
		if ( ! $user_data ) {
			return null;
		}

		$user_email = $user_data->user_email;

		// Use wpcom_get_avatar_url on Simple sites, fall back to get_avatar_url elsewhere.
		if ( function_exists( 'wpcom_get_avatar_url' ) ) {
			$result     = wpcom_get_avatar_url( $user_email, 64, '', true );
			$avatar_url = is_array( $result ) ? ( $result[0] ?? '' ) : '';
		} else {
			$avatar_url = get_avatar_url( $user_id );
		}

		return array(
			'ID'           => $user_id,
			'username'     => $user_data->user_login,
			'display_name' => $user_data->display_name,
			'avatar_URL'   => $avatar_url,
			'email'        => $user_email,
		);
	}

	/**
	 * Get current site data for the agents manager.
	 *
	 * Uses jetpack_options['id'] on Atomic sites for the wpcom blog ID.
	 *
	 * @return array Site data with ID and domain.
	 */
	private static function get_current_site(): array {
		$jetpack_options = get_option( 'jetpack_options' );
		if ( is_array( $jetpack_options ) && isset( $jetpack_options['id'] ) ) {
			$site_id = (int) $jetpack_options['id'];
		} else {
			$site_id = get_current_blog_id();
		}

		return array(
			'ID'     => $site_id,
			'domain' => wp_parse_url( home_url(), PHP_URL_HOST ),
		);
	}
}
