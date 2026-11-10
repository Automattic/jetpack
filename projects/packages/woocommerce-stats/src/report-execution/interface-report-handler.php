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
 * @internal Not a stable contract yet: the signature changes in the next steps.
 *
 * @since 0.3.3
 */
interface Report_Handler {

	/**
	 * Serve the request. A request naming no provider reaches this without the provider's readiness check.
	 *
	 * @param Report_Request $request The request.
	 * @return array|WP_Error `data`, `status` and `headers`.
	 */
	public function run( Report_Request $request );
}
