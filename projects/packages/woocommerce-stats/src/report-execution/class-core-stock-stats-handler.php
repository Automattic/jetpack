<?php
/**
 * `stock.summary` from core's stock stats.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * Stock counts by status, core's fields passed through. Stands in for the Stock notifications
 * stats, which WooCommerce does not ship yet.
 *
 * @since $$next-version$$
 */
class Core_Stock_Stats_Handler extends Core_Report_Handler {

	/**
	 * Core REST route.
	 *
	 * @var string
	 */
	protected $core_route = '/wc-analytics/reports/stock/stats';

	/**
	 * Core controller class.
	 *
	 * @var string
	 */
	protected $core_controller = 'Automattic\\WooCommerce\\Admin\\API\\Reports\\Stock\\Stats\\Controller';

	/**
	 * Response shape.
	 *
	 * @var string
	 */
	protected $shape = 'totals';
}
