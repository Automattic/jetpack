<?php
/**
 * Helper for the Jetpack Posts to Podcast feature.
 *
 * Phase A: gating delegates to Jetpack_AI_Helper::is_enabled() so the surface
 * is only available where Jetpack AI is already wired up. Real Jetpack AI
 * entitlement + credit checks live in Phase C.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
	require_once __DIR__ . '/class-jetpack-ai-helper.php';
}

/**
 * Class Jetpack_Posts_To_Podcast_Helper
 */
class Jetpack_Posts_To_Podcast_Helper {

	/**
	 * Whether the feature should be active for the current site.
	 *
	 * Phase A: same surface as Jetpack AI (WPCOM Simple + Atomic / WoA). When
	 * real entitlement lands in Phase C this delegates to a credit-aware check
	 * that also respects the per-site feature flag.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		if ( ! Jetpack_AI_Helper::is_enabled() ) {
			return false;
		}

		/**
		 * Filter to allow disabling the Jetpack Posts to Podcast feature on a per-site basis.
		 * Defaults to the same gating as Jetpack AI; flip this to false to hide the admin page
		 * during a staged rollout without disabling Jetpack AI itself.
		 *
		 * @since n.e.x.t
		 *
		 * @param bool $enabled Whether the feature is enabled. Default true.
		 */
		return (bool) apply_filters( 'jetpack_posts_to_podcast_is_enabled', true );
	}

	/**
	 * Resolve the configured voice presets that the wpcom endpoint accepts.
	 * Single source of truth for the admin UI's dropdown options.
	 *
	 * @return array<int, array{ id: string, label: string }>
	 */
	public static function get_voice_presets() {
		return array(
			array(
				'id'    => 'witty',
				'label' => __( 'Witty', 'jetpack' ),
			),
			array(
				'id'    => 'earnest',
				'label' => __( 'Earnest', 'jetpack' ),
			),
			array(
				'id'    => 'professional',
				'label' => __( 'Professional', 'jetpack' ),
			),
		);
	}

	/**
	 * Length presets surfaced to the admin UI.
	 *
	 * @return array<int, array{ id: string, label: string }>
	 */
	public static function get_length_presets() {
		return array(
			array(
				'id'    => 'short',
				'label' => __( 'Short (~3 min)', 'jetpack' ),
			),
			array(
				'id'    => 'medium',
				'label' => __( 'Medium (~7 min)', 'jetpack' ),
			),
			array(
				'id'    => 'long',
				'label' => __( 'Long (~12 min)', 'jetpack' ),
			),
		);
	}

	/**
	 * Window quick-picks surfaced to the admin UI. The relative-form `unit/n` shape
	 * matches the wpcom endpoint contract; the absolute `from/to` form is also accepted
	 * by the endpoint but is built from the date inputs in the UI.
	 *
	 * @return array<int, array{ id: string, label: string, unit: string, n: int }>
	 */
	public static function get_window_presets() {
		return array(
			array(
				'id'    => 'last-7-days',
				'label' => __( 'Last 7 days', 'jetpack' ),
				'unit'  => 'days',
				'n'     => 7,
			),
			array(
				'id'    => 'last-14-days',
				'label' => __( 'Last 14 days', 'jetpack' ),
				'unit'  => 'days',
				'n'     => 14,
			),
			array(
				'id'    => 'last-30-days',
				'label' => __( 'Last 30 days', 'jetpack' ),
				'unit'  => 'days',
				'n'     => 30,
			),
			array(
				'id'    => 'last-3-months',
				'label' => __( 'Last 3 months', 'jetpack' ),
				'unit'  => 'months',
				'n'     => 3,
			),
		);
	}
}
