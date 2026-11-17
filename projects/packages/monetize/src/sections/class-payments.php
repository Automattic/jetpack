<?php
/**
 * The Payments section: Stripe, plans and the commission WordPress.com takes.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Monetize\Dashboard_Section;
use Automattic\Jetpack\Monetize\WPCOM_Proxy;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Payments state and routes.
 *
 * @since 0.2.0
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
	 * Whether the plan lets the site manage payment plans, as Calypso decides it.
	 *
	 * @return array
	 */
	public function get_state() {
		return array(
			'canManagePlans' => Current_Plan::supports( 'recurring-payments' )
				|| Current_Plan::supports( 'donations' )
				|| Current_Plan::supports( 'premium-content/container' ),
		);
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

		WPCOM_Proxy::register_route( 'wpcom/v2', 'memberships/stripe/disconnect', 'POST' );

		// Totals and next month's forecast, plus the commission.
		WPCOM_Proxy::register_route( 'wpcom/v2', 'memberships/earnings', 'GET' );

		WPCOM_Proxy::register_route(
			'wpcom/v2',
			'memberships/products',
			'GET',
			array(
				'type'        => array(
					'type' => 'string',
					'enum' => array( 'all' ),
				),
				'is_editable' => array( 'type' => 'boolean' ),
			)
		);

		WPCOM_Proxy::register_route( 'wpcom/v2', 'memberships/product', 'POST', self::get_product_args() );
		WPCOM_Proxy::register_route( 'wpcom/v2', 'memberships/product/(?P<id>\d+)', 'POST', self::get_product_args() );

		WPCOM_Proxy::register_route(
			'wpcom/v2',
			'memberships/product/(?P<id>\d+)',
			'DELETE',
			array(
				'cancel_subscriptions' => array( 'type' => 'boolean' ),
			)
		);
	}

	/**
	 * The fields a plan is created or updated with, as WordPress.com reads them.
	 *
	 * @return array
	 */
	private static function get_product_args() {
		return array(
			'title'                        => array(
				'type'     => 'string',
				'required' => true,
			),
			'price'                        => array(
				'type'     => 'number',
				'required' => true,
			),
			'currency'                     => array(
				'type'     => 'string',
				'required' => true,
			),
			'interval'                     => array(
				'type'     => 'string',
				'enum'     => array( '1 month', '1 year', 'one-time' ),
				'required' => true,
			),
			'type'                         => array(
				'type' => 'string',
				'enum' => array( 'tier', 'donation' ),
			),
			// A tier's annual product names its monthly one.
			'tier'                         => array( 'type' => 'integer' ),
			'description'                  => array( 'type' => 'string' ),
			'welcome_email_content'        => array( 'type' => 'string' ),
			'buyer_can_change_amount'      => array( 'type' => 'boolean' ),
			'multiple_per_user'            => array( 'type' => 'boolean' ),
			'subscribe_as_site_subscriber' => array( 'type' => 'boolean' ),
			'is_editable'                  => array( 'type' => 'boolean' ),
		);
	}
}
