<?php
/**
 * WordPress.com's synced data.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\Jetpack\Connection\Manager;
use WP_Error;

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
	 */
	public function check_ready() {
		if ( ( new Manager() )->is_connected() ) {
			return true;
		}

		return new WP_Error(
			'needs_connection',
			__( 'Connect this site to WordPress.com to see this report.', 'jetpack-woocommerce-stats-pkg' ),
			array( 'status' => 503 )
		);
	}
}
