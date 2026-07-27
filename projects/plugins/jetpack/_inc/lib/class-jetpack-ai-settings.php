<?php
/**
 * Jetpack AI feature settings.
 *
 * Central registry for the Jetpack AI master switch and per-feature toggles,
 * implementing the layered AI gate contract:
 *
 *   1. the host allows AI            — WP_AI_SUPPORT, via wp_supports_ai()
 *   2. the plan includes AI          — connection + plan checks (owned by each feature)
 *   3. AI is on for the whole site   — the jetpack_ai_enabled option (master switch)
 *   4. the feature's own switch      — per-feature options surfaced on the AI settings page
 *
 * Gates 1 and 3 are enforced by is_ai_enabled(), which plugin load points call
 * instead of applying `jetpack_ai_enabled` directly: the gates AND in after the
 * filter chain, so no later-priority callback can override them. The gates also
 * ride the filter itself for package consumers that cannot reference this class.
 * Gate 4 options are registered here and consulted at each feature's registration
 * or enqueue point — a disabled feature must stop loading, not just hide.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// All consumers require this canonical file once. A class_exists() guard here
// would be true on the first load because PHP registers unconditional classes
// before executing the file, returning before the self-initialization below.

/**
 * Registers the Jetpack AI master switch and per-feature toggle options, and
 * enforces the host (WP_AI_SUPPORT) and master gates on the AI filters.
 */
class Jetpack_AI_Settings {

	/**
	 * Master switch option. Named after the pre-existing `jetpack_ai_enabled`
	 * filter it backs, following the `reader_chat` option/filter precedent.
	 *
	 * @var string
	 */
	const MASTER_OPTION = 'jetpack_ai_enabled';

	/**
	 * Feature key => option name for every toggle on the AI settings page.
	 *
	 * `seo_enhancer` and `ai_search` reuse options owned by the SEO/Search
	 * surfaces; the rest are registered by this class.
	 *
	 * @var array
	 */
	const FEATURE_OPTIONS = array(
		'writing_assistant' => 'jetpack_ai_writing_assistant_enabled',
		'image_editor'      => 'jetpack_ai_image_editor_enabled',
		'feature_clip'      => 'jetpack_ai_feature_clip_enabled',
		'seo_enhancer'      => 'ai_seo_enhancer_enabled',
		'ai_search'         => 'jetpack_search_ai_answers_enabled',
	);

	/**
	 * Option defaults. The reused SEO/Search options keep their established
	 * opt-in defaults; the new per-feature toggles default to on.
	 *
	 * @var array
	 */
	const FEATURE_DEFAULTS = array(
		'writing_assistant' => true,
		'image_editor'      => true,
		'feature_clip'      => true,
		'seo_enhancer'      => false,
		'ai_search'         => false,
	);

	/**
	 * Feature keys whose options this class registers and syncs (the reused
	 * SEO/Search options are registered by their owning surfaces).
	 *
	 * @var array
	 */
	const OWNED_FEATURES = array( 'writing_assistant', 'image_editor', 'feature_clip' );

	/**
	 * Whether init() has already run.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook everything up. Must run on every request (front-end, editor, REST):
	 * the filters attached here gate feature loading.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'init', array( __CLASS__, 'register_settings' ) );
		add_filter( 'jetpack_sync_options_whitelist', array( __CLASS__, 'add_sync_options_whitelist' ) );

		// Plugin call sites use is_ai_enabled(), which applies gates 1 (host) and
		// 3 (master) after the filter chain. This in-chain registration stays for
		// the package consumers that cannot reference this plugin class
		// (external-media, my-jetpack): there the gates keep their pre-helper,
		// priority-10 behavior.
		add_filter( 'jetpack_ai_enabled', array( __CLASS__, 'apply_master_gates' ) );

		// AI surfaces that do not flow through jetpack_ai_enabled.
		add_filter( 'jetpack_search_ai_answers_enabled', array( __CLASS__, 'apply_master_gates' ) );
		add_filter( 'jetpack_ai_sidebar_enabled', array( __CLASS__, 'apply_master_gates' ) );
	}

	/**
	 * Register the master switch and the per-feature options this class owns.
	 *
	 * @return void
	 */
	public static function register_settings() {
		$show_in_rest = ! ( new Host() )->is_wpcom_simple();

		$options = array(
			self::MASTER_OPTION                        => __( 'Whether Jetpack AI is enabled on this site.', 'jetpack' ),
			self::FEATURE_OPTIONS['writing_assistant'] => __( 'Whether the Jetpack AI writing assistant is enabled.', 'jetpack' ),
			self::FEATURE_OPTIONS['image_editor']      => __( 'Whether the Jetpack AI image editor is enabled.', 'jetpack' ),
			self::FEATURE_OPTIONS['feature_clip']      => __( 'Whether Jetpack AI video clip generation is enabled.', 'jetpack' ),
		);

		foreach ( $options as $option => $description ) {
			register_setting(
				'general',
				$option,
				array(
					'type'              => 'boolean',
					'description'       => $description,
					'sanitize_callback' => 'rest_sanitize_boolean',
					'show_in_rest'      => $show_in_rest,
					'default'           => true,
				)
			);
		}
	}

