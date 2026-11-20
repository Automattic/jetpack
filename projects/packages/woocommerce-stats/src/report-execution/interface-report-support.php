<?php
/**
 * Whether a handler can serve one request's values.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * Implemented by a `Report_Handler` that refuses some values of the params it declares, such as a
 * range too long to serve. One that doesn't implement it supports every request it covers.
 *
 * @internal Not a stable contract yet: the signature changes in the next steps.
 *
 * @since $$next-version$$
 */
interface Report_Support {

	/**
	 * Whether the handler can serve this request. Checked before readiness, for a request naming a provider.
	 *
	 * @param Report_Request $request The request.
	 * @return true|WP_Error A 400 for a missing or malformed value, or a 422 for one the handler cannot serve.
	 */
	public function supports( Report_Request $request );
}
