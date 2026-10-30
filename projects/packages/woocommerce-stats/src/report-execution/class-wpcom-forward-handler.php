<?php
/**
 * Remote handler: forwards a report to WordPress.com.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * One handler for every report WordPress.com serves, through the proxy controller's transport.
 *
 * @since $$next-version$$
 */
class Wpcom_Forward_Handler implements Report_Handler {

	/**
	 * Takes the route, the params as sent and whether to skip the cache; returns a payload or a WP_Error.
	 *
	 * @var callable
	 */
	private $transport;

	/**
	 * Where WordPress.com differs from the report's semantics.
	 *
	 * @var array<string, string>
	 */
	private $deviations;

	/**
	 * Constructor.
	 *
	 * @param callable              $transport  The transport.
	 * @param array<string, string> $deviations Where WordPress.com differs from the report's semantics.
	 */
	public function __construct( callable $transport, array $deviations = array() ) {
		$this->transport  = $transport;
		$this->deviations = $deviations;
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_capability() {
		return array(
			'fields'     => '*',
			'params'     => '*',
			'deviations' => $this->deviations,
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function supports( Report_Query $query ) {
		// Only a WordPress.com route can be forwarded: a local-only report, or one named by its id, has none.
		if ( $query->definition->matches_route( $query->route ) ) {
			return true;
		}

		return Report_Executor::error(
			'unsupported_provider',
			422,
			'remote_not_declared',
			__( 'This report cannot be served by the remote provider.', 'jetpack-woocommerce-stats-pkg' )
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function check_ready( Report_Query $query ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The remote provider checks the connection.
		return true;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function run( Report_Query $query ) {
		return call_user_func( $this->transport, $query->route, $query->raw_params, $query->force_refresh );
	}
}
