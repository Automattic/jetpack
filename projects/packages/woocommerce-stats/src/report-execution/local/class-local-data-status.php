<?php
/**
 * Whether this store's WooCommerce Analytics data is complete and in the store's time zone.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\WooCommerce\Internal\Admin\Schedulers\OrdersScheduler;
use Automattic\WooCommerce\Internal\DataStores\Orders\OrdersTableDataStore;
use Automattic\WooCommerce\Utilities\OrderUtil;
use DateTimeImmutable;
use DateTimeZone;
use Exception;

/**
 * Compares a sample of the oldest and newest orders with their `wc_order_stats` rows, which core's
 * reports read. A sample, so a gap in the middle of the history goes unnoticed.
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
	 * A sampled row was imported under another time zone, so it sits in the wrong hour or day.
	 */
	const REIMPORT_NEEDED = 'reimport_needed';

	/**
	 * Orders taken from each end of the order history.
	 */
	const SAMPLE_SIZE = 25;

	/**
	 * Orders created or changed more recently than this may still be waiting in core's import queue.
	 */
	const IMPORT_GRACE = HOUR_IN_SECONDS;

	/**
	 * Transient prefix; the key also carries the time zone, so a zone change misses the cache.
	 */
	const CACHE_PREFIX = 'jetpack_woocommerce_stats_local_data_status_';

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

		$timezone = wp_timezone();
		$key      = self::CACHE_PREFIX . md5( $timezone->getName() );
		$cached   = get_transient( $key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$issues = $this->check_sample( $timezone );
		set_transient( $key, $issues, self::CACHE_TTL );

		return $issues;
	}

	/**
	 * Compare the sampled orders with their `wc_order_stats` rows.
	 *
	 * @param DateTimeZone $timezone The store's current time zone.
	 * @return string[]
	 */
	private function check_sample( DateTimeZone $timezone ) {
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
			return array();
		}

		$rows   = $this->get_stats_rows( $ids );
		$issues = array();
		foreach ( array_diff( $ids, array_keys( $rows ) ) as $id ) {
			if ( ! $this->is_left_out_of_import( $id ) ) {
				$issues[] = self::IMPORT_INCOMPLETE;
				break;
			}
		}

		$gmt = $this->get_gmt_dates( array_keys( $rows ) );
		foreach ( $rows as $id => $row ) {
			$pairs = array(
				array( $row['date_created'], $row['date_created_gmt'] ),
				array( $row['date_paid'], $gmt[ $id ]['date_paid'] ?? null ),
				array( $row['date_completed'], $gmt[ $id ]['date_completed'] ?? null ),
			);
			foreach ( $pairs as $pair ) {
				if ( self::was_imported_in_another_zone( $pair[0], $pair[1], $timezone ) ) {
					$issues[] = self::REIMPORT_NEEDED;
					break 2;
				}
			}
		}

		return $issues;
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
	 * The `wc_order_stats` rows of the orders.
	 *
	 * @param int[] $ids Order ids.
	 * @return array[] Rows by order id, with the four date columns.
	 */
	protected function get_stats_rows( array $ids ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Cached by get_issues().
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- One placeholder per id.
				"SELECT order_id, date_created, date_created_gmt, date_paid, date_completed FROM {$wpdb->prefix}wc_order_stats WHERE order_id IN (" . implode( ',', array_fill( 0, count( $ids ), '%d' ) ) . ')',
				$ids
			),
			ARRAY_A
		);

		$by_id = array();
		foreach ( is_array( $rows ) ? $rows : array() as $row ) {
			$by_id[ (int) $row['order_id'] ] = $row;
		}

		return $by_id;
	}

	/**
	 * The orders' paid and completed dates in GMT, which `wc_order_stats` holds only in local time.
	 *
	 * @param int[] $ids Order ids.
	 * @return array[] By order id: `date_paid` and `date_completed`, as GMT `Y-m-d H:i:s` or null.
	 */
	protected function get_gmt_dates( array $ids ) {
		global $wpdb;

		if ( empty( $ids ) ) {
			return array();
		}

		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
		$dates        = array();

		if ( class_exists( OrderUtil::class ) && OrderUtil::custom_orders_table_usage_is_enabled() ) {
			$table = OrdersTableDataStore::get_operational_data_table_name();
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Cached by get_issues().
			$rows = $wpdb->get_results(
				$wpdb->prepare(
					// phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- One placeholder per id.
					"SELECT order_id, date_paid_gmt, date_completed_gmt FROM {$table} WHERE order_id IN ({$placeholders})",
					$ids
				),
				ARRAY_A
			);
			foreach ( is_array( $rows ) ? $rows : array() as $row ) {
				$dates[ (int) $row['order_id'] ] = array(
					'date_paid'      => $row['date_paid_gmt'],
					'date_completed' => $row['date_completed_gmt'],
				);
			}

			return $dates;
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Cached by get_issues().
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				// phpcs:ignore WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- One placeholder per id.
				"SELECT post_id, meta_key, meta_value FROM {$wpdb->postmeta} WHERE post_id IN ({$placeholders}) AND meta_key IN ( '_date_paid', '_date_completed' )",
				$ids
			),
			ARRAY_A
		);
		foreach ( is_array( $rows ) ? $rows : array() as $row ) {
			// The legacy store keeps these as Unix timestamps.
			if ( is_numeric( $row['meta_value'] ) && (int) $row['meta_value'] > 0 ) {
				$dates[ (int) $row['post_id'] ][ ltrim( $row['meta_key'], '_' ) ] = gmdate( 'Y-m-d H:i:s', (int) $row['meta_value'] );
			}
		}

		return $dates;
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

	/**
	 * Whether a local date differs from its GMT date in the zone the store has now. Core writes the
	 * local dates in the zone of the import, until the order is saved or imported again.
	 *
	 * @param string|null  $local    The row's local date.
	 * @param string|null  $gmt      The same date in GMT.
	 * @param DateTimeZone $timezone The store's current time zone.
	 * @return bool
	 */
	private static function was_imported_in_another_zone( $local, $gmt, DateTimeZone $timezone ) {
		if ( empty( $local ) || empty( $gmt ) || 0 === strpos( $local, '0000-00-00' ) || 0 === strpos( $gmt, '0000-00-00' ) ) {
			return false;
		}

		try {
			$expected = ( new DateTimeImmutable( $gmt, new DateTimeZone( 'UTC' ) ) )->setTimezone( $timezone );
		} catch ( Exception $e ) {
			return false;
		}

		return $expected->format( 'Y-m-d H:i:s' ) !== $local;
	}
}
