<?php
/**
 * `stock.products` from core's stock list.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * Products with their stock status, one page at a time, core's fields passed through. Stands in for
 * the Stock notifications list, which WooCommerce does not ship yet.
 *
 * @since $$next-version$$
 */
class Core_Stock_List_Handler extends Core_Report_Handler {

	/**
	 * Stock statuses core's stock list filters by.
	 */
	const STOCK_TYPES = array( 'all', 'lowstock', 'instock', 'outofstock', 'onbackorder' );

	/**
	 * Core REST route.
	 *
	 * @var string
	 */
	protected $core_route = '/wc-analytics/reports/stock';

	/**
	 * Core controller class.
	 *
	 * @var string
	 */
	protected $core_controller = 'Automattic\\WooCommerce\\Admin\\API\\Reports\\Stock\\Controller';

	/**
	 * Response shape.
	 *
	 * @var string
	 */
	protected $shape = 'list';

	/**
	 * Paging and sorting, plus the stock status; core validates `orderby` against its own enum.
	 *
	 * @return array
	 */
	protected function extra_params() {
		return array(
			'limit'   => array( 'per_page', fn( $value ) => ctype_digit( $value ) && (int) $value >= 1 && (int) $value <= self::PER_PAGE ? (int) $value : null ),
			'page'    => array( 'page', fn( $value ) => ctype_digit( $value ) && (int) $value >= 1 ? (int) $value : null ),
			'orderby' => array( 'orderby', fn( $value ) => '' !== $value ? $value : null ),
			'order'   => array( 'order', fn( $value ) => in_array( $value, array( 'asc', 'desc' ), true ) ? $value : null ),
			'type'    => array( 'type', fn( $value ) => in_array( $value, self::STOCK_TYPES, true ) ? $value : null ),
		);
	}
}
