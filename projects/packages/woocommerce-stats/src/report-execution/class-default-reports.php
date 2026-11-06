<?php
/**
 * The package's own reports, handler and provider.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\Jetpack\WooCommerceStats\Api_Proxy_Controller;

/**
 * Registers the reports WordPress.com serves, on `Report_Registry::REGISTER_ACTION`.
 *
 * @since $$next-version$$
 */
class Default_Reports {

	/**
	 * Summary fields of `orders.by_date`, from WordPress.com's orders data store. The averages are null without orders.
	 */
	private const ORDERS_BY_DATE_FIELDS = array(
		'orders_no'                => 'int',
		'orders_value_net'         => 'money',
		'orders_value_gross'       => 'money',
		'total_sales'              => 'money',
		'average_order_value'      => 'money',
		'avg_items'                => 'number',
		'coupons'                  => 'money',
		'refunds'                  => 'money',
		'total_items'              => 'int',
		'total_items_refunded'     => 'int',
		'total_orders_with_refund' => 'int',
		'paid_orders_count'        => 'int',
		'paid_net_sales'           => 'money',
		'unpaid_orders_count'      => 'int',
		'unpaid_net_sales'         => 'money',
		'product_net_revenue'      => 'money',
		'cogs_amount'              => 'money',
		'profit_margin'            => 'money',
	);

	/**
	 * Summary fields of `sessions.by_device`, from WordPress.com's sessions data store.
	 */
	private const SESSIONS_BY_DEVICE_FIELDS = array(
		'active_sessions' => 'int',
		'total_orders'    => 'int',
	);

	/**
	 * What an orders report counts, and by which calendar.
	 */
	private const ORDER_SEMANTICS = array(
		'population' => 'analytics_statuses',
		'week_start' => 'site',
		'timezone'   => 'site',
	);

	/**
	 * Reports WordPress.com serves, by id => route pattern.
	 */
	private const ROUTES = array(
		'bookings.by_date'                     => 'bookings/by-date',
		'coupons'                              => 'coupons',
		'coupons.by_date'                      => 'coupons/by-date',
		'customers.by_date'                    => 'customers/by-date',
		'customers.new_returning'              => 'customers/new-returning',
		'order_attribution.compare'            => 'order-attribution/[\w-]+/compare',
		'order_attribution.items'              => 'order-attribution/[\w-]+/items',
		'order_attribution.summary'            => 'order-attribution/[\w-]+/summary',
		'order_attribution_by_product.summary' => 'order-attribution-by-product/[\w-]+/summary',
		'orders.by_date'                       => 'orders/by-date',
		'orders_by_product_type.by_date'       => 'orders-by-product-type/by-date',
		'products'                             => 'products',
		'sessions.by_conversion_rate'          => 'sessions/by-conversion-rate',
		'sessions.by_date'                     => 'sessions/by-date',
		'sessions.by_device'                   => 'sessions/by-device',
		'sessions.by_location'                 => 'sessions/by-location',
		'taxes.breakdown'                      => 'taxes/breakdown',
		'taxes.by_date'                        => 'taxes/by-date',
	);

	/**
	 * Fill the registry.
	 *
	 * @param mixed $registry The registry being filled.
	 * @return void
	 */
	public static function register( $registry ) {
		if ( ! $registry instanceof Report_Registry ) {
			return;
		}

		$registry->register_provider( 'wpcom', new Wpcom_Report_Provider() );
		$registry->register_handler( Report_Registry::ANY_REPORT, 'wpcom', new Wpcom_Forward_Handler( new Api_Proxy_Controller() ) );

		$registry->register_report( new Report_Definition( 'orders.by_date', 1, array( self::ROUTES['orders.by_date'] ), self::ORDERS_BY_DATE_FIELDS, array( 'orders' ), self::ORDER_SEMANTICS ) );
		$registry->register_report( new Report_Definition( 'sessions.by_device', 1, array( self::ROUTES['sessions.by_device'] ), self::SESSIONS_BY_DEVICE_FIELDS, array( 'sessions' ), array( 'timezone' => 'site' ) ) );

		foreach ( self::ROUTES as $id => $route ) {
			$registry->register_report( new Report_Definition( $id, 0, array( $route ) ) );
		}
	}
}
