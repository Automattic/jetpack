<?php
/**
 * Stats pricing grid eligibility check.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin\Pricing_Grid;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Stats_Admin\Notices;
use Automattic\Jetpack\Status\Host;

/**
 * Determines whether to show the Stats pricing grid (for new sites without a plan).
 */
class Eligibility {
	/**
	 * Launch date for the pricing grid feature.
	 * The feature is only shown for sites not connected, or sites whose first
	 * connection happened on/after this date.
	 * This constant should be updated to the PR merge date.
	 *
	 * @var string
	 */
	const LAUNCH_DATE = '2000-08-07';

	/**
	 * Option recording when the site first connected to WordPress.com.
	 * Set by record_connection_time() on the jetpack_site_registered action,
	 * so it only exists for sites that connected after this feature shipped.
	 *
	 * @var string
	 */
	const CONNECTED_AT_OPTION = 'jetpack_stats_first_connected_at';

	/**
	 * Record the site's first connection time.
	 * Later (re)registrations keep the original value, so reconnecting an
	 * existing site doesn't turn it into a "new" one.
	 */
	public static function record_connection_time() {
		if ( ! get_option( self::CONNECTED_AT_OPTION ) ) {
			update_option( self::CONNECTED_AT_OPTION, time() );
		}
	}

	/**
	 * Check if the site is new (qualifies for pricing grid).
	 *
	 * A site is considered "new" if:
	 * 1. It's not connected to WordPress.com, OR
	 * 2. Its first connection was recorded on/after the LAUNCH_DATE.
	 *    Sites already connected before this feature shipped have no recorded
	 *    connection time and don't qualify.
	 *
	 * @return bool True if the site is new.
	 */
	public static function is_new_site() {
		if ( ! ( new Connection_Manager() )->is_connected() ) {
			return true;
		}

		$connected_at = (int) get_option( self::CONNECTED_AT_OPTION );
		return $connected_at && $connected_at >= strtotime( self::LAUNCH_DATE );
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
	 * Option marking the pricing grid as dismissed.
	 *
	 * Set once the user picks a plan from the grid, so it doesn't reappear
	 * after "I will do it later" or an abandoned checkout. The wpcom notices
	 * endpoint is the authoritative record for connected sites; this local
	 * option covers unconnected sites, where that endpoint is unreachable.
	 *
	 * @var string
	 */
	const DISMISSED_OPTION = 'jetpack_stats_pricing_grid_dismissed';

	/**
	 * Check if the pricing grid has been dismissed.
	 *
	 * @return bool True if the pricing grid has been dismissed.
	 */
	public static function is_dismissed() {
		if ( get_option( self::DISMISSED_OPTION ) ) {
			return true;
		}

		if ( ( new Connection_Manager() )->is_connected() ) {
			return ( new Notices() )->is_notice_hidden( Notices::PRICING_GRID_DISMISSED_NOTICE_ID );
		}

		return false;
	}

	/**
	 * Mark the pricing grid as dismissed.
	 */
	public static function dismiss() {
		update_option( self::DISMISSED_OPTION, true );

		if ( ( new Connection_Manager() )->is_connected() ) {
			( new Notices() )->update_notice( Notices::PRICING_GRID_DISMISSED_NOTICE_ID, 'dismissed' );
		}
	}

	/**
	 * Check if the site qualifies for the pricing grid: a new site without a
	 * Stats plan. Dismissal is intentionally not considered here — this also
	 * gates the Stats menu registration for unconnected sites, which must
	 * survive dismissal.
	 *
	 * @return bool True if the site qualifies for the pricing grid.
	 */
	public static function is_eligible_site() {
		// WordPress.com Simple and WoA sites get Stats with their plan; the
		// connection-based "new site" logic doesn't apply there either.
		if ( ( new Host() )->is_wpcom_platform() ) {
			return false;
		}

		return self::is_new_site() && ! self::has_stats_plan();
	}

	/**
	 * Check if the pricing grid should be shown.
	 *
	 * The pricing grid is shown for new sites without a Stats plan, until dismissed.
	 *
	 * @return bool True if the pricing grid should be shown.
	 */
	public static function should_show_pricing_grid() {
		/**
		 * Filters whether to show the Stats pricing grid.
		 *
		 * Useful for testing the grid regardless of the site's eligibility or
		 * dismissal state: add_filter( 'jetpack_stats_pricing_grid_show', '__return_true' ).
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $show Whether to show the pricing grid.
		 */
		return apply_filters( 'jetpack_stats_pricing_grid_show', self::is_eligible_site() && ! self::is_dismissed() );
	}
}
