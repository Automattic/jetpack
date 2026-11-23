<?php
/**
 * What one handler needs on this site, beyond its provider.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * Implemented by a `Report_Handler` with its own prerequisites, such as the WooCommerce code it
 * calls. Checked after its provider's `check_ready()`, for a request naming a provider.
 *
 * @internal Not a stable contract yet: the signature changes in the next steps.
 *
 * @since $$next-version$$
 */
interface Report_Readiness {

	/**
	 * Whether the handler can serve anything now.
	 *
	 * @return true|WP_Error A 503 error when it cannot.
	 */
	public function check_ready();
}
