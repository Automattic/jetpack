<?php
/**
 * A source of report data: a name plus the readiness every handler under it shares.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * `local` (this store) or `remote` (WordPress.com).
 *
 * @since $$next-version$$
 */
interface Report_Provider {

	/**
	 * The provider's name, as the `execution` param and the response header name it.
	 *
	 * @return string
	 */
	public function get_name();

	/**
	 * Whether the provider can serve anything now, such as the connection for `remote`.
	 *
	 * @param Report_Query $query The request.
	 * @return true|WP_Error A 503 error with a `reason` when it cannot.
	 */
	public function check_ready( Report_Query $query );
}
