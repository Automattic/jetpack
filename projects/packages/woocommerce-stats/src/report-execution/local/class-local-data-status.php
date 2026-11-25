<?php
/**
 * Whether this store's WooCommerce Analytics data is ready for local reports.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_REST_Request;

/**
 * Reads WooCommerce Analytics' own state: whether it is on, and its import status, as the Data
 * status on WooCommerce › Analytics › Settings shows it.
 *
 * @internal
 * @since $$next-version$$
 */
class Local_Data_Status {

	/**
	 * Core's import status route.
	 */
	const IMPORT_STATUS_ROUTE = '/wc-analytics/imports/status';

	/**
	 * Whether WooCommerce Analytics is off, so no local report can be served.
	 *
	 * @return bool
	 */
	public function is_analytics_off() {
		return true !== ( new Local_Report_Provider() )->check_ready();
	}

	/**
	 * Core's import status, as the current user may read it. The route arrived in WooCommerce 10.5,
	 * its failed import counts in 11.0; before those, there's no status and no failures to count.
	 *
	 * @return array|null `mode` (`immediate` or `scheduled`), `last_processed_date` and `next_scheduled`
	 *                    (store time, scheduled mode only), `failed_count` (orders Retry can reach) and
	 *                    `failed_overflow_count` (failures past core's cap, which only a full import
	 *                    recovers); null where core has no such route or the user may not read it.
	 */
	public function get_import_status() {
		// An error answer, such as a 404 or 403, carries no `mode`.
		$status = rest_do_request( new WP_REST_Request( 'GET', self::IMPORT_STATUS_ROUTE ) )->get_data();
		if ( ! is_array( $status ) || ! isset( $status['mode'] ) ) {
			return null;
		}

		return array(
			'mode'                  => (string) $status['mode'],
			'last_processed_date'   => isset( $status['last_processed_date'] ) ? (string) $status['last_processed_date'] : null,
			'next_scheduled'        => isset( $status['next_scheduled'] ) ? (string) $status['next_scheduled'] : null,
			'failed_count'          => (int) ( $status['failed_count'] ?? 0 ),
			'failed_overflow_count' => (int) ( $status['failed_overflow_count'] ?? 0 ),
		);
	}
}
