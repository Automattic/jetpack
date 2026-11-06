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
 * @since $$next-version$$
 */
interface Report_Handler {

	/**
	 * What the handler serves, before it runs. A forced provider whose handler covers less is refused.
	 *
	 * @return array{fields: string[]|string, params: string[]|string} Summary fields and query params, each a list or `*` for all.
	 */
	public function get_capability();

	/**
	 * Serve the request. A request naming no provider reaches this without the provider's readiness check.
	 *
	 * @param Report_Request $request The request.
	 * @return array|WP_Error `data`, `status` and `headers`.
	 */
	public function run( Report_Request $request );
}
