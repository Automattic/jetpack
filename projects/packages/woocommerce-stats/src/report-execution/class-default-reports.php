<?php
/**
 * The package's own reports, handlers and providers.
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
	 * Semantics every orders-based report is defined by.
	 */
	const ORDER_SEMANTICS = array(
		// The store's excluded statuses, plus `checkout-draft`, `auto-draft` and `trash`, as core's Analytics counts.
		'population' => 'analytics_statuses',
		'week_start' => 'site',
		'timezone'   => 'site',
	);

	/**
	 * Where WordPress.com's order reports differ from those semantics, as measured on a test store.
	 */
	const WPCOM_ORDER_DEVIATIONS = array(
		'population' => 'includes_checkout_draft',
		'week_start' => 'sunday',
	);

	/**
	 * Reports the existing widgets read from WordPress.com, by id => route pattern, until their contracts are written down.
	 */
	const UNDESCRIBED_WPCOM_REPORTS = array(
		'bookings.by_date'                     => 'bookings/by-date',
		'coupons'                              => 'coupons',
		'coupons.by_date'                      => 'coupons/by-date',
		'customers.by_date'                    => 'customers/by-date',
		'customers.new_returning'              => 'customers/new-returning',
		'order_attribution.summary'            => 'order-attribution/[\w-]+/summary',
		'order_attribution_by_product.summary' => 'order-attribution-by-product/[\w-]+/summary',
		'orders_by_product_type.by_date'       => 'orders-by-product-type/by-date',
		'products'                             => 'products',
		'sessions.by_conversion_rate'          => 'sessions/by-conversion-rate',
		'sessions.by_date'                     => 'sessions/by-date',
		'sessions.by_location'                 => 'sessions/by-location',
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

		$registry->register_provider( new Local_Report_Provider() );
		$registry->register_provider( new Remote_Report_Provider() );

		foreach ( self::definitions() as $definition ) {
			$registry->register_report( $definition );
		}

		$transport = array( new Api_Proxy_Controller(), 'fetch_remote' );
		$registry->register_handler( Report_Registry::ANY_REPORT, 'remote', new Wpcom_Forward_Handler( $transport ) );
		$registry->register_handler( 'orders.by_date', 'remote', new Wpcom_Forward_Handler( $transport, self::WPCOM_ORDER_DEVIATIONS ) );

		$registry->register_handler( 'orders.by_date', 'local', new Core_Revenue_Stats_Handler() );
		$registry->register_handler( 'stock.summary', 'local', new Core_Stock_Stats_Handler() );
		$registry->register_handler( 'stock.products', 'local', new Core_Stock_List_Handler() );
		$registry->register_handler( 'orders.by_status', 'local', new Builder_Handler( new Orders_By_Status_Builder(), new Local_Woo_Schema() ) );
	}

	/**
	 * The package's report definitions.
	 *
	 * @return Report_Definition[]
	 */
	private static function definitions() {
		$definitions = array(
			new Report_Definition(
				'orders.by_date',
				1,
				array( 'orders/by-date' ),
				array(
					'orders_no'                => 'int',
					'orders_value_net'         => 'money',
					'orders_value_gross'       => 'money',
					'total_sales'              => 'money',
					'average_order_value'      => 'money',
					'avg_items'                => 'number',
					'coupons'                  => 'int',
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
				),
				array( 'orders' ),
				self::ORDER_SEMANTICS
			),
			new Report_Definition(
				'sessions.by_device',
				1,
				array( 'sessions/by-device' ),
				array(
					'active_sessions' => 'int',
					'total_orders'    => 'int',
				),
				array( 'sessions' ),
				array( 'timezone' => 'site' )
			),
			// Local-only, named by id. These two stand in for the Stock notifications reports.
			new Report_Definition(
				'stock.summary',
				1,
				array(),
				array(
					'products'    => 'int',
					'instock'     => 'int',
					'lowstock'    => 'int',
					'outofstock'  => 'int',
					'onbackorder' => 'int',
				),
				array( 'products' )
			),
			new Report_Definition( 'stock.products', 0, array(), null, array( 'products' ) ),
			// Sample of a report served by a shared builder.
			new Report_Definition(
				'orders.by_status',
				1,
				array(),
				array(
					'orders_no' => 'int',
					'net_total' => 'money',
				),
				array( 'orders' ),
				self::ORDER_SEMANTICS
			),
		);

		foreach ( self::UNDESCRIBED_WPCOM_REPORTS as $id => $route ) {
			$definitions[] = new Report_Definition( $id, 0, array( $route ), null, array() );
		}

		return $definitions;
	}
}
