<?php
/**
 * AI Answers feature — behavior meta and enabled flag.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

/**
 * Registers behavior meta on the Gutenberg Guidelines CPT and exposes the
 * jetpack_search_ai_answers_enabled option.
 */
class AI_Answers {
	const BEHAVIOR_META_KEY   = '_guideline_block_jetpack_search-ai-summary';
	const BEHAVIOR_OPTION_KEY = 'jetpack_search_ai_behavior_instructions';
	const AI_MODULE           = 'ai';
	const AI_MASTER_OPTION    = 'jetpack_ai_enabled';
	const ENABLED_OPTION      = 'jetpack_search_ai_answers_enabled';

	/**
	 * Hook up meta/setting registration.
	 */
	public function init() {
		add_action( 'rest_api_init', array( $this, 'register_behavior_meta' ) );
	}

	/**
	 * Register the behavior instructions storage for the REST API.
	 *
	 * When the Gutenberg Guidelines CPT is present, registers the block-specific
	 * meta key on it. Otherwise registers a site option exposed via /wp/v2/settings.
	 */
	public function register_behavior_meta() {
		if ( post_type_exists( 'wp_guideline' ) ) {
			register_post_meta(
				'wp_guideline',
				self::BEHAVIOR_META_KEY,
				array(
					'single'            => true,
					'type'              => 'string',
					'show_in_rest'      => true,
					'default'           => '',
					'sanitize_callback' => 'sanitize_textarea_field',
					'auth_callback'     => function () {
						return current_user_can( 'manage_options' );
					},
				)
			);
			return;
		}

		register_setting(
			'options',
			self::BEHAVIOR_OPTION_KEY,
			array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => 'sanitize_textarea_field',
				'show_in_rest'      => true,
			)
		);
	}

	/**
	 * Retrieve the behavior instructions.
	 *
	 * Reads from the Gutenberg Guidelines CPT when available, otherwise falls
	 * back to the site option.
	 *
	 * @return string Behavior instructions, or empty string if none saved.
	 */
	public static function get_behavior_instructions() {
		if ( post_type_exists( 'wp_guideline' ) ) {
			$posts = get_posts(
				array(
					'post_type'      => 'wp_guideline',
					'posts_per_page' => 1,
					'post_status'    => 'publish',
				)
			);
			if ( ! empty( $posts ) ) {
				$guidelines = get_post_meta( $posts[0]->ID, self::BEHAVIOR_META_KEY, true );
				return is_string( $guidelines ) ? $guidelines : '';
			}
		}
		return (string) get_option( self::BEHAVIOR_OPTION_KEY, '' );
	}

	/**
	 * Whether the site-wide AI gates currently allow AI Answers — the reporting
	 * predicate.
	 *
	 * The Jetpack plugin enforces the AI master switch and the host's AI opt-out
	 * through the `jetpack_search_ai_answers_enabled` filter; probing the chain
	 * with `true` reads that verdict without depending on the plugin. Sites with
	 * no gate registered (e.g. standalone Search) report on.
	 *
	 * @since 8.0.0
	 *
	 * @return bool
	 */
	public static function is_master_enabled() {
		// Where enforcement hasn't rolled out, report ungated so no master-off
		// UI shows before the switch itself does. Remove at public launch.
		if ( ! self::is_master_rollout_active() ) {
			return true;
		}

		// ANDed with the computed predicate so reporting can never be more
		// permissive than enforcement — e.g. a Simple request where the plugin's
		// filter never registered, or plugin/package version skew.
		return (bool) apply_filters( 'jetpack_search_ai_answers_enabled', true ) && self::should_enforce_master();
	}

	/**
	 * Whether master enforcement has rolled out here — mirrors the Jetpack
	 * plugin's rollout scoping: Simple keeps its option contract; elsewhere
	 * the rollout is internal-only for now.
	 *
	 * @return bool
	 */
	private static function is_master_rollout_active() {
		if ( ( new Host() )->is_wpcom_simple() ) {
			return true;
		}

		return function_exists( 'jetpack_is_internal_testing_environment' ) && jetpack_is_internal_testing_environment();
	}

	/**
	 * Whether this package should enforce the master switch — the rollout-scoped
	 * enforcement predicate behind the block gate.
	 *
	 * Mirrors `Jetpack_AI_Settings::is_master_enabled()` in the Jetpack plugin —
	 * the source of truth, unreferenceable from standalone installs. Computed
	 * rather than filtered so no plugin can flip a gate that must hold.
	 *
	 * @since 8.0.0
	 *
	 * @return bool True when Jetpack AI is on, or when the site has no master switch.
	 */
	public static function should_enforce_master() {
		if ( ! self::is_master_rollout_active() ) {
			return true;
		}

		if ( ( new Host() )->is_wpcom_simple() ) {
			return (bool) get_option( self::AI_MASTER_OPTION, true );
		}

		$modules = new Modules();

		// Without the Jetpack plugin — a standalone Jetpack Search install — the
		// `ai` module is not registered, so is_active() would report false for a
		// master switch that was never installed. Don't gate those sites.
		if ( ! in_array( self::AI_MODULE, $modules->get_available(), true ) ) {
			return true;
		}

		// Availability is already proven above, so skip is_active()'s repeat intersect.
		return $modules->is_active( self::AI_MODULE, false );
	}

	/**
	 * The stored AI Answers choice, ignoring every gate.
	 *
	 * The dashboard shows this while the master switch is off, so a saved choice
	 * isn't misreported back to the user as off.
	 *
	 * @since 8.0.0
	 *
	 * @return bool
	 */
	public static function is_saved_on() {
		return (bool) get_option( self::ENABLED_OPTION, false );
	}

	/**
	 * Whether AI Answers is enabled for the current site.
	 *
	 * Paid-plan eligibility is applied after the filter chain alongside the
	 * master gate so neither can be filtered back on.
	 */
	public static function is_enabled() {
		$enabled = (bool) apply_filters( 'jetpack_search_ai_answers_enabled', self::is_saved_on() );

		// The master gate is applied after the filter chain so it cannot be
		// filtered back on, matching `Jetpack_AI_Settings::is_ai_enabled()`.
		return $enabled && self::should_enforce_master() && Search_Blocks::supports_paid_search();
	}

	/**
	 * Whether the host allows AI at all — core's wp_supports_ai(), falling back
	 * to the WP_AI_SUPPORT constant on WordPress versions that predate it.
	 * Mirrors the Jetpack plugin's Jetpack_AI_Settings::host_allows_ai().
	 *
	 * @since 8.0.0
	 *
	 * @return bool
	 */
	public static function host_allows_ai() {
		if ( function_exists( 'wp_supports_ai' ) ) {
			return wp_supports_ai();
		}

		// WordPress versions predating wp_supports_ai() only have the constant.
		return ! Constants::is_defined( 'WP_AI_SUPPORT' ) || (bool) Constants::get_constant( 'WP_AI_SUPPORT' );
	}
}
