<?php
/**
 * Serves store reports from WordPress.com.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\Jetpack\Connection\Manager;

/**
 * The reports WordPress.com serves, run through the proxy controller's transport.
 *
 * @since $$next-version$$
 */
class Remote_Report_Provider implements Report_Provider {

	/**
	 * Routes WordPress.com serves, as patterns over the route below `analytics/reports/`.
	 */
	const ROUTE_PATTERNS = array(
		'bookings/by-date',
		'coupons',
		'coupons/by-date',
		'customers/by-date',
		'customers/new-returning',
		'order-attribution/[\w-]+/summary',
		'order-attribution-by-product/[\w-]+/summary',
		'orders/by-date',
		'orders-by-product-type/by-date',
		'products',
		'sessions/by-conversion-rate',
		'sessions/by-date',
		'sessions/by-device',
		'sessions/by-location',
	);

	/**
	 * Forwards a route and its params to WordPress.com.
	 *
	 * @var callable
	 */
	private $transport;

	/**
	 * Constructor.
	 *
	 * @param callable $transport Takes the route and params, returns a payload or a WP_Error.
	 */
	public function __construct( callable $transport ) {
		$this->transport = $transport;
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_name() {
		return 'remote';
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string $route Report route.
	 */
	public function supports( $route ) {
		foreach ( self::ROUTE_PATTERNS as $pattern ) {
			if ( preg_match( '#^' . $pattern . '$#', $route ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string $route Report route.
	 */
	public function check_ready( $route ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Readiness is the same for every remote route.
		if ( ( new Manager() )->is_connected() ) {
			return true;
		}

		return Report_Executor::error(
			'needs_connection',
			503,
			'needs_connection',
			__( 'Connect this site to WordPress.com to see this report.', 'jetpack-woocommerce-stats-pkg' )
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string $route  Report route.
	 * @param array  $params Report query params.
	 */
	public function run( $route, array $params ) {
		return call_user_func( $this->transport, $route, $params );
	}
}
