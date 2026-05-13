<?php
/**
 * Test-only subclass of Plans_Abilities that overrides the protected seams
 * (catalog fetch, single-plan lookup, current-plan fetch, site-suffix resolver)
 * so the success path can be exercised without a remote WordPress.com call
 * or a real Jetpack site connection.
 *
 * @package automattic/jetpack-plans
 */

use Automattic\Jetpack\Plans\Abilities\Plans_Abilities;

/**
 * Test-only subclass overriding Plans_Abilities's protected seams.
 *
 * Each seam reads from a static fixture so tests can drive the abilities
 * deterministically from inside the test method.
 */
class Plans_Abilities_Test_Stub extends Plans_Abilities {

	/**
	 * Seeded catalog returned by fetch_catalog() / used by lookup_plan().
	 *
	 * @var mixed
	 */
	public static $catalog = null;

	/**
	 * Seeded site suffix returned by resolve_site_suffix().
	 *
	 * @var string
	 */
	public static $site_suffix = 'example.test';

	/**
	 * Seeded active plan returned by fetch_current_plan(); null falls through
	 * to the parent implementation (the option-backed lookup).
	 *
	 * @var array|null
	 */
	public static $current_plan = null;

	/**
	 * Reset all fixtures to deterministic defaults.
	 *
	 * @param mixed      $catalog       Seeded catalog.
	 * @param string     $site_suffix   Seeded site suffix.
	 * @param array|null $current_plan  Seeded active plan (null => fall through to parent).
	 */
	public static function reset( $catalog = null, string $site_suffix = 'example.test', $current_plan = null ): void {
		self::$catalog      = $catalog;
		self::$site_suffix  = $site_suffix;
		self::$current_plan = $current_plan;
	}

	protected static function fetch_catalog() {
		return self::$catalog;
	}

	protected static function lookup_plan( string $plan_slug ) {
		$catalog = self::$catalog;
		if ( ! is_array( $catalog ) && ! ( $catalog instanceof \Traversable ) ) {
			return null;
		}
		foreach ( $catalog as $plan ) {
			$slug = is_array( $plan ) ? ( $plan['product_slug'] ?? null ) : ( $plan->product_slug ?? null );
			if ( $slug === $plan_slug ) {
				return $plan;
			}
		}
		return null;
	}

	protected static function fetch_current_plan(): array {
		if ( is_array( self::$current_plan ) ) {
			return self::$current_plan;
		}
		return parent::fetch_current_plan();
	}

	protected static function resolve_site_suffix(): string {
		return self::$site_suffix;
	}
}
