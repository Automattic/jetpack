<?php
/**
 * Jetpack AI Sidebar — Agents Manager integration and provider registration.
 *
 * Initializes the jetpack-agents-manager package so it loads the Agents
 * Manager bundle and emits its `agentsManagerData` payload, registers Jetpack
 * AI as an Agents Manager provider, and loads the Jetpack AI provider bundle
 * that exposes Jetpack AI abilities in the block editor.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AiAssistantPlugin;

use Automattic\Jetpack\Agents_Manager\Agents_Manager;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

const AM_ASSET_BASE_PATH                  = 'widgets.wp.com/agents-manager/';
const AI_SIDEBAR_ASSET_TRANSIENT          = 'jetpack_ai_sidebar_asset';
const AI_SIDEBAR_JS_URL                   = 'https://' . AM_ASSET_BASE_PATH . 'jetpack-ai-sidebar.min.js';
const AI_SIDEBAR_CSS_URL                  = 'https://' . AM_ASSET_BASE_PATH . 'jetpack-ai-sidebar.css';
const AI_SIDEBAR_RTL_CSS_URL              = 'https://' . AM_ASSET_BASE_PATH . 'jetpack-ai-sidebar.rtl.css';
const AI_SIDEBAR_PROVIDER_URL             = 'https://' . AM_ASSET_BASE_PATH . 'jetpack-ai-sidebar.provider.mjs';
const AI_SIDEBAR_AGENT_ID                 = 'wp-orchestrator';
const AI_SIDEBAR_TOOLBAR_BUTTON_EXTENSION = 'ai-sidebar-toolbar-button';

/**
 * Initializes the Agents Manager package and registers the Jetpack AI
 * provider in the block editor.
 */
