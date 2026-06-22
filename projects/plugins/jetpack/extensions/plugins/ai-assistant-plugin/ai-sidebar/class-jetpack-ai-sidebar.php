<?php
/**
 * Jetpack AI Sidebar provider registration.
 *
 * Registers the Jetpack AI provider for Jetpack AI tools when the
 * WordPress.com AI Assistant setting allows the sidebar surface.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AiAssistantPlugin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

const AM_ASSET_BASE_PATH         = 'widgets.wp.com/agents-manager/';
const AI_SIDEBAR_ASSET_TRANSIENT = 'jetpack_ai_sidebar_asset';
const AI_SIDEBAR_JS_URL          = 'https://' . AM_ASSET_BASE_PATH . 'jetpack-ai-sidebar.min.js';
const AI_SIDEBAR_CSS_URL         = 'https://' . AM_ASSET_BASE_PATH . 'jetpack-ai-sidebar.css';
const AI_SIDEBAR_RTL_CSS_URL     = 'https://' . AM_ASSET_BASE_PATH . 'jetpack-ai-sidebar.rtl.css';
const AI_SIDEBAR_PROVIDER_URL    = 'https://' . AM_ASSET_BASE_PATH . 'jetpack-ai-sidebar.provider.mjs';
const AI_SIDEBAR_AGENT_ID        = 'wp-orchestrator';

/**
 * Handles registering the Jetpack AI provider in the block editor.
 */
class Jetpack_AI_Sidebar {

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		/**
		 * Filter to enable or disable the Jetpack AI sidebar feature.
		 *
		 * Runs after the WordPress.com AI Assistant setting gate, so hosts can
		 * disable this entrypoint but cannot bypass the site-level user setting.
		 *
		 * @param bool $enabled Whether the AI sidebar is enabled.
		 */
		if ( ! self::is_ai_assistant_setting_enabled() || ! apply_filters( 'jetpack_ai_sidebar_enabled', true ) ) {
			return;
		}

		// Register as Agents Manager provider. The filter fires inside
		// Agents_Manager::enqueue_scripts() — harmless if AM is not active.
		// Priority 20 so Jetpack loads AFTER Image Studio (priority 10).
		add_filter( 'agents_manager_agent_providers', array( __CLASS__, 'register_provider' ), 20 );

		add_filter( 'jetpack_ai_sidebar_agents_manager_data', array( __CLASS__, 'add_agents_manager_data' ), 10, 1 );

		// Allow jetpack-mu-wpcom's bundled Agents Manager to mount in the
		// post editor on WordPress.com and Atomic sites.
		add_filter( 'agents_manager_enabled_in_block_editor', array( __CLASS__, 'enable_agents_manager_in_post_editor' ) );

		// Enqueue the IIFE bundle in the preview post editor — it registers
		// Jetpack AI abilities via @wordpress/abilities, which Big Sky or AM
		// can discover regardless of which provider system is active.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_abilities_script' ), 201 );

