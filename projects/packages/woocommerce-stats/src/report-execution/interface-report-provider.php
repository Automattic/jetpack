<?php
/**
 * A source of report data: a name plus the readiness every handler under it shares.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * A source of report data, named by the `execution` param.
 *
 * @since $$next-version$$
 */
interface Report_Provider {

	/**
	 * The provider's name.
	 *
	 * @return string
	 */
	public function get_name();

	/**
	 * Whether the provider can serve anything now, such as the connection for `remote`.
	 *
	 * @return true|WP_Error A 503 error when it cannot.
	 */
	public function check_ready();
}
