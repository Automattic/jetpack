<?php
/**
 * Commerce plan detection shared across the WordPress.com admin sidebars.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Current_Plan;

/**
 * Single source of truth for "is the current site on a Commerce plan", used by both admin
 * sidebars (the nav-unified Atomic_Admin_Menu and the classic wp-admin jetpack-mu-wpcom menu)
 * so their relabeling stays in sync.
 */
class Store_Plan {

	/**
	 * Whether the current site is on a Commerce plan, including the Commerce trial.
	 *
	 * Legacy Woo Express plans (wooexpress-*) are intentionally excluded: those users chose a
	 * Woo-branded product, so they keep the "WooCommerce" label.
	 *
	 * @return bool
	 */
	public static function is_commerce_plan() {
		if ( ! function_exists( 'wpcom_get_site_purchases' ) ) {
			return false;
		}

		return self::purchases_include_commerce_plan( wpcom_get_site_purchases() );
	}

	/**
	 * Whether the given purchases include a Commerce plan.
	 *
	 * Split out so callers that fetch purchases their own way (e.g. an injectable seam in
	 * tests) can reuse the same matching logic.
	 *
	 * @param array $purchases Purchase objects, each with an optional product_slug property.
	 * @return bool
	 */
	public static function purchases_include_commerce_plan( $purchases ) {
		$commerce_slugs = self::get_commerce_plan_slugs();
		foreach ( (array) $purchases as $purchase ) {
			if ( isset( $purchase->product_slug ) && in_array( $purchase->product_slug, $commerce_slugs, true ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Commerce plan slugs (Commerce and the Commerce trial).
	 *
	 * Derived from the canonical plan list so new ecommerce-* variants are picked up
	 * automatically. The "business" group also holds Woo Express and other business plans,
	 * so it's narrowed to the ecommerce- family (ecommerce-bundle* plus
	 * ecommerce-trial-bundle-monthly); Woo Express (wooexpress-*) is excluded.
	 *
	 * @return string[]
	 */
	public static function get_commerce_plan_slugs() {
		return array_values(
			array_filter(
				Current_Plan::PLAN_DATA['business']['plans'],
				static function ( $slug ) {
					return str_starts_with( $slug, 'ecommerce-' );
				}
			)
		);
	}
}
