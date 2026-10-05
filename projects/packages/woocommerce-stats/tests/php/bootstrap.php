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

// Stand-in for the manifest accessor wp-build generates.
if ( ! function_exists( 'jetpack_woocommerce_stats_get_registered_widget_modules' ) ) {
	/**
	 * Manifest stand-in.
	 *
	 * @return array[]
	 */
	function jetpack_woocommerce_stats_get_registered_widget_modules() {
		return array(
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
		);
	}
}
