<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

// PHPUnit runs an isolated test from stdin, and wp_guess_url() warns on PHP 7.4 when the script path is empty.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

\Automattic\Jetpack\Test_Environment::init();

// Stand-in for the manifest accessor wp-build generates: the eight time series widgets.
if ( ! function_exists( 'jetpack_woocommerce_stats_get_registered_widget_modules' ) ) {
	/**
	 * Manifest stand-in.
	 *
	 * @return array[]
	 */
	function jetpack_woocommerce_stats_get_registered_widget_modules() {
		return array(
			array(
				'name'          => 'woocommerce-analytics/net-sales-over-time',
				'dir_name'      => 'net-sales-over-time',
				'title'         => 'Net sales over time',
				'category'      => 'orders',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-woocommerce-stats/widgets/net-sales-over-time/render',
				'widget_module' => 'jetpack-woocommerce-stats/widgets/net-sales-over-time/widget',
				'textdomain'    => null,
			),
			array(
				'name'          => 'woocommerce-analytics/total-sales-over-time',
				'dir_name'      => 'total-sales-over-time',
				'title'         => 'Total sales over time',
				'category'      => 'store',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-woocommerce-stats/widgets/total-sales-over-time/render',
				'widget_module' => 'jetpack-woocommerce-stats/widgets/total-sales-over-time/widget',
				'textdomain'    => null,
			),
			array(
				'name'          => 'woocommerce-analytics/gross-sales-over-time',
				'dir_name'      => 'gross-sales-over-time',
				'title'         => 'Gross sales over time',
				'category'      => 'store',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-woocommerce-stats/widgets/gross-sales-over-time/render',
				'widget_module' => 'jetpack-woocommerce-stats/widgets/gross-sales-over-time/widget',
				'textdomain'    => null,
			),
			array(
				'name'          => 'woocommerce-analytics/orders-over-time',
				'dir_name'      => 'orders-over-time',
				'title'         => 'Orders over time',
				'category'      => 'orders',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-woocommerce-stats/widgets/orders-over-time/render',
				'widget_module' => 'jetpack-woocommerce-stats/widgets/orders-over-time/widget',
				'textdomain'    => null,
			),
			array(
				'name'          => 'woocommerce-analytics/average-order-value',
				'dir_name'      => 'average-order-value',
				'title'         => 'Average order value',
				'category'      => 'orders',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-woocommerce-stats/widgets/average-order-value/render',
				'widget_module' => 'jetpack-woocommerce-stats/widgets/average-order-value/widget',
				'textdomain'    => null,
			),
			array(
				'name'          => 'woocommerce-analytics/average-items-per-order',
				'dir_name'      => 'average-items-per-order',
				'title'         => 'Average items per order',
				'category'      => 'orders',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-woocommerce-stats/widgets/average-items-per-order/render',
				'widget_module' => 'jetpack-woocommerce-stats/widgets/average-items-per-order/widget',
				'textdomain'    => null,
			),
			array(
				'name'          => 'woocommerce-analytics/bookings-over-time',
				'dir_name'      => 'bookings-over-time',
				'title'         => 'Bookings over time',
				'category'      => 'bookings',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-woocommerce-stats/widgets/bookings-over-time/render',
				'widget_module' => 'jetpack-woocommerce-stats/widgets/bookings-over-time/widget',
				'textdomain'    => null,
			),
			array(
				'name'          => 'woocommerce-analytics/visitors-over-time',
				'dir_name'      => 'visitors-over-time',
				'title'         => 'Visitors over time',
				'category'      => 'visitors',
				'presentation'  => 'framed',
				'render_module' => 'jetpack-woocommerce-stats/widgets/visitors-over-time/render',
				'widget_module' => 'jetpack-woocommerce-stats/widgets/visitors-over-time/widget',
				'textdomain'    => null,
			),
		);
	}
}
