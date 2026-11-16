<?php
/**
 * The Overview section: what the site earns, and the ways it could earn more.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Monetize\Dashboard_Section;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Overview state. Its earnings come from the Payments section's routes.
 *
 * @since $$next-version$$
 */
class Overview implements Dashboard_Section {

	/**
	 * Section key.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'overview';
	}

	/**
	 * Which paid features the plan includes, and whether ads are on.
	 *
	 * @return array
	 */
	public function get_state() {
		return array(
			'hasWordAds'        => Current_Plan::supports( 'wordads' ),
			'isWordAdsActive'   => ( new Modules() )->is_active( 'wordads' ),
			'hasSimplePayments' => Current_Plan::supports( 'simple-payments' ),
			// The payments fee the upgrade brings: Jetpack Creator's 2%, or 0% on WordPress.com's top plans.
			'upgradeCommission' => ( new Host() )->is_wpcom_platform() ? 0 : 0.02,
		);
	}

	/**
	 * No routes of its own.
	 *
	 * @return void
	 */
	public function register_routes() {}
}
