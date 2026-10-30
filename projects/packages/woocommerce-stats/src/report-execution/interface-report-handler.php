<?php
/**
 * Serves one report, or every report, for one provider.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * Registered by (report id, provider). The executor picks one per request and runs it.
 *
 * @since $$next-version$$
 */
interface Report_Handler {

	/**
	 * Serve the request. A request naming no provider reaches this without the provider's readiness check.
	 *
	 * @param Report_Query $query The request.
	 * @return array|WP_Error `data`, `status` and `headers`.
	 */
	public function run( Report_Query $query );
}
