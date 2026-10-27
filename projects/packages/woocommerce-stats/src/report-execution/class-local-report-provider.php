<?php
/**
 * The store's own data.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * The `local` provider. It has no shared prerequisite; each handler checks its own.
 *
 * @since $$next-version$$
 */
class Local_Report_Provider implements Report_Provider {

	/**
	 * {@inheritDoc}
	 */
	public function get_name() {
		return 'local';
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function check_ready( Report_Query $query ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Nothing to check across local handlers.
		return true;
	}
}
