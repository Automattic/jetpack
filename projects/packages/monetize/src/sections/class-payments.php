<?php
/**
 * The Payments section: Stripe, plans and the commission WordPress.com takes.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use Automattic\Jetpack\Monetize\Dashboard_Section;
use Automattic\Jetpack\Monetize\WPCOM_Proxy;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Payments state and routes.
 *
 * @since $$next-version$$
 */
class Payments implements Dashboard_Section {

	/**
	 * Section key.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'payments';
	}

	/**
	 * Nothing yet: the page reads payments data from WordPress.com.
	 *
	 * @return array
	 */
	public function get_state() {
		return array();
	}

	/**
	 * Register the section's routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		// Stripe connection, commission and currency.
		WPCOM_Proxy::register_route(
			'wpcom/v2',
			'memberships/status',
			'GET',
			array(
				'source' => array(
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_key',
				),
			)
		);

		// Totals and next month's forecast, for the Overview.
		WPCOM_Proxy::register_route( 'wpcom/v2', 'memberships/earnings', 'GET' );
	}
}
