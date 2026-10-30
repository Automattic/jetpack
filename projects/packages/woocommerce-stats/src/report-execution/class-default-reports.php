<?php
/**
 * The package's own reports, handler and provider.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\Jetpack\WooCommerceStats\Api_Proxy_Controller;

/**
 * Registers what the WooCommerce Stats widgets read, on `Report_Registry::REGISTER_ACTION`.
 *
 * @since $$next-version$$
 */
class Default_Reports {

	/**
	 * Reports the widgets read from WordPress.com, by id => route pattern.
	 */
	private const ROUTES = array(
		'bookings.by_date'                     => 'bookings/by-date',
		'coupons'                              => 'coupons',
		'coupons.by_date'                      => 'coupons/by-date',
		'customers.by_date'                    => 'customers/by-date',
		'customers.new_returning'              => 'customers/new-returning',
		'order_attribution.summary'            => 'order-attribution/[\w-]+/summary',
		'order_attribution_by_product.summary' => 'order-attribution-by-product/[\w-]+/summary',
		'orders.by_date'                       => 'orders/by-date',
		'orders_by_product_type.by_date'       => 'orders-by-product-type/by-date',
		'products'                             => 'products',
		'sessions.by_conversion_rate'          => 'sessions/by-conversion-rate',
		'sessions.by_date'                     => 'sessions/by-date',
		'sessions.by_device'                   => 'sessions/by-device',
		'sessions.by_location'                 => 'sessions/by-location',
	);

	/**
	 * Fill the registry.
	 *
	 * @param Report_Registry $registry The registry being filled.
	 * @return void
	 */
	public static function register( Report_Registry $registry ) {
		$registry->register_provider( new Remote_Report_Provider() );
		$registry->register_handler( Report_Registry::ANY_REPORT, 'remote', new Wpcom_Forward_Handler( new Api_Proxy_Controller() ) );

		foreach ( self::ROUTES as $id => $route ) {
			$registry->register_report( new Report_Definition( $id, 0, array( $route ) ) );
		}
	}
}
