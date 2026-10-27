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
	 * Reports WordPress.com serves.
	 */
	const REPORTS = array(
		'bookings.by_date',
		'coupons',
		'coupons.by_date',
		'customers.by_date',
		'customers.new_returning',
		'order_attribution.summary',
		'order_attribution_by_product.summary',
		'orders.by_date',
		'orders_by_product_type.by_date',
		'products',
		'sessions.by_conversion_rate',
		'sessions.by_date',
		'sessions.by_device',
		'sessions.by_location',
	);

	/**
	 * Where WordPress.com's order reports differ from the definitions' semantics, as measured on a test store.
	 */
	const ORDER_DEVIATIONS = array(
		'population' => 'includes_checkout_draft',
		'week_start' => 'sunday',
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
	 * @param string $report_id Report id.
	 */
	public function get_capability( $report_id ) {
		if ( ! in_array( $report_id, self::REPORTS, true ) ) {
			return null;
		}

		return array(
			'fields'     => '*',
			'params'     => '*',
			'deviations' => 'orders.by_date' === $report_id ? self::ORDER_DEVIATIONS : array(),
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param array $request The effective request.
	 */
	public function check_ready( array $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Readiness is the same for every remote report.
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
	 * @param array $request The effective request.
	 */
	public function run( array $request ) {
		return call_user_func( $this->transport, $request['route'], $request['params'] );
	}
}
