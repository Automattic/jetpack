<?php
/**
 * The Ads section of the Premium Analytics dashboard, on sites that run the WordAds module.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WordAds\Analytics_Dashboard;

/**
 * Hands the Ads section and its widget types to the Premium Analytics dashboard.
 *
 * The section, its layout and the widgets live in the jetpack-wordads-analytics package; this class decides
 * that a site running the module gets them. On the WordPress.com platform jetpack-mu-wpcom decides
 * by plan feature and this registrant stays out.
 *
 * @since $$next-version$$
 */
class WordAds_Premium_Analytics {

	/**
	 * Hook the package's registrants on the dashboard's registry actions.
	 *
	 * @return void
	 */
	public static function init() {
		// Simple and Atomic decide by plan feature, from jetpack-mu-wpcom.
		if ( ( new Host() )->is_wpcom_platform() ) {
			return;
		}

		if ( ! class_exists( Analytics_Dashboard::class ) ) {
			return;
		}

		Analytics_Dashboard::init();
	}
}
