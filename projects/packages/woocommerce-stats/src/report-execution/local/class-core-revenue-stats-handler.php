<?php
/**
 * `orders.by_date` from core's revenue stats.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * The `orders.by_date` fields core's revenue stats produce with WordPress.com's meaning.
 *
 * @internal
 *
 * @since $$next-version$$
 */
class Core_Revenue_Stats_Handler extends Core_Report_Handler {

	/**
	 * Core REST route.
	 *
	 * @var string
	 */
	protected $core_route = '/wc-analytics/reports/revenue/stats';

	/**
	 * Core controller class.
	 *
	 * @var string
	 */
	protected $core_controller = 'Automattic\\WooCommerce\\Admin\\API\\Reports\\Revenue\\Stats\\Controller';

	/**
	 * Contract field => core field. `total_items` is left out: core's `num_items_sold` nets out refunded items.
	 *
	 * @var array<string, string|string[]>
	 */
	protected $fields = array(
		'orders_no'           => 'orders_count',
		'orders_value_net'    => 'net_revenue',
		'orders_value_gross'  => 'gross_sales',
		'total_sales'         => 'total_sales',
		'average_order_value' => array( 'avg_order_value', 'orders_count' ),
		'avg_items'           => array( 'avg_items_per_order', 'orders_count' ),
		'coupons'             => 'coupons',
		'refunds'             => 'refunds',
	);
}
