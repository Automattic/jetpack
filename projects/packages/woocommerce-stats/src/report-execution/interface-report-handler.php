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
	 * What the handler can serve, statically, for introspection.
	 *
	 * @return array `fields` and `params` (lists, or `*` for all), and `deviations` from the report's semantics.
	 */
	public function get_capability();

	/**
	 * Whether the handler can serve this request, such as its range or param values.
	 *
	 * @param Report_Query $query The request.
	 * @return true|WP_Error An error with a status (422, or 400 for a missing param) when it cannot.
	 */
	public function supports( Report_Query $query );

	/**
	 * Whether the handler's prerequisites hold on this site.
	 *
	 * @param Report_Query $query The request.
	 * @return true|WP_Error A 503 error with a `reason` when one is missing.
	 */
	public function check_ready( Report_Query $query );

	/**
	 * Serve the request in the wpcom report shape.
	 *
	 * @param Report_Query $query The request.
	 * @return array|WP_Error `data`, `status` and `headers`.
	 */
	public function run( Report_Query $query );
}
