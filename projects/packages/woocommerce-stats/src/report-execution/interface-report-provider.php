<?php
/**
 * A source that can serve store reports.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * Declares how much of each report it can serve, whether it can serve it now, and serves it in the wpcom report shape.
 *
 * A request is the executor's effective request: `report` (the definition, with its `id`), `route`
 * (as requested), `params` (without `execution` and `fields`) and `fields` (requested, or null for the whole report).
 *
 * @since $$next-version$$
 */
interface Report_Provider {

	/**
	 * The provider's name, as the `execution` param and the provenance name it.
	 *
	 * @return string `local` or `remote`.
	 */
	public function get_name();

	/**
	 * What the provider can serve of a report.
	 *
	 * @param string $report_id Report id, e.g. `orders.by_date`.
	 * @return array|null `fields` and `params` (lists, or `*` for all), and `deviations` from the
	 *                    definition's semantics; null when the provider does not serve the report.
	 */
	public function get_capability( $report_id );

	/**
	 * Whether the provider's prerequisites for the request hold on this site.
	 *
	 * @param array $request The effective request.
	 * @return true|WP_Error A 503 error with a `reason` when a prerequisite is missing.
	 */
	public function check_ready( array $request );

	/**
	 * Serve the request.
	 *
	 * @param array $request The effective request.
	 * @return array|WP_Error `data`, `status`, `headers`, and optionally `generated_at`.
	 */
	public function run( array $request );
}
