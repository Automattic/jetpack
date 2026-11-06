<?php
/**
 * The store's WooCommerce Analytics tables, as a builder reads them.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * Table and column names, and the order statuses Analytics leaves out, on this store. A schema for
 * WordPress.com's synced tables would answer the same questions there.
 *
 * @since $$next-version$$
 */
class Local_Woo_Schema {

	/**
	 * The statuses WooCommerce leaves out when the store saved none.
	 */
	const DEFAULT_EXCLUDED_STATUSES = array( 'pending', 'cancelled', 'failed' );

	/**
	 * The order stats table.
	 *
	 * @return string
	 */
	public function order_stats_table() {
		global $wpdb;

		return $wpdb->prefix . 'wc_order_stats';
	}

	/**
	 * The column a report's range applies to: the creation date, in store time.
	 *
	 * @return string
	 */
	public function order_date_column() {
		return 'date_created';
	}

	/**
	 * Order statuses Analytics leaves out, as the stats table stores them (`wc-pending`, `wc-trash`),
	 * the way core's report data store builds and normalizes the list.
	 *
	 * @return string[]
	 */
	public function excluded_statuses() {
		$saved    = get_option( 'woocommerce_excluded_report_order_statuses', self::DEFAULT_EXCLUDED_STATUSES );
		$statuses = array_merge( array( 'auto-draft', 'trash' ), is_array( $saved ) ? $saved : self::DEFAULT_EXCLUDED_STATUSES );

		/** This filter is documented in WooCommerce's Admin\API\Reports\DataStore. */
		$statuses = apply_filters( 'woocommerce_analytics_excluded_order_statuses', $statuses );
		// The checkout block adds this through the filter above; a store without the block has none to count anyway.
		$statuses = array_merge( is_array( $statuses ) ? $statuses : array(), array( 'checkout-draft' ) );

		// Core prefixes every status and cuts it to the column's 20 characters, or long slugs never match.
		return array_values(
			array_unique(
				array_map(
					static fn( $status ) => mb_substr( 'wc-' . trim( $status ), 0, 20 ),
					array_filter( $statuses, 'is_string' )
				)
			)
		);
	}

	/**
	 * Whether the order stats table exists.
	 *
	 * @return bool
	 */
	public function is_available() {
		global $wpdb;

		$table = $this->order_stats_table();

		return $table === $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- A one-off existence check.
	}
}
