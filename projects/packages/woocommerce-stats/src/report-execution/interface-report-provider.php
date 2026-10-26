<?php
/**
 * A source that can serve store reports.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * Declares the reports it serves, whether it can serve them now, and serves them in the wpcom report shape.
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
	 * Whether the provider declares the report.
	 *
	 * @param string $route Report route below `analytics/reports/`, e.g. `orders/by-date`.
	 * @return bool
	 */
	public function supports( $route );

	/**
	 * Whether the provider's prerequisites for the report hold on this site.
	 *
	 * @param string $route Report route.
	 * @return true|WP_Error A 503 error with a `reason` when a prerequisite is missing.
	 */
	public function check_ready( $route );

	/**
	 * Serve the report.
	 *
	 * @param string $route  Report route.
	 * @param array  $params Report query params, without the `execution` override.
	 * @return array|WP_Error `data`, `status`, `headers`, and optionally `generated_at` and `unsupported_fields`.
	 */
	public function run( $route, array $params );
}
