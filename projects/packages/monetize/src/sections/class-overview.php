<?php
/**
 * The Overview section: what the site earns, and the ways it could earn more.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Monetize\Dashboard;
use Automattic\Jetpack\Monetize\Dashboard_Section;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
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
	 * The slug the `jetpack_feature_upgrade` filter sees for this page's upgrade links.
	 *
	 * @var string
	 */
	const UPGRADE_SLUG = 'monetize-dashboard';

	/**
	 * Section key.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'overview';
	}

	/**
	 * Which paid features the plan includes, whether ads are on, and where to upgrade.
	 *
	 * @return array
	 */
	public function get_state() {
		return array(
			'hasWordAds'        => Current_Plan::supports( 'wordads' ),
			'isWordAdsActive'   => ( new Modules() )->is_active( 'wordads' ),
			'hasSimplePayments' => Current_Plan::supports( 'simple-payments' ),
			'upgradeUrl'        => self::get_upgrade_url(),
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

	/**
	 * Where the page's upgrade links go: Jetpack Creator, unless a host sends them to its own plans.
	 *
	 * @return string
	 */
	public static function get_upgrade_url() {
		/** This filter is documented in projects/packages/my-jetpack/src/class-main-features.php */
		$upgrade = apply_filters(
			'jetpack_feature_upgrade',
			array(
				'path'     => '',
				'name'     => 'Jetpack Creator', // Product name, do not translate.
				'back_url' => admin_url( 'admin.php?page=' . Dashboard::MENU_SLUG ),
			),
			self::UPGRADE_SLUG,
			false
		);

		$url = is_array( $upgrade ) ? esc_url_raw( (string) ( $upgrade['url'] ?? '' ) ) : '';

		return $url ? $url : Redirect::get_url( 'jetpack-creator-cta', array( 'site' => ( new Status() )->get_site_suffix() ) );
	}
}
