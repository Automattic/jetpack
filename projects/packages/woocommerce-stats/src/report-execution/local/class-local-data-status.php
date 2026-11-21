<?php
/**
 * Whether this store's WooCommerce Analytics data is ready for local reports.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\WooCommerce\Internal\Admin\Schedulers\OrdersScheduler;
use Automattic\WooCommerce\Internal\DataStores\Orders\OrdersTableDataStore;
use Automattic\WooCommerce\Utilities\OrderUtil;

/**
 * Checks a sample of the oldest and newest orders for a `wc_order_stats` row, which core's reports
 * read. A sample, so a gap in the middle of the history goes unnoticed.
 *
 * @internal
 * @since $$next-version$$
 */
class Local_Data_Status {

	/**
	 * WooCommerce Analytics is off, so no local report can be served.
	 */
	const ANALYTICS_OFF = 'analytics_off';

	/**
	 * A sampled order has no `wc_order_stats` row: neither source has it until core imports it.
	 */
	const IMPORT_INCOMPLETE = 'import_incomplete';

	/**
	 * Orders taken from each end of the order history.
	 */
	const SAMPLE_SIZE = 25;

	/**
	 * Orders created or changed more recently than this may still be waiting in core's import queue.
	 */
	const IMPORT_GRACE = HOUR_IN_SECONDS;

	/**
	 * Transient holding the last result.
	 */
	const CACHE_KEY = 'jetpack_woocommerce_stats_local_data_status';

	/**
	 * How long a result is kept.
	 */
	const CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * The problems found, most severe first.
	 *
	 * @return string[] Zero or more of the class constants.
	 */
	public function get_issues() {
		if ( true !== ( new Local_Report_Provider() )->check_ready() ) {
			return array( self::ANALYTICS_OFF );
		}

		$cached = get_transient( self::CACHE_KEY );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$issues = $this->is_import_complete() ? array() : array( self::IMPORT_INCOMPLETE );
		set_transient( self::CACHE_KEY, $issues, self::CACHE_TTL );

		return $issues;
	}

	/**
	 * Whether every sampled order past the grace period has a `wc_order_stats` row, or is left out
	 * on purpose.
	 *
	 * @return bool
	 */
	private function is_import_complete() {
		$cutoff = gmdate( 'Y-m-d H:i:s', time() - self::IMPORT_GRACE );
		$ids    = array_keys(
			array_filter(
				$this->get_sample_orders(),
				static function ( $modified ) use ( $cutoff ) {
					return (string) $modified < $cutoff;
				}
			)
		);
		if ( empty( $ids ) ) {
			return true;
		}

		foreach ( array_diff( $ids, $this->get_imported_ids( $ids ) ) as $id ) {
			if ( ! $this->is_left_out_of_import( $id ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * The oldest and newest orders created before the import grace period. One query per status
	 * and direction, each a range of the orders table's type, status and date index.
	 *
	 * @return string[] When each order last changed, in GMT, by order id.
	 */
	protected function get_sample_orders() {
		global $wpdb;

		if ( ! function_exists( 'wc_get_order_statuses' ) ) {
			return array();
		}

		if ( class_exists( OrderUtil::class ) && OrderUtil::custom_orders_table_usage_is_enabled() ) {
			$table   = OrdersTableDataStore::get_orders_table_name();
			$columns = array( 'id', 'type', 'status', 'date_created_gmt', 'date_updated_gmt' );
			$cutoff  = gmdate( 'Y-m-d H:i:s', time() - self::IMPORT_GRACE );
		} else {
			$table   = $wpdb->posts;
			$columns = array( 'ID', 'post_type', 'post_status', 'post_date', 'post_modified_gmt' );
			$cutoff  = wp_date( 'Y-m-d H:i:s', time() - self::IMPORT_GRACE );
		}
		list( $id, $type, $status, $date, $modified ) = $columns;

		$found = array();
		// Core's reports leave out checkout drafts, which WooCommerce Blocks registers as a status.
		foreach ( array_diff( array_keys( wc_get_order_statuses() ), array( 'wc-checkout-draft' ) ) as $order_status ) {
			foreach ( array( 'ASC', 'DESC' ) as $direction ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Cached by get_issues().
				$rows = $wpdb->get_results(
					$wpdb->prepare(
						// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table and column names are fixed above.
						"SELECT {$id} AS id, {$date} AS date, {$modified} AS modified FROM {$table} WHERE {$type} = 'shop_order' AND {$status} = %s AND {$date} < %s ORDER BY {$date} {$direction} LIMIT %d",
						$order_status,
						$cutoff,
						self::SAMPLE_SIZE
					),
					ARRAY_A
				);
				foreach ( is_array( $rows ) ? $rows : array() as $row ) {
					$found[ (int) $row['id'] ] = $row;
				}
			}
		}

		uasort(
			$found,
			static function ( $a, $b ) {
				return strcmp( $a['date'], $b['date'] );
			}
		);
		$sample = array_slice( $found, 0, self::SAMPLE_SIZE, true ) + array_slice( $found, -self::SAMPLE_SIZE, null, true );

		return array_map(
			static function ( $row ) {
				return (string) $row['modified'];
			},
			$sample
		);
	}

	/**
	 * The orders that have a `wc_order_stats` row.
	 *
	 * @param int[] $ids Order ids.
	 * @return int[]
	 */
	protected function get_imported_ids( array $ids ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Cached by get_issues().
		$imported = $wpdb->get_col(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- One placeholder per id.
				"SELECT order_id FROM {$wpdb->prefix}wc_order_stats WHERE order_id IN (" . implode( ',', array_fill( 0, count( $ids ), '%d' ) ) . ')',
				$ids
			)
		);

		return array_map( 'intval', is_array( $imported ) ? $imported : array() );
	}

	/**
	 * Whether core leaves the order out of its import on purpose: a test-mode payment, or an order
	 * the `woocommerce_analytics_orders_import_where_clauses` filter excludes.
	 *
	 * @param int $id Order id.
	 * @return bool
	 */
	protected function is_left_out_of_import( $id ) {
		// @phan-suppress-next-line PhanUndeclaredClassReference, PhanUndeclaredClassMethod -- WooCommerce 11.4+, not in the stubs; guarded.
		if ( method_exists( OrdersScheduler::class, 'is_excluded_from_import' ) && true === OrdersScheduler::is_excluded_from_import( (int) $id ) ) {
			return true;
		}

		// @phan-suppress-next-line PhanUndeclaredClassReference -- WooCommerce internal, not in the stubs; guarded.
		if ( ! method_exists( OrdersScheduler::class, 'is_test_order' ) || ! function_exists( 'wc_get_order' ) ) {
			return false;
		}

		$order = wc_get_order( $id );

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- WooCommerce internal, not in the stubs; guarded above.
		return $order && OrdersScheduler::is_test_order( $order );
	}
}
