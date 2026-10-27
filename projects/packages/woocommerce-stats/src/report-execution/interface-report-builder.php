<?php
/**
 * A report as SQL over a store schema.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * What a shared builder looks like: it reads a `Report_Query`, takes its table and column names
 * from a schema adapter, and shapes the rows into the wpcom report shape.
 *
 * @since $$next-version$$
 */
interface Report_Builder {

	/**
	 * What the builder can serve: `fields`, `params` and `deviations`, as a handler declares them.
	 *
	 * @return array
	 */
	public function get_capability();

	/**
	 * Params the builder cannot run without.
	 *
	 * @return string[] Normalized param names, e.g. `from`.
	 */
	public function required_params();

	/**
	 * The prepared SQL for a request.
	 *
	 * @param Report_Query     $query  The request.
	 * @param Local_Woo_Schema $schema Table and column names.
	 * @return string
	 */
	public function build_sql( Report_Query $query, Local_Woo_Schema $schema );

	/**
	 * The response body from the rows the SQL returned.
	 *
	 * @param array[] $rows Rows, as associative arrays.
	 * @return array `summary` and `data`.
	 */
	public function shape( array $rows );
}
