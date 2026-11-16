<?php
/**
 * What a report handler serves, declared before it runs.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * Implemented by a `Report_Handler` that serves less than every field and param. One that
 * doesn't implement it serves everything.
 *
 * @internal Not a stable contract yet: the signature changes in the next steps.
 *
 * @since $$next-version$$
 */
interface Report_Capability {

	/**
	 * What the handler serves. A forced provider whose handler covers less is refused.
	 *
	 * @return array{fields: string[]|string, params: string[]|string} Summary fields and query params, each a list or `*` for all.
	 */
	public function get_capability();
}
