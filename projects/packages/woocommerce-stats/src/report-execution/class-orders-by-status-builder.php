<?php
/**
 * Sample builder: order counts and net sales by status.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * `orders.by_status`: one SQL query over the order stats table, with no WordPress.com side. A sample
 * of what a shared builder looks like, not a report the dashboard uses.
 *
 * @since $$next-version$$
 */
class Orders_By_Status_Builder implements Report_Builder {

	/**
	 * {@inheritDoc}
	 */
	public function get_capability() {
		return array(
			'fields'     => array( 'orders_no', 'net_total' ),
			'params'     => array( 'from', 'to' ),
			'deviations' => array(),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public function required_params() {
		return array( 'from', 'to' );
	}

	/**
	 * Orders created in the range, grouped by status: refunds are not counted as orders but their
	 * negative totals are summed, as core's net revenue does.
	 *
	 * @param Report_Query     $query  The request.
	 * @param Local_Woo_Schema $schema Table and column names.
	 * @return string
	 */
	public function build_sql( Report_Query $query, Local_Woo_Schema $schema ) {
		global $wpdb;

		$table    = $schema->order_stats_table();
		$column   = $schema->order_date_column();
		$excluded = $schema->excluded_statuses();

		// Table and column names come from the schema adapter, never from the request.
		$sql = "SELECT status, SUM( parent_id = 0 ) AS orders_no, SUM(net_total) AS net_total
			FROM {$table}
			WHERE {$column} <> '0000-00-00 00:00:00'
				AND {$column} >= %s AND {$column} <= %s
				AND status NOT IN ( " . implode( ', ', array_fill( 0, count( $excluded ), '%s' ) ) . ' )
			GROUP BY status
			ORDER BY orders_no DESC, status ASC';

		return $wpdb->prepare( $sql, array_merge( array( str_replace( 'T', ' ', $query->from ), str_replace( 'T', ' ', $query->to ) ), $excluded ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Prepared here; only schema names are interpolated.
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param array[] $rows Rows, as associative arrays.
	 */
	public function shape( array $rows ) {
		$data = array_map(
			static fn( $row ) => array(
				'status'    => preg_replace( '/^wc-/', '', $row['status'] ),
				'orders_no' => (int) $row['orders_no'],
				'net_total' => (float) $row['net_total'],
			),
			$rows
		);

		return array(
			'summary' => array(
				'orders_no' => array_sum( array_column( $data, 'orders_no' ) ),
				'net_total' => array_sum( array_column( $data, 'net_total' ) ),
			),
			'data'    => $data,
		);
	}
}
