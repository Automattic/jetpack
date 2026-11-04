<?php
/**
 * A source of report data: the readiness every handler under it shares.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * A source of report data, registered under the name the `provider` param uses.
 *
 * @internal Not a stable contract yet: the signature changes in the next steps.
 *
 * @since $$next-version$$
 */
interface Report_Provider {

	/**
	 * Whether the provider can serve anything now, such as the connection for `wpcom`.
	 *
	 * @return true|WP_Error A 503 error when it cannot.
	 */
	public function check_ready();
}
