<?php
/**
 * `orders.by_date` from core's revenue stats.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * The four wpcom order fields core's revenue stats can produce.
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
	 * Response shape.
	 *
	 * @var string
	 */
	protected $shape = 'stats';

	/**
	 * Field map: wpcom field => core field.
	 *
	 * @var array
	 */
	protected $fields = array(
		'orders_no'           => 'orders_count',
		'orders_value_net'    => 'net_revenue',
		'total_sales'         => 'total_sales',
		'average_order_value' => array( 'avg_order_value', 'orders_count' ),
	);
}
