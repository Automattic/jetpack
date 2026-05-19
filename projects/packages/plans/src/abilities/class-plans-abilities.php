<?php
/**
 * Jetpack Plans Abilities Registration
 *
 * Registers Jetpack Plans abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-plans
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Plans\Abilities;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Registers Jetpack Plans abilities with the WordPress Abilities API.
 *
 * Exposes a single read-only ability so AI agents can inspect the site's
 * active Jetpack plan. Listing the plans the site could move to lives in the
 * My Jetpack package (jetpack-my-jetpack/list-plans), sourced from the Jetpack
 * product registry that powers the pricing UI.
 */
class Plans_Abilities extends Registrar {

	/**
	 * Category slug for all Plans abilities.
	 *
	 * Shared with the rest of the Jetpack plugin's abilities (modules, etc.)
	 * so everything groups under a single "jetpack" category in the
	 * Abilities API surface.
	 */
	const CATEGORY_SLUG = 'jetpack';

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack',
			'description' => __( 'Abilities exposed by the Jetpack plugin.', 'jetpack-plans' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-plans/get-current-plan' => self::spec_get_current_plan(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-plans/get-current-plan.
	 */
	private static function spec_get_current_plan(): array {
		return array(
			'label'               => __( 'Get the site\'s current Jetpack plan', 'jetpack-plans' ),
			'description'         => __( 'Return the active Jetpack plan as { slug, name, class, product_id, expires_at, features, supports }. slug is the canonical product slug (e.g. "jetpack_free", "jetpack_security_t1_yearly"); class is the coarse tier (free/personal/premium/security/business/complete); features is the active-features list reported by WordPress.com for the site; supports is the full list of feature flags the plan unlocks (used by Current_Plan::supports()). expires_at is the ISO-8601 expiry timestamp, or null when the plan has no expiry (e.g. free). Read-only, idempotent, zero arguments. Pair with jetpack-my-jetpack/list-plans to see the plans the site could move to.', 'jetpack-plans' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'slug'       => array( 'type' => 'string' ),
					'name'       => array( 'type' => array( 'string', 'null' ) ),
					'class'      => array( 'type' => 'string' ),
					'product_id' => array( 'type' => array( 'integer', 'null' ) ),
					'expires_at' => array( 'type' => array( 'string', 'null' ) ),
					'features'   => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
					'supports'   => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_current_plan' ),
			'permission_callback' => array( __CLASS__, 'can_view_plans' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Coarse permission gate for the Plans ability. The plan surface mixes
	 * billing-relevant detail (price, expiry) and admin-targeted data, so we
	 * gate on `manage_options` — the safe default for site-wide settings.
	 *
	 * @return bool
	 */
	public static function can_view_plans(): bool {
		return current_user_can( 'manage_options' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: get-current-plan.
	 *
	 * Reshapes the verbose array returned by {@see Current_Plan::get()} into a
	 * compact, high-signal shape: identity (slug/name/class/product_id), expiry,
	 * the active-features list, and the supports flags consumed by
	 * `Current_Plan::supports()`. Raw `features.available` is intentionally
	 * dropped — it explodes context for callers that just want to know what the
	 * site can do today.
	 *
	 * @param array|null $input Ability input (no parameters accepted).
	 * @return array
	 */
	public static function get_current_plan( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		$plan = static::fetch_current_plan();

		$features_active = array();
		if ( isset( $plan['features']['active'] ) && is_array( $plan['features']['active'] ) ) {
			$features_active = array_values( array_filter( $plan['features']['active'], 'is_string' ) );
		}

		$supports = array();
		if ( isset( $plan['supports'] ) && is_array( $plan['supports'] ) ) {
			$supports = array_values( array_filter( $plan['supports'], 'is_string' ) );
		}

		return array(
			'slug'       => isset( $plan['product_slug'] ) ? (string) $plan['product_slug'] : 'jetpack_free',
			'name'       => isset( $plan['product_name_short'] ) ? (string) $plan['product_name_short'] : null,
			'class'      => isset( $plan['class'] ) ? (string) $plan['class'] : 'free',
			'product_id' => isset( $plan['product_id'] ) ? (int) $plan['product_id'] : null,
			'expires_at' => self::normalize_expiry( $plan ),
			'features'   => $features_active,
			'supports'   => $supports,
		);
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Fetch the active plan array. Wraps {@see Current_Plan::get()} so tests
	 * can stub it without round-tripping through the option cache.
	 *
	 * @return array
	 */
	protected static function fetch_current_plan(): array {
		$plan = Current_Plan::get();
		return is_array( $plan ) ? $plan : array();
	}

	/**
	 * Normalize the plan's expiry timestamp.
	 *
	 * The wpcom payload stores expiry either as `expiry` (ISO-8601) or
	 * `expires` (rare); free / non-expiring plans omit both. Returns `null`
	 * for the no-expiry case so callers see an explicit signal.
	 *
	 * @param array $plan Active plan array.
	 * @return string|null
	 */
	private static function normalize_expiry( array $plan ): ?string {
		foreach ( array( 'expiry', 'expires' ) as $key ) {
			if ( isset( $plan[ $key ] ) && is_string( $plan[ $key ] ) && '' !== $plan[ $key ] ) {
				return $plan[ $key ];
			}
		}
		return null;
	}
}
