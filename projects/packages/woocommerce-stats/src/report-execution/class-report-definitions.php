<?php
/**
 * What each store report is, independent of who serves it.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * The report contract: identity, version, the routes that name it, its fields, the datasets it
 * reads and the semantics two providers must share to be interchangeable.
 *
 * @since $$next-version$$
 */
class Report_Definitions {

	/**
	 * Semantics every orders-based report is defined by. A provider declares where it deviates.
	 */
	const ORDER_SEMANTICS = array(
		// The store's excluded statuses, plus `checkout-draft`, `auto-draft` and `trash`, as core's Analytics counts.
		'population' => 'analytics_statuses',
		'week_start' => 'site',
		'timezone'   => 'site',
	);

	/**
	 * The definitions, by report id.
	 *
	 * - `routes`: patterns over the route below `analytics/reports/` that resolve to the report.
	 * - `fields`: the summary fields of the contract, by type; null until the report's contract is written down.
	 * - `datasets`: what the report reads, for readiness and coverage.
	 *
	 * @return array<string, array>
	 */
	public static function all() {
		static $definitions = null;
		if ( null !== $definitions ) {
			return $definitions;
		}

		$definitions = array(
			'orders.by_date'                       => array(
				'version'   => 1,
				'routes'    => array( 'orders/by-date' ),
				'fields'    => array(
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
				'datasets'  => array( 'orders' ),
				'semantics' => self::ORDER_SEMANTICS,
			),
			'sessions.by_device'                   => array(
				'version'   => 1,
				'routes'    => array( 'sessions/by-device' ),
				'fields'    => array(
					'active_sessions' => 'int',
					'total_orders'    => 'int',
				),
				'datasets'  => array( 'sessions' ),
				'semantics' => array( 'timezone' => 'site' ),
			),
			'stock.summary'                        => array(
				'version'   => 1,
				'routes'    => array( 'stock/summary' ),
				'fields'    => array(
					'products'    => 'int',
					'instock'     => 'int',
					'lowstock'    => 'int',
					'outofstock'  => 'int',
					'onbackorder' => 'int',
				),
				'datasets'  => array( 'products' ),
				'semantics' => array(),
			),
			'stock.products'                       => self::undescribed( 'stock/products', array( 'products' ) ),

			// The reports the existing widgets read from WordPress.com, until their contracts are written down.
			'bookings.by_date'                     => self::undescribed( 'bookings/by-date', array( 'orders' ) ),
			'coupons'                              => self::undescribed( 'coupons', array( 'orders' ) ),
			'coupons.by_date'                      => self::undescribed( 'coupons/by-date', array( 'orders' ) ),
			'customers.by_date'                    => self::undescribed( 'customers/by-date', array( 'orders', 'customers' ) ),
			'customers.new_returning'              => self::undescribed( 'customers/new-returning', array( 'orders', 'customers' ) ),
			'order_attribution.summary'            => self::undescribed( 'order-attribution/[\w-]+/summary', array( 'orders' ) ),
			'order_attribution_by_product.summary' => self::undescribed( 'order-attribution-by-product/[\w-]+/summary', array( 'orders' ) ),
			'orders_by_product_type.by_date'       => self::undescribed( 'orders-by-product-type/by-date', array( 'orders' ) ),
			'products'                             => self::undescribed( 'products', array( 'orders' ) ),
			'sessions.by_conversion_rate'          => self::undescribed( 'sessions/by-conversion-rate', array( 'sessions', 'orders' ) ),
			'sessions.by_date'                     => self::undescribed( 'sessions/by-date', array( 'sessions' ) ),
			'sessions.by_location'                 => self::undescribed( 'sessions/by-location', array( 'sessions' ) ),
		);

		return $definitions;
	}

	/**
	 * The definition a route resolves to.
	 *
	 * @param string $route Report route below `analytics/reports/`, e.g. `orders/by-date`.
	 * @return array|null The definition with its `id`, or null for a route no report claims.
	 */
	public static function for_route( $route ) {
		foreach ( self::all() as $id => $definition ) {
			foreach ( $definition['routes'] as $pattern ) {
				if ( preg_match( '#^' . $pattern . '$#', $route ) ) {
					return array( 'id' => $id ) + $definition;
				}
			}
		}

		return null;
	}

	/**
	 * A report whose contract is not written down yet: whole-report requests only, and no field validation.
	 *
	 * @param string   $route    Route pattern.
	 * @param string[] $datasets What it reads.
	 * @return array
	 */
	private static function undescribed( $route, array $datasets ) {
		return array(
			'version'   => 0,
			'routes'    => array( $route ),
			'fields'    => null,
			'datasets'  => $datasets,
			'semantics' => array(),
		);
	}
}
