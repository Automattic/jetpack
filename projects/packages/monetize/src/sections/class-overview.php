<?php
/**
 * The Overview section: what the site earns, and the ways it could earn more.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Monetize\Dashboard_Section;
use Automattic\Jetpack\Monetize\WPCOM_Proxy;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Overview state, and the referral routes. Its earnings come from the Payments section's routes.
 *
 * @since 0.2.0
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
		$state = array(
			'hasWordAds'        => Current_Plan::supports( 'wordads' ),
			'isWordAdsActive'   => ( new Modules() )->is_active( 'wordads' ),
			'hasSimplePayments' => Current_Plan::supports( 'simple-payments' ),
			// The payments fee the upgrade brings: Jetpack Creator's 2%, or 0% on WordPress.com's top plans.
			'upgradeCommission' => ( new Host() )->is_wpcom_platform() ? 0 : 0.02,
		);

		if ( self::can_refer() ) {
			$state['referral'] = self::get_referral_state();
		}

		return $state;
	}

	/**
	 * Referrals are WordPress.com's, so only its sites offer them, and only to a user WordPress.com knows.
	 *
	 * @return bool
	 */
	private static function can_refer() {
		$host = new Host();
		return $host->is_wpcom_simple() || ( $host->is_woa_site() && ( new Connection_Manager() )->is_user_connected() );
	}

	/**
	 * Whether the site can refer friends, which takes a paid annual WordPress.com plan, and where to get one.
	 *
	 * @return array
	 */
	private static function get_referral_state() {
		$plan = class_exists( '\WPCOM_Store_API' ) ? \WPCOM_Store_API::get_current_plan( get_current_blog_id() ) : Current_Plan::get();
		$slug = is_array( $plan ) ? (string) ( $plan['product_slug'] ?? '' ) : '';

		return array(
			'eligible'   => '' !== $slug && 'free_plan' !== $slug && ! str_contains( $slug, 'monthly' ),
			'upgradeUrl' => 'https://wordpress.com/plans/yearly/' . ( new Status() )->get_site_suffix(),
		);
	}

	/**
	 * The user's referral link, and the switch that creates it.
	 *
	 * @return void
	 */
	public function register_routes() {
		if ( ! ( new Host() )->is_woa_site() ) {
			return;
		}

		WPCOM_Proxy::register_route( 'wpcom/v2', 'me/peer-referral-link', 'GET' );
		WPCOM_Proxy::register_route( 'wpcom/v2', 'me/peer-referral-link-enable', 'POST', array( 'enable' => array( 'type' => 'boolean' ) ) );
	}
}
