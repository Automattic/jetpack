<?php
/**
 * Stats pricing grid eligibility check.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin\Pricing_Grid;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;

/**
 * Determines whether to show the Stats pricing grid (for new sites without a plan).
 */
class Eligibility {
	/**
	 * Launch date for the pricing grid feature.
	 * The feature is only shown for sites not connected, or sites created on/after this date.
	 * This constant should be updated to the PR merge date.
	 *
	 * @var string
	 */
	const LAUNCH_DATE = '2026-08-07';

	/**
	 * Check if the site is new (qualifies for pricing grid).
	 *
	 * A site is considered "new" if:
	 * 1. It's not connected to WordPress.com, OR
	 * 2. It's connected but was created on/after the LAUNCH_DATE
	 *
	 * @return bool True if the site is new.
	 */
	public static function is_new_site() {
		$connection_manager = new Connection_Manager();

		// Unconnected sites always qualify.
		if ( ! $connection_manager->is_connected() ) {
			return true;
		}

		// Connected sites created before launch don't qualify.
		try {
			$assumed_creation_date = $connection_manager->get_assumed_site_creation_date();
			if ( $assumed_creation_date && strtotime( $assumed_creation_date ) >= strtotime( self::LAUNCH_DATE ) ) {
				return true;
			}
		} catch ( \Exception $e ) {
			// If we can't determine the creation date, assume it's not new.
			return false;
		}

		return false;
	}

	/**
	 * Check if the site has a Stats plan or product.
	 *
	 * Returns true if the site has:
	 * - A plan that supports 'stats-paid', OR
	 * - Any of the Stats products (free, yearly, monthly, etc.)
	 *
	 * @return bool True if the site has a Stats plan/product.
	 */
	public static function has_stats_plan() {
		// Check if plan supports stats-paid feature.
		if ( Current_Plan::supports( 'stats-paid' ) ) {
			return true;
		}

		// Check for Stats products.
		$products = Current_Plan::get_products();
		if ( ! is_array( $products ) ) {
			return false;
		}

		$stats_products = array(
			'jetpack_stats_free_yearly',
			'jetpack_stats_yearly',
			'jetpack_stats_monthly',
			'jetpack_stats_bi_yearly',
			'jetpack_stats_pwyw_yearly',
		);

		foreach ( $products as $product ) {
			if ( isset( $product['product_slug'] ) && in_array( $product['product_slug'], $stats_products, true ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if the pricing grid should be shown.
	 *
	 * The pricing grid is shown for new sites without a Stats plan.
	 *
	 * @return bool True if the pricing grid should be shown.
	 */
	public static function should_show_pricing_grid() {
		return self::is_new_site() && ! self::has_stats_plan();
	}
}
