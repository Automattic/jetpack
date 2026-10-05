<?php
/**
 * The WooCommerce section of the Premium Analytics dashboard, on self-hosted Jetpack sites.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WooCommerceStats\Analytics_Dashboard;

/**
 * Hands the WooCommerce section and its widget types to the Premium Analytics dashboard.
 *
 * The section, its layout and the widgets live in the jetpack-woocommerce-stats package. On the
 * WordPress.com platform jetpack-mu-wpcom registers them, and this registrant stays out.
 *
 * @since $$next-version$$
 */
class WooCommerce_Stats_Premium_Analytics {

	/**
	 * Hook the package's registrants on the dashboard's registry actions.
	 *
	 * @return void
	 */
	public static function init() {
		// Simple and Atomic register from jetpack-mu-wpcom, which loads the Jetpack plugin's copy.
		if ( ( new Host() )->is_wpcom_platform() ) {
			return;
		}

		if ( ! class_exists( Analytics_Dashboard::class ) ) {
			return;
		}

		Analytics_Dashboard::init();
	}
}
