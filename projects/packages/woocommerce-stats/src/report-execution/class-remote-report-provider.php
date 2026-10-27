<?php
/**
 * WordPress.com's synced data.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\Jetpack\Connection\Manager;

/**
 * The `remote` provider: every remote handler needs the Jetpack connection.
 *
 * @since $$next-version$$
 */
class Remote_Report_Provider implements Report_Provider {

	/**
	 * {@inheritDoc}
	 */
	public function get_name() {
		return 'remote';
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function check_ready( Report_Query $query ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The connection is the same for every request.
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
}
