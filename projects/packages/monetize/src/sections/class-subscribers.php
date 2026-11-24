<?php
/**
 * The Paid subscribers section: everyone paying the site, and cancelling their payments.
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
 * Paid subscribers routes.
 *
 * @since 0.3.0
 */
class Subscribers implements Dashboard_Section {

	/**
	 * Section key.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'subscribers';
	}

	/**
	 * The section has no state of its own.
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
		WPCOM_Proxy::register_route(
			'wpcom/v2',
			'memberships/subscribers',
			'GET',
			array(
				'offset' => array(
					'type'    => 'integer',
					'minimum' => 0,
				),
			)
		);

		WPCOM_Proxy::register_route(
			'wpcom/v2',
			'memberships/subscriptions/(?P<id>\d+)/cancel',
			'POST',
			array(
				'user_id' => array(
					'type'     => 'integer',
					'minimum'  => 1,
					'required' => true,
				),
			)
		);
	}
}