		// Patch Jetpack AI Sidebar Preview data into agentsManagerData when AM
		// was enqueued by an external host (Big Sky on Atomic, etc.) and the
		// jetpack_ai_sidebar_agents_manager_data filter never fired. Priority
		// 250 runs after mu-wpcom (101).
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'maybe_patch_jetpack_ai_sidebar_preview_data' ), 250 );
	}

	// ──────────────────────────────────────────────────
	// Sidebar bundle loading
	// ──────────────────────────────────────────────────

	/**
	 * Enqueue the IIFE bundle that registers Jetpack AI abilities.
	 *
	 * This runs independently of AM/provider registration so preview abilities
	 * are available even when Big Sky standalone is the active UI.
	 *
	 * @return void
	 */
	public static function maybe_enqueue_abilities_script(): void {
		if ( ! self::should_expose_sidebar() ) {
			return;
		}

		// CIAB (next-admin) has its own AM setup — don't enqueue alongside it.
		if ( did_action( 'next_admin_init' ) ) {
			return;
		}

		// Guard against double-enqueue (e.g. hooked multiple times).
		if ( wp_script_is( 'jetpack-ai-provider' ) ) {
			return;
		}

		$asset_data = self::get_ai_sidebar_asset_data();
		if ( ! $asset_data ) {
			return;
		}

		$version      = $asset_data['version'] ?? false;
		$dependencies = $asset_data['dependencies'] ?? array();

		if ( self::is_dev_mode() ) {
			$version .= '-' . wp_rand();
		}

		wp_enqueue_script(
			'jetpack-ai-provider',
			AI_SIDEBAR_JS_URL,
			$dependencies,
			$version,
			true
		);

		wp_enqueue_style(
			'jetpack-ai-provider',
			is_rtl() ? AI_SIDEBAR_RTL_CSS_URL : AI_SIDEBAR_CSS_URL,
			array(),
			$version
		);
	}

	// ──────────────────────────────────────────────────
	// Asset manifest
	// ──────────────────────────────────────────────────

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
	// Provider registration
	// ──────────────────────────────────────────────────

	/**
	 * Register Jetpack AI as an Agents Manager provider.
	 *
	 * Appends the CDN-hosted ESM wrapper URL to the providers list so AM
	 * can dynamically import it. Asset enqueueing is handled separately by
	 * maybe_enqueue_abilities_script.
	 *
	 * @param array $providers Existing provider URLs.
	 * @return array Updated providers.
	 */
	public static function register_provider( array $providers ): array {
		// CIAB (next-admin) has AM natively — skip to avoid duplicate agents.
		if ( did_action( 'next_admin_init' ) ) {
			return $providers;
		}

		// The provider IIFE is only enqueued in the post editor. Avoid registering
		// the ESM wrapper on other block-editor surfaces, where AM may import it
		// before window.__JetpackAIProvider exists.
		if ( ! self::should_expose_sidebar() ) {
			return $providers;
		}

		// Don't register if the IIFE bundle cannot be loaded. The ESM wrapper
		// re-exports from window.__JetpackAIProvider at import time; if the
		// IIFE never ran, toolProvider is still a truthy Proxy and AM would
		// call getAbilities() on it and get undefined, breaking the merge.
		if ( ! self::get_ai_sidebar_asset_data() ) {
			return $providers;
		}

		// Register as AM provider via CDN-hosted ESM wrapper.
		// AM dynamically imports this module to merge tools, suggestions, and components.
		// No ?ver= needed — the wrapper re-exports from window.__JetpackAIProvider
		// at import time, so its behavior always matches the loaded IIFE bundle.
		$providers[] = AI_SIDEBAR_PROVIDER_URL;

		return $providers;
	}

	/**
	 * Fetch and cache the CDN asset manifest for the AI sidebar bundle.
	 *
	 * @return array|false The decoded asset data, or false on failure.
	 */
	private static function get_ai_sidebar_asset_data() {
		$skip_cache = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG;

		if ( ! $skip_cache ) {
			$cached = get_transient( AI_SIDEBAR_ASSET_TRANSIENT );
			if ( false !== $cached ) {
				return $cached;
			}
		}

		$json_path = AM_ASSET_BASE_PATH . 'jetpack-ai-sidebar.asset.json';

		// Try local file first (available on WordPress.com).
		$data = self::get_asset_data_from_file( $json_path );

		// Fallback to remote fetch.
		if ( false === $data ) {
			$data = self::get_asset_data_from_remote( 'https://' . $json_path );
		}

		if ( false === $data ) {
			// In dev mode (sandbox/JN), the server-side fetch to widgets.wp.com
			// won't route through the developer's sandbox. Return a minimal
			// fallback so the IIFE and provider registration still work —
			// the browser will load the real bundle from the sandbox.
			if ( self::is_dev_mode() ) {
				return array(
					'dependencies' => array( 'wp-data', 'wp-element', 'wp-i18n', 'wp-polyfill' ),
					'version'      => 'dev-' . time(),
				);
			}
			return false;
		}

		if ( ! $skip_cache ) {
			set_transient( AI_SIDEBAR_ASSET_TRANSIENT, $data, HOUR_IN_SECONDS );
		}

		return $data;
	}

	// ──────────────────────────────────────────────────
	// Helper methods
	// ──────────────────────────────────────────────────

	/**
	 * UI feature flag for AI Editorial Review.
	 *
	 * Server-side permission checks still gate execution. This site-side flag
	 * controls whether the sidebar exposes AI Editorial Review-specific UI.
	 *
	 * @return bool
	 */
	private static function is_ai_editorial_review_enabled(): bool {
		return (bool) apply_filters(
			'jetpack_ai_editorial_review_enabled',
			true
		);
	}

	/**
	 * UI feature flag for Optimize Title suggestions.
	 *
	 * Server-side permission checks still gate execution. This site-side flag
	 * controls whether the sidebar suggestion is exposed, following the
	 * internal rollout pattern used by Image Studio and Generate Feedback.
	 *
	 * @return bool
	 */
	private static function is_optimize_title_suggestion_enabled(): bool {
		return self::is_dev_mode();
	}

	/**
	 * UI feature flag for Generate Feedback.
	 *
	 * Server-side permission checks still gate execution. This site-side flag
	 * controls whether the Jetpack AI Sidebar exposes the Generate Feedback
	 * suggestion. It follows Image Studio's internal rollout pattern.
	 *
	 * @return bool
	 */
	private static function is_generate_feedback_enabled(): bool {
		return self::is_dev_mode();
	}

	/**
	 * Whether the WordPress.com AI Assistant site setting allows the sidebar surface.
	 *
	 * Self-hosted sites do not expose the AI Assistant setting, so the surface stays
	 * closed there. On WordPress.com, the Big Sky class plus option mirror the
	 * site-level AI Assistant toggle.
	 *
	 * @return bool
	 */
	private static function is_ai_assistant_setting_enabled(): bool {
		$host = new Host();
		if ( ! $host->is_wpcom_platform() || ! class_exists( 'Big_Sky' ) ) {
			return false;
		}

		$default = $host->is_wpcom_simple() ? '1' : '0';
		if ( ! get_option( 'big_sky_enable', $default ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Whether the sidebar surface should be exposed for this request: the AI Assistant
	 * setting allows it, we are in the post editor, and AI features are available.
	 *
	 * @return bool
	 */
	private static function should_expose_sidebar(): bool {
		return self::is_ai_assistant_setting_enabled() && self::is_post_editor() && self::has_ai_features();
	}

	/**
	 * Sidebar configuration consumed by the Agents Manager and Jetpack AI provider bundles.
	 *
	 * @return array Enabled state and feature availability.
	 */
	private static function get_sidebar_config(): array {
		$features = array(
			'aiEditorialReview'       => self::is_ai_editorial_review_enabled(),
			'generateFeedback'        => self::is_generate_feedback_enabled(),
			'blockTransformations'    => true,
			'optimizeTitleSuggestion' => self::is_optimize_title_suggestion_enabled(),
			'chatHistory'             => false,
			'supportGuides'           => false,
		);

		/**
		 * Filter the feature set exposed in Jetpack AI Sidebar Preview.
		 *
		 * @param array $features Associative array of preview feature flags.
		 */
		$filtered_features                   = apply_filters( 'jetpack_ai_sidebar_preview_features', $features );
		$features                            = is_array( $filtered_features ) ? array_merge( $features, $filtered_features ) : $features;
		$features['generateFeedback']        = self::is_generate_feedback_enabled();
		$features['optimizeTitleSuggestion'] = (bool) $features['optimizeTitleSuggestion'] && self::is_optimize_title_suggestion_enabled();

		return array(
			'enabled'  => self::is_ai_assistant_setting_enabled(),
			'features' => $features,
		);
	}

	/**
	 * Add Jetpack AI Sidebar-specific data to externally emitted Agents Manager payloads.
	 *
	 * @param mixed $data Data encoded into `agentsManagerData`.
	 * @return mixed Filtered data.
	 */
	public static function add_agents_manager_data( $data ) {
		if ( ! is_array( $data ) ) {
			return $data;
		}

		if ( ! self::should_expose_sidebar() ) {
			return $data;
		}

		// Set our fields in place, preserving the rest of $data (incl. agentProviders)
		// so the client-side gate can drop Jetpack AI Sidebar while keeping fallbacks
		// such as Big Sky.
		foreach ( self::get_sidebar_am_fields() as $key => $value ) {
			$data[ $key ] = $value;
		}
		return $data;
	}

	/**
	 * Fields Jetpack contributes to `agentsManagerData`. Single source shared by the
	 * data filter and the external-AM inline fallback so the two cannot drift.
	 *
	 * @return array
	 */
	private static function get_sidebar_am_fields(): array {
		return array(
			'agentId'                  => AI_SIDEBAR_AGENT_ID,
			'aiEditorialReviewEnabled' => self::is_ai_editorial_review_enabled(),
			'jetpackAiSidebar'         => self::get_sidebar_config(),
		);
	}

	/**
	 * Enable Agents Manager in the post editor when Jetpack AI Sidebar Preview is available.
	 *
	 * @param mixed $enabled Existing Agents Manager block-editor gate value.
	 * @return bool
	 */
	public static function enable_agents_manager_in_post_editor( $enabled ): bool {
		if ( $enabled ) {
			return true;
		}

		return self::should_expose_sidebar();
	}

	/**
	 * Inject Jetpack AI Sidebar Preview data into an externally enqueued AM bundle.
	 *
	 * The design-intended hook is jetpack_ai_sidebar_agents_manager_data, applied
	 * by jetpack-agents-manager Agents_Manager::enqueue_scripts(). On Atomic the bundled
	 * mu-wpcom (via wpcomsh) lags this PR, so the filter never fires and the
	 * client gets agentsManagerData without our fields. This `before` script runs
	 * after the upstream `before` that declares the const (added earlier) but
	 * before the AM bundle reads it, so the field is set when AM initialises.
	 * Gives Atomic parity with Jurassic Ninja without depending on a wpcomsh
	 * redeploy.
	 *
	 * Skipped on WordPress.com Simple — wpcom's data extension owns its
	 * WordPress.com-specific predicate there.
	 *
	 * @return void
	 */
	public static function maybe_patch_jetpack_ai_sidebar_preview_data(): void {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return;
		}
		if ( ! self::should_expose_sidebar() ) {
			return;
		}
		// 'registered' rather than 'enqueued': wp_add_inline_script attaches to any
		// registered handle and serializes correctly regardless of when the
		// enqueue lands in the dependency graph.
		if ( ! wp_script_is( 'agents-manager', 'registered' ) ) {
			return;
		}

		$assignments = '';
		foreach ( self::get_sidebar_am_fields() as $key => $value ) {
			$assignments .= ' agentsManagerData.' . $key . ' = '
				. wp_json_encode( $value, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';';
		}

		wp_add_inline_script(
			'agents-manager',
			'if ( typeof agentsManagerData === "object" && agentsManagerData !== null ) {' . $assignments . ' }',
			'before'
		);
	}

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
	 * Check if the current screen is the post block editor.
	 *
	 * @return bool
	 */
	private static function is_post_editor(): bool {
		if ( ! self::is_block_editor() ) {
			return false;
		}

		$screen = get_current_screen();
		return $screen instanceof \WP_Screen
			&& 'post' === $screen->base
			&& 'post' === $screen->post_type;
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
		if ( ! is_string( $domain ) ) {
			return false;
		}
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
}
