<?php
/**
 * Where a handler's answer departs from a report's semantics.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * Implemented by a `Report_Handler` known to break one of a report's semantics, such as grouping
 * by a fixed UTC offset where the report says `timezone => site`. One that doesn't implement it
 * declares none.
 *
 * @internal Not a stable contract yet: the signature changes in the next steps.
 *
 * @since $$next-version$$
 */
interface Report_Deviations {

	/**
	 * The handler's deviations from one report's semantics.
	 *
	 * @param Report_Definition $definition The report.
	 * @return array<string, string> Semantics key => what the handler does instead, such as `timezone => current_offset`.
	 */
	public function get_deviations( Report_Definition $definition );
}