	/**
	 * Add the AI settings options to Jetpack Sync's option whitelist.
	 *
	 * Atomic and self-hosted sites write these locally; syncing them lets
	 * WordPress.com (Calypso, the multi-site dashboard) read toggle state and
	 * is the prerequisite for mirroring the dashboard AI toggle later.
	 *
	 * @param array $options Option names allowed to sync.
	 * @return array Updated option names.
	 */
	public static function add_sync_options_whitelist( $options ) {
		$options   = (array) $options;
		$options[] = self::MASTER_OPTION;
		foreach ( self::OWNED_FEATURES as $feature ) {
			$options[] = self::FEATURE_OPTIONS[ $feature ];
		}
		return array_values( array_unique( $options ) );
	}

	/**
	 * Fold the host (gate 1) and master switch (gate 3) into an AI enabled filter.
	 *
	 * Restrictive-only on purpose: `jetpack_ai_enabled` is applied with different
	 * defaults at different call sites (Jetpack_AI_Helper passes false on plain
	 * self-hosted sites; the editor extension hub passes true), so this callback
	 * may only ever turn a yes into a no — returning the option value directly
	 * would flip self-hosted defaults to enabled.
	 *
	 * @param bool $enabled The value the call site computed so far.
	 * @return bool
	 */
	public static function apply_master_gates( $enabled ) {
		return (bool) $enabled && self::host_allows_ai() && self::is_master_enabled();
	}

	/**
	 * Whether Jetpack AI is enabled on this site, with the host (gate 1) and
	 * master switch (gate 3) as final, non-overridable checks.
	 *
	 * Runs the `jetpack_ai_enabled` filter with the call site's default — the
	 * chain may still enable or disable as before — then ANDs the host and
	 * master gates after it, so no late-priority callback can turn AI back on
	 * once either gate says no. Plugin call sites use this helper; the filter
	 * registration in init() stays for the package consumers that cannot
	 * reference this class.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $default The call site's computed default. Defaults differ
	 *                      between call sites — see apply_master_gates().
	 * @return bool
	 */
	public static function is_ai_enabled( $default = true ) {
		/**
		 * Filter whether the AI features are enabled in the Jetpack plugin.
		 *
		 * @since 11.8
		 *
		 * @param bool $default Are AI features enabled? The default varies by call site.
		 */
		$enabled = (bool) apply_filters( 'jetpack_ai_enabled', $default );

		return $enabled && self::host_allows_ai() && self::is_master_enabled();
	}

	/**
	 * Gate 1: whether the host allows AI at all.
	 *
	 * Honors core's wp_supports_ai() (backed by the WP_AI_SUPPORT constant) when
	 * available, falling back to the raw constant on WordPress versions that
	 * predate the function. This is a server-owner decision: when it is off, no
	 * AI settings should be shown and no upgrade should ever be offered.
	 *
	 * @return bool
	 */
	public static function host_allows_ai() {
		if ( function_exists( 'wp_supports_ai' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by function_exists() above.
			return (bool) wp_supports_ai();
		}

		if ( defined( 'WP_AI_SUPPORT' ) ) {
			return (bool) WP_AI_SUPPORT;
		}

		return true;
	}

	/**
	 * Gate 3: whether the site-wide AI master switch is on.
	 *
	 * @return bool
	 */
	public static function is_master_enabled() {
		return (bool) get_option( self::MASTER_OPTION, true );
	}

	/**
	 * Gate 4: whether an individual feature's switch is on.
	 *
	 * Checks only the feature's own toggle — callers remain responsible for the
	 * outer gates (most already consult the jetpack_ai_enabled filter, which
	 * carries host + master). Only the matching option is read: a code-level
	 * override belongs on the option itself, through core's own option filters.
	 *
	 * @param string $feature Feature key (see FEATURE_OPTIONS).
	 * @return bool False for unknown features.
	 */
	public static function is_feature_enabled( $feature ) {
		if ( ! isset( self::FEATURE_OPTIONS[ $feature ] ) ) {
			return false;
		}

		// WordPress.com Simple has no per-feature toggles. It keeps the existing
		// wp.com settings contract, so the features Jetpack owns stay on there and
		// the host and master gates remain the only controls. The reused SEO and
		// Search options are deliberately excluded: they have their own settings
		// surfaces on Simple and must keep honoring their stored values.
		if ( in_array( $feature, self::OWNED_FEATURES, true ) && ( new Host() )->is_wpcom_simple() ) {
			return true;
		}

		$option = self::FEATURE_OPTIONS[ $feature ];

		return (bool) get_option( $option, self::FEATURE_DEFAULTS[ $feature ] );
	}
}

// Self-initialize on load. The consuming AI extension files require this file
// directly (__DIR__-relative) because on WordPress.com Simple the plugin's
// extension files load through wpcom's own loader and load-jetpack.php never
// runs. This keeps filter registration identical in both bootstrap paths.
Jetpack_AI_Settings::init();