class Jetpack_AI_Sidebar {

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	public static function init(): void {
		// Gate the whole sidebar entrypoint on the preview surface, which is
		// itself overridable via the jetpack_ai_sidebar_enabled filter.
		if ( ! self::is_jetpack_ai_sidebar_preview_enabled() ) {
			return;
		}

		// Initialize the Agents Manager package so it owns loading the Agents
		// Manager bundle and emitting the `agentsManagerData` payload. The call
		// is idempotent: on WordPress.com and Atomic, jetpack-mu-wpcom may have
		// already initialized it, in which case this is a no-op.
		Agents_Manager::init();

		// Register as Agents Manager provider. The filter fires inside
		// Agents_Manager::enqueue_scripts(). Priority 20 so Jetpack loads
		// AFTER Image Studio (priority 10).
		add_filter( 'agents_manager_agent_providers', array( __CLASS__, 'register_provider' ), 20 );

		add_filter( 'jetpack_ai_sidebar_agents_manager_data', array( __CLASS__, 'add_agents_manager_data' ), 10, 1 );

		// Ask the Agents Manager package to mount in the post editor on Jetpack
		// AI Sidebar Preview surfaces.
		add_filter( 'agents_manager_enabled_in_block_editor', array( __CLASS__, 'enable_agents_manager_in_post_editor' ) );

		// Enqueue the IIFE bundle in the preview post editor — it registers
		// Jetpack AI abilities via @wordpress/abilities, which Big Sky or the
		// Agents Manager can discover regardless of which provider system is active.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_abilities_script' ), 201 );

		// Patch Jetpack AI Sidebar Preview data into agentsManagerData when the
		// Agents Manager bundle was enqueued by an external host (Big Sky on
		// Atomic, etc.) and the jetpack_ai_sidebar_agents_manager_data filter
		// never fired. Priority 250 runs after both jetpack-mu-wpcom and the
		// Agents Manager package enqueue (priority 101).
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'maybe_patch_jetpack_ai_sidebar_preview_data' ), 250 );

		// Let editor JS know when the Jetpack AI Sidebar toolbar button replaces the legacy AI toolbar.
		add_action( 'jetpack_register_gutenberg_extensions', array( __CLASS__, 'register_toolbar_button_extension' ), 99 );
	}

	// ──────────────────────────────────────────────────
	// Jetpack AI provider bundle
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
	// Asset manifest (Image Studio pattern)
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
			// The manifest is unavailable from both the local file and the CDN
			// — for example when the server cannot reach widgets.wp.com. Skip
			// rather than enqueue a provider whose bundle the browser may also
			// be unable to load, which would break the Agents Manager merge.
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
	 * controls whether the sidebar suggestion is exposed, while keeping a
	 * feature-specific filter available as a kill switch.
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
	 * UI feature flag for the Generate Feedback suggestion.
	 *
	 * Exposed only in internal testing environments while the feature is in development.
	 *
	 * @return bool
	 */
	private static function is_generate_feedback_enabled(): bool {
		return jetpack_is_internal_testing_environment();
	}

	/**
	 * UI feature flag for the Optimize Title suggestion.
	 *
	 * Exposed only in internal testing environments while the feature is in development.
	 *
	 * @return bool
	 */
	private static function is_optimize_title_suggestion_enabled(): bool {
		return jetpack_is_internal_testing_environment();
	}

	/**
	 * UI feature flag for the SEO Enhancer suggestions (SEO title and meta description).
	 *
	 * Exposed only in internal testing environments while the feature is in development,
	 * and only where the suggestions can actually be used: the SEO Enhancer is not
	 * killed via its filter, the site's plan includes the Jetpack SEO feature (the
	 * suggestions write to the plan-gated SEO title and meta description fields), and
	 * SEO tools are usable on the site. Kept independent of the Optimize Title flag:
	 * SEO suggestions target the SEO meta fields, not the visible post title.
	 *
	 * The user-facing ai_seo_enhancer_enabled *option* is deliberately not consulted —
	 * it only governs automatic generation on publish, while these suggestions are
	 * user-initiated.
	 *
	 * @return bool
	 */
	private static function is_seo_suggestions_enabled(): bool {
		return jetpack_is_internal_testing_environment()
			&& (bool) apply_filters( 'ai_seo_enhancer_enabled', true )
			&& self::has_seo_feature()
			&& self::is_seo_tools_usable();
	}

	/**
	 * Whether the site's plan includes the Jetpack SEO feature.
	 *
	 * Same predicate the SEO editor panel uses to decide between the SEO fields and
	 * the "Optimize SEO" upgrade nudge: extensions/plugins/seo/seo.php registers
	 * availability via Jetpack_Gutenberg::set_availability_for_plan( 'advanced-seo' ),
	 * which resolves through Current_Plan::supports(). On WordPress.com Simple and
	 * Atomic this delegates to wpcom_site_has_feature( 'advanced-seo' ) — Business
	 * and higher plans; on self-hosted sites every plan includes the feature.
	 *
	 * @return bool
	 */
	private static function has_seo_feature(): bool {
		return Current_Plan::supports( 'advanced-seo' );
	}

	/**
	 * Whether Jetpack SEO tools are usable on this site: SEO is not disabled via the
	 * jetpack_disable_seo_tools filter — which the seo-tools module enables itself
	 * when a conflicting SEO plugin (Yoast, AIOSEO, Rank Math, …) owns the site's
	 * SEO — and the seo-tools module is active, since the module registers the SEO
	 * meta fields the suggestions write to. On WordPress.com Simple the module always
	 * reports active, so there this reduces to the filter check.
	 *
	 * @return bool
	 */
	private static function is_seo_tools_usable(): bool {
		/** This filter is documented in modules/seo-tools/class-jetpack-seo-utils.php */
		return ! apply_filters( 'jetpack_disable_seo_tools', false )
			&& ( new Modules() )->is_active( 'seo-tools' );
	}

	/**
	 * UI feature flag for the public Jetpack AI Sidebar Preview surface.
	 *
	 * Defaults to enabled only on WordPress.com platform sites (Simple or WoA)
	 * that have the Big Sky plugin present and enabled. Big Sky defaults on for
	 * Simple sites and off on WoA/Atomic. The jetpack_ai_sidebar_enabled filter
	 * is a host-level override of that default, respected by init() and every
	 * sidebar surface that gates on this method.
	 *
	 * @return bool
	 */
	private static function is_jetpack_ai_sidebar_preview_enabled(): bool {
		$host = new Host();

		$enabled = false;
		if ( $host->is_wpcom_platform() && class_exists( 'Big_Sky' ) ) {
			$default = $host->is_wpcom_simple() ? '1' : '0';
			$enabled = (bool) get_option( 'big_sky_enable', $default );
		}

		/**
		 * Filter to enable or disable the Jetpack AI sidebar feature.
		 *
		 * Defaults to true only on WordPress.com platform sites with Big Sky
		 * present and enabled. Acts as a host-level override that can force the
		 * sidebar on (e.g. for local development) or off, and is respected by
		 * init() and every sidebar surface.
		 *
		 * @param bool $enabled Whether the Jetpack AI sidebar is enabled.
		 */
		return (bool) apply_filters( 'jetpack_ai_sidebar_enabled', $enabled );
	}

	/**
	 * Whether the sidebar surface should be exposed for this request: the sidebar
	 * gate is open, we are in the post editor, and AI features are available.
	 *
	 * @return bool
	 */
	private static function should_expose_sidebar(): bool {
		return self::is_jetpack_ai_sidebar_preview_enabled() && self::is_post_editor() && self::has_ai_features();
	}

	/**
	 * Preview configuration consumed by the Agents Manager and Jetpack AI provider bundles.
	 *
	 * @return array Preview mode and feature availability.
	 */
	private static function get_jetpack_ai_sidebar_preview_config(): array {
		$features = array(
			'aiEditorialReview'       => self::is_ai_editorial_review_enabled(),
			'generateFeedback'        => self::is_generate_feedback_enabled(),
			'blockTransformations'    => true,
			'blockToolbarButton'      => false,
			'optimizeTitleSuggestion' => self::is_optimize_title_suggestion_enabled(),
			'seoSuggestions'          => self::is_seo_suggestions_enabled(),
			'chatHistory'             => false,
			'supportGuides'           => false,
		);

		/**
		 * Filter the feature set exposed in Jetpack AI Sidebar Preview.
		 *
		 * @param array $features Associative array of preview feature flags.
		 */
		$filtered_features = apply_filters( 'jetpack_ai_sidebar_preview_features', $features );
		$features          = is_array( $filtered_features ) ? array_merge( $features, $filtered_features ) : $features;

		// Re-assert the testing-environment gates so the generic features filter cannot
		// expose in-development suggestions outside internal testing environments.
		$features['generateFeedback']        = self::is_generate_feedback_enabled();
		$features['optimizeTitleSuggestion'] = (bool) $features['optimizeTitleSuggestion'] && self::is_optimize_title_suggestion_enabled();
		$features['seoSuggestions']          = (bool) $features['seoSuggestions'] && self::is_seo_suggestions_enabled();

		return array(
			'enabled'  => self::is_jetpack_ai_sidebar_preview_enabled(),
			'features' => $features,
		);
	}

	/**
	 * Whether the Jetpack AI Sidebar toolbar button replaces the legacy AI toolbar.
	 *
	 * @return bool
	 */
	public static function is_toolbar_button_enabled(): bool {
		$preview_config = self::get_jetpack_ai_sidebar_preview_config();

		return self::should_expose_sidebar()
			&& true === ( $preview_config['features']['blockToolbarButton'] ?? false );
	}

	/**
	 * Register the Jetpack AI Sidebar toolbar button feature.
	 *
	 * @return void
	 */
	public static function register_toolbar_button_extension(): void {
		if ( ! self::is_toolbar_button_enabled() ) {
			\Jetpack_Gutenberg::set_extension_unavailable(
				AI_SIDEBAR_TOOLBAR_BUTTON_EXTENSION,
				'jetpack_ai_sidebar_feature_disabled'
			);
			return;
		}

		\Jetpack_Gutenberg::set_extension_available( AI_SIDEBAR_TOOLBAR_BUTTON_EXTENSION );
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

		// Set our fields in place, leaving the rest of $data (including agentProviders)
		// untouched so the client-side gate can drop Jetpack AI Sidebar while keeping
		// fallbacks such as the Big Sky provider. Hosts that need intentional overrides
		// should use the AI Editorial Review and preview filters.
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
		$config = self::get_jetpack_ai_sidebar_preview_config();

		return array(
			'agentId'          => AI_SIDEBAR_AGENT_ID,
			'jetpackAiSidebar' => $config,
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
	 * Skipped on WordPress.com Simple — wpcom's data extension owns the predicate
	 * there, including any WordPress.com-specific kill-switch override.
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

		// Build the assignments from the same field source as the data filter so the
		// two emit paths cannot drift. agentProviders is left untouched so client-side
		// gating can fall back to other providers (such as Big Sky) when Jetpack AI
		// Sidebar is unavailable.
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
}
