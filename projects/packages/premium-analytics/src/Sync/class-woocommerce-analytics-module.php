<?php
/**
 * TEMPORARY: interim port for WOOA7S-1550 — remove when the shared sync-modules composer package lands.
 *
 * Ported (near-verbatim) from woocommerce-analytics'
 * src/Internal/Jetpack/Sync/Modules/Analytics.php so the monorepo package can register the
 * `woocommerce_analytics` full-sync module and unblock end-to-end sync testing for the
 * connection flow (WOOA7S-1549). name() intentionally stays 'woocommerce_analytics' — the JS
 * site-sync and {@see Sync_Status_Tracker} both target the module by that exact key.
 *
 * WooCommerce is a runtime (not composer) dependency. The WC classes/traits referenced here
 * resolve via WooCommerce's autoloader at runtime; registration is guarded so this class is only
 * instantiated when WooCommerce is active (see {@see Configuration::register()}).
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\Jetpack\Sync\Modules\Module as JetpackSyncModule;
use Automattic\Jetpack\Sync\Modules\WooCommerce_HPOS_Orders;
use Automattic\WooCommerce\Admin\API\Reports\Coupons\DataStore as CouponsDataStore;
use Automattic\WooCommerce\Admin\API\Reports\Orders\Stats\DataStore as OrderStatsDataStore;
use Automattic\WooCommerce\Enums\OrderInternalStatus;
use Automattic\WooCommerce\Internal\Fulfillments\FulfillmentUtils;
use Automattic\WooCommerce\Internal\Traits\OrderAttributionMeta;
use Automattic\WooCommerce\Utilities\FeaturesUtil;
use Automattic\WooCommerce\Utilities\OrderUtil;
use WC_Abstract_Order;
use WC_Coupon;
use WC_Order;
use WC_Order_Factory;
use WC_Tax;

defined( 'ABSPATH' ) || exit;

/**
 * WooCommerce Analytics Module class.
 */
class WooCommerce_Analytics_Module extends JetpackSyncModule {

	use Utilities;
	// @phan-suppress-next-line PhanUndeclaredTrait -- Provided by WooCommerce at runtime; absent from the older WooCommerce stubs used by the "old Woo" Phan job.
	use OrderAttributionMeta;

	/**
	 * Get the module name.
	 *
	 * @return string
	 */
	public function name() {
		return 'woocommerce_analytics';
	}

	/**
	 * Get the ID field for the module.
	 *
	 * @return string
	 */
	public function id_field() {
		return 'order_id';
	}

	/**
	 * Get the table in the database.
	 *
	 * @return string
	 */
	public function table() {
		global $wpdb;
		return $wpdb->prefix . 'wc_order_stats';
	}

	/**
	 * Init listeners.
	 *
	 * @param callable $handler Action handler callable.
	 *
	 * @return void
	 */
	public function init_listeners( $handler ) {
		// Actions to update order stats.
		add_action( 'woocommerce_analytics_delete_order_stats', array( $this, 'sync_deleted_analytics_data' ) );

		// In WooCommerce 10.3+ the new action is available.
		if ( defined( 'WC_VERSION' ) && version_compare( WC_VERSION, '10.3', '>=' ) ) {
			add_action( 'woocommerce_order_scheduler_after_import_order', array( $this, 'sync_analytics_reports_data' ) );
		} else {
			add_action( 'woocommerce_analytics_update_order_stats', array( $this, 'sync_analytics_reports_data' ) );
		}

		// Sync actions.
		add_action( 'woocommerce_analytics_sync_reports_data', $handler );
		add_action( 'woocommerce_analytics_delete_reports_data', $handler );

		// Expand data.
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_analytics_sync_reports_data', array( $this, 'expand_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_analytics_delete_reports_data', array( $this, 'expand_data' ) );
	}

	/**
	 * Expand order stats data and attribution data.
	 *
	 * @param array $args List of arguments.
	 *
	 * @return array|false
	 */
	public function expand_data( $args ) {
		if ( ! is_array( $args ) || ! isset( $args[0] ) ) {
			return false;
		}

		$data = $args[0];

		return $data;
	}

	/**
	 * Init full sync listeners.
	 *
	 * @param callable $handler Action handler callable.
	 *
	 * @return void
	 */
	public function init_full_sync_listeners( $handler ) {
		add_action( 'jetpack_full_sync_woocommerce_analytics', $handler );
	}

	/**
	 * Get full sync actions.
	 *
	 * @return string[] The full sync actions.
	 */
	public function get_full_sync_actions() {
		return array( 'jetpack_full_sync_woocommerce_analytics' );
	}

	/**
	 * Get the supported object types.
	 *
	 * @return array The supported object types.
	 */
	private function get_supported_object_types() {
		return array( 'order', 'order_tax_lookup', 'order_product_lookup', 'order_coupon_lookup' );
	}

	/**
	 * Retrieves multiple orders data by their ID.
	 *
	 * @param string $object_type Type of object to retrieve. Should be `order`.
	 * @param array  $ids         List of order IDs.
	 *
	 * @return array
	 */
	public function get_objects_by_id( $object_type, $ids ) {
		if ( empty( $ids ) || ! is_array( $ids ) || empty( $object_type ) ) {
			return array();
		}

		if ( ! in_array( $object_type, $this->get_supported_object_types(), true ) ) {
			return array();
		}

		$orders = wc_get_orders(
			array(
				'post__in'    => $ids,
				'post_status' => WooCommerce_HPOS_Orders::get_all_possible_order_status_keys(),
				'limit'       => -1,
				'orderby'     => 'id',
				'order'       => 'DESC',
			)
		);

		// Get the order stats data for the orders.
		$order_stats_items = $this->get_order_stats_items( $ids );
		$order_stats_data  = array();
		if ( ! empty( $order_stats_items ) ) {
			$order_stats_data = array_column( $order_stats_items, null, 'order_id' );
		}

		$orders_data     = array();
		$found_order_ids = array();
		foreach ( $orders as $order ) {
			$order_id                 = $order->get_id();
			$found_order_ids[]        = $order_id;
			$orders_data[ $order_id ] = $this->build_woocommerce_analytics_reports_data( $order );
			if ( 'order' === $object_type ) {
				// Sync everything if the object type is order.
				$orders_data[ $order_id ] = $this->build_woocommerce_analytics_reports_data( $order );
			} else {
				$orders_data[ $order_id ] = $this->build_woocommerce_analytics_reports_lookup_data( $order, $object_type );
			}
			if ( isset( $order_stats_data[ $order_id ] ) ) {
				$this->do_order_status_discrepancy_check( $order, $order_stats_data[ $order_id ] );
			}
		}

		// Check for missing order_ids in wc_order_stats table for orders that were not found.
		$missing_order_ids = array_diff( $ids, $found_order_ids );

		/**
		 * Trigger missing orders detected action.
		 *
		 * @param array $missing_order_ids The missing order IDs.
		 */
		do_action( 'woocommerce_analytics_missing_orders_detected', $missing_order_ids );

		foreach ( $missing_order_ids as $missing_order_id ) {
			if ( 'order' === $object_type ) {
				$orders_data[ $missing_order_id ] = $this->build_woocommerce_analytics_reports_data( $missing_order_id );
			} else {
				$orders_data[ $missing_order_id ] = $this->build_woocommerce_analytics_reports_lookup_data( $missing_order_id, $object_type );
			}
		}
		// Let's sort the orders by ID in descending order. This is useful for the full sync to ensure that the latest orders are processed first.
		krsort( $orders_data, SORT_NUMERIC );
		return $orders_data;
	}

	/**
	 * Retrieve the analytics order data by its ID.
	 *
	 * @param string $object_type Type of the sync object.
	 * @param int    $id          ID of the sync object.
	 * @return mixed Object, or false if the object is invalid.
	 */
	public function get_object_by_id( $object_type, $id ) {
		if ( ! in_array( $object_type, $this->get_supported_object_types(), true ) ) {
			return false;
		}

		$order = wc_get_order( $id );

		if ( ! $order instanceof WC_Abstract_Order ) {
			$order = $id; // If the order does not exists. We'll check if the order_id exists in wc_order_stats table.
		}

		if ( 'order' === $object_type ) {
			return $this->build_woocommerce_analytics_reports_data( $order );
		}

		return $this->build_woocommerce_analytics_reports_lookup_data( $order, $object_type );
	}

	/**
	 * Enqueue full sync actions.
	 *
	 * @param array   $config               Full sync configuration.
	 * @param int     $max_items_to_enqueue Maximum number of items to enqueue.
	 * @param boolean $state                True if full sync has finished enqueueing this module.
	 * @return array Number of actions enqueued, and next module state.
	 */
	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		return $this->enqueue_all_ids_as_action(
			'jetpack_full_sync_woocommerce_analytics',
			$this->table(),
			$this->id_field(),
			$this->get_where_sql( $config ),
			$max_items_to_enqueue,
			$state
		);
	}

	/**
	 * Estimate full sync actions.
	 *
	 * @param array $config Full sync configuration.
	 * @return int Number of items yet to be enqueued.
	 */
	public function estimate_full_sync_actions( $config ) {
		global $wpdb;

		$query = "SELECT COUNT(*) FROM {$this->table()}";

		$where_sql = $this->get_where_sql( $config );
		if ( $where_sql ) {
			$query .= ' WHERE ' . $where_sql;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = (int) $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	/**
	 * Get where SQL clause for the module.
	 *
	 * @param array $config Full sync configuration.
	 * @return string
	 */
	public function get_where_sql( $config ) {
		global $wpdb;

		$where = '1=1';

		if ( ! empty( $config['start_date'] ) ) {
			$where .= $wpdb->prepare( ' AND date_created >= %s', $config['start_date'] );
		}
		if ( ! empty( $config['end_date'] ) ) {
			$where .= $wpdb->prepare( ' AND date_created <= %s', $config['end_date'] );
		}

		/**
		 * Filter the WHERE SQL for analytics full sync
		 *
		 * @param string $where The WHERE SQL clause
		 * @param array  $config The sync configuration
		 */
		return apply_filters( 'woocommerce_analytics_full_sync_where_sql', $where, $config );
	}

	/**
	 * Initialize module in the sender.
	 */
	public function init_before_send() {
		// Full sync.
		add_filter(
			'jetpack_sync_before_send_jetpack_full_sync_woocommerce_analytics',
			array( $this, 'build_full_sync_action_array' )
		);
	}

	/**
	 * Build the full sync action object.
	 *
	 * @param array $args An array with filtered objects and previous end.
	 *
	 * @return array An array with orders and previous end.
	 */
	public function build_full_sync_action_array( $args ) {
		list( $filtered_orders, $previous_end ) = $args;
		return array(
			'orders'       => $filtered_orders['objects'],
			'previous_end' => $previous_end,
		);
	}

	/**
	 * Given the Module Configuration and Status return the next chunk of items to send.
	 * This function also expands the posts and metadata and filters them based on the maximum size constraints.
	 *
	 * @param array $config This module Full Sync configuration.
	 * @param array $status This module Full Sync status.
	 * @param int   $chunk_size Chunk size.
	 *
	 * @return array
	 */
	public function get_next_chunk( $config, $status, $chunk_size ) {

		$order_ids = parent::get_next_chunk( $config, $status, $chunk_size );

		if ( empty( $order_ids ) ) {
			return array();
		}

		$orders = $this->get_objects_by_id( 'order', $order_ids );

		// If no orders were fetched, make sure to return the expected structure so that status is updated correctly.
		if ( empty( $orders ) ) {
			return array(
				'object_ids' => $order_ids,
				'objects'    => array(),
			);
		}

		// Filter the orders based on the maximum size constraints.
		list( $filtered_order_ids, $filtered_orders, ) = $this->filter_analytics_objects_by_size( $orders );

		return array(
			'object_ids' => $filtered_order_ids,
			'objects'    => $filtered_orders,
		);
	}

	/**
	 * Filters objects and metadata based on maximum size constraints.
	 * It always allows the first object with its metadata, even if they exceed the limit.
	 *
	 * @param array $objects The array of objects to filter.
	 *
	 * @return array An array containing the filtered object IDsand  filtered objects
	 */
	public function filter_analytics_objects_by_size( $objects ) {
		$filtered_objects    = array();
		$filtered_object_ids = array();
		$current_size        = 0;

		foreach ( $objects as $key => $value ) {
			$object_size = strlen( maybe_serialize( $value ) );

			// Always allow the first object.
			if ( empty( $filtered_object_ids ) || ( $current_size + $object_size ) <= self::MAX_SIZE_FULL_SYNC ) {
				$filtered_object_ids[]    = $key;
				$filtered_objects[ $key ] = $value;
				$current_size            += $object_size;
			} else {
				break;
			}
		}

		return array(
			$filtered_object_ids,
			$filtered_objects,
		);
	}

	/**
	 * Handle Sync analytics reports data.
	 *
	 * @param int $order_id The order ID.
	 * @return void
	 */
	public function sync_analytics_reports_data( $order_id ) {

		$data = $this->get_object_by_id( 'order', $order_id );

		if ( ! $data ) {
			return;
		}

		/**
		 * Trigger the action to sync the reports data.
		 *
		 * @param array $data Analytics reports sync data.
		 */
		do_action( 'woocommerce_analytics_sync_reports_data', $data );
	}

	/**
	 * Handle syncing of analytics deletion data.
	 *
	 * @param int $order_id The order ID.
	 * @return void
	 */
	public function sync_deleted_analytics_data( $order_id ) {
		if ( empty( $order_id ) ) {
			return;
		}

		$data = array(
			'id' => $order_id,
		);

		/**
		 * Filter the deletion data before syncing.
		 *
		 * @param array    $data The deletion data.
		 * @param WC_Order $order The order object.
		 */
		$data = apply_filters( 'woocommerce_analytics_deletion_data', $data );

		/**
		 * Trigger the action to sync the deletion.
		 *
		 * @param array $data The deletion sync data.
		 */
		do_action( 'woocommerce_analytics_delete_reports_data', $data );
	}

	/**
	 * Build the WooCommerce analytics reports data.
	 *
	 * @param mixed $order The order ID or the WC_Order object.
	 * @return array The reports data.
	 */
	protected function build_woocommerce_analytics_reports_data( $order ) {
		$data_types = array(
			'order_stats'            => $this->get_order_stats_data( $order ),
			'order_attribution_data' => $this->get_order_attribution_data( $order ),
			'order_product_data'     => $this->get_order_product_data( $order ),
			'order_coupon_data'      => $this->get_order_coupon_data( $order ),
			'order_tax_data'         => $this->get_order_tax_data( $order ),
		);

		$reports_data = array_filter( $data_types );

		/**
		 * Filter the reports data before syncing.
		 *
		 * @param array $data The reports data.
		 * @param WC_Order $order The order object.
		 */
		return apply_filters( 'woocommerce_analytics_reports_data', $reports_data, $order );
	}

	/**
	 * Build the WooCommerce analytics reports data for lookup tables.
	 *
	 * @param mixed  $order The order ID or the WC_Order object.
	 * @param string $object_type The object type.
	 * @return array The reports data.
	 */
	protected function build_woocommerce_analytics_reports_lookup_data( $order, $object_type ) {
		$report_data = array();
		switch ( $object_type ) {
			case 'order_product_lookup':
				$report_data['order_product_data'] = $this->get_order_product_data( $order );
				break;
			case 'order_coupon_lookup':
				$report_data['order_coupon_data'] = $this->get_order_coupon_data( $order );
				break;
			case 'order_tax_lookup':
				$report_data['order_tax_data'] = $this->get_order_tax_data( $order );
				break;
		}

		/**
		 * Filter the reports lookup data before syncing.
		 *
		 * @param array $data The reports lookup data.
		 * @param WC_Order $order The order object.
		 * @param string $object_type The object type.
		 */
		return apply_filters( 'woocommerce_analytics_reports_lookup_data', $report_data, $order, $object_type );
	}

	/**
	 * Get order attribution data.
	 *
	 * @param mixed $order The order ID or the WC_Order object.
	 * @return array|bool The order attribution data or false if the order is invalid.
	 */
	protected function get_order_attribution_data( $order ) {
		if ( is_numeric( $order ) ) {
			$order = wc_get_order( $order );
		}

		if ( ! $order ) {
			return false;
		}

		$this->set_fields_and_prefix();
		$order_id     = $order->get_id();
		$type         = $order->get_type();
		$allowed_keys = array(
			'utm_campaign',
			'utm_source',
			'utm_medium',
			'utm_content',
			'utm_term',
			'utm_source_platform',
			'origin',
			'device_type',
			'source_type',
		);

		if ( 'shop_order_refund' === $type && ! empty( $order->get_parent_id() ) ) {
			$order_object_to_use = wc_get_order( $order->get_parent_id() );
		} else {
			$order_object_to_use = $order;
		}

		$attribution_data = array(
			'order_id' => $order_id,
		);

		foreach ( $allowed_keys as $key ) {
			$meta_key                 = $this->get_meta_prefixed_field_name( $key );
			$attribution_data[ $key ] = $order_object_to_use->get_meta( $meta_key, true );
		}

		return $attribution_data;
	}

	/**
	 * Handler order stats update.
	 *
	 * @param mixed $order The order ID or the WC_Order object.
	 * @return array|bool The order attribution data or false if the order stats item does not exist.
	 */
	protected function get_order_stats_data( $order ) {
		if ( is_numeric( $order ) ) {
			$order_id = $order;
			$order    = wc_get_order( $order );
		} elseif ( $order instanceof WC_Abstract_Order ) {
			$order_id = $order->get_id();
		} else {
			return false;
		}

		// If the order does not exit, check if the stats item is present in the wc_order_stats table.
		if ( ! $order ) {
			$order_stats_data_from_db = $this->get_order_stats_data_from_db( $order_id );
			return $order_stats_data_from_db;
		}

		$order_fulfillment_status = null;
		// @phan-suppress-next-line PhanUndeclaredStaticMethod -- Guarded by is_callable(); absent from the older WooCommerce stubs used by the "old Woo" Phan job.
		if ( is_callable( array( OrderStatsDataStore::class, 'has_fulfillment_status_column' ) ) && OrderStatsDataStore::has_fulfillment_status_column() ) {
			$order_stats_item         = $this->get_order_stats_item( $order->get_id() );
			$order_fulfillment_status = $order_stats_item['fulfillment_status'] ?? null;
		} elseif ( is_callable( array( FulfillmentUtils::class, 'get_order_fulfillment_status' ) ) && $order instanceof WC_Order ) {
			$fulfillment_status       = FulfillmentUtils::get_order_fulfillment_status( $order );
			$order_fulfillment_status = 'no_fulfillments' !== $fulfillment_status ? $fulfillment_status : null;
		}

		$order_stats_data = array(
			'order_id'           => $order->get_id(),
			'parent_id'          => $order->get_parent_id(),
			'date_created'       => self::datetime_to_object( $order->get_date_created() ),
			'date_paid'          => self::datetime_to_object( $order->get_date_paid() ),
			'date_completed'     => self::datetime_to_object( $order->get_date_completed() ),
			'num_items_sold'     => self::get_num_items_sold( $order ),
			'total_sales'        => $order->get_total(),
			'tax_total'          => $order->get_total_tax(),
			'total_fees'         => $order->get_total_fees(),
			'total_fees_tax'     => self::get_total_fees_tax( $order ),
			'shipping_total'     => $order->get_shipping_total(),
			'shipping_tax'       => $order->get_shipping_tax(),
			'discount_total'     => $order->get_discount_total(),
			'discount_tax'       => $order->get_discount_tax(),
			'net_total'          => self::get_net_total( $order ),
			'returning_customer' => $order->is_returning_customer(),
			'status'             => self::normalize_order_status( $order->get_status() ),
			'customer_id'        => $order->get_report_customer_id(),
			'fulfillment_status' => $order_fulfillment_status,
		);

		if ( 'shop_order_refund' === $order->get_type() ) {
			$parent_order = wc_get_order( $order->get_parent_id() );
			if ( $parent_order ) {
				$order_stats_data['parent_id'] = $parent_order->get_id();

				$refund_type = $order->get_meta( '_refund_type' );
				// @phan-suppress-next-line PhanUndeclaredStaticMethod -- Absent from the older WooCommerce stubs used by the "old Woo" Phan job.
				if ( 'full' === $refund_type && OrderUtil::uses_new_full_refund_data() ) {
					$order_stats_data['tax_total']      = -1 * $parent_order->get_total_tax();
					$order_stats_data['num_items_sold'] = -1 * self::get_num_items_sold( $parent_order );
					$order_stats_data['net_total']      = -1 * self::get_net_total( $parent_order );
					$order_stats_data['shipping_total'] = -1 * (float) $parent_order->get_shipping_total();
				}
			}
			/**
			 * Set date_completed and date_paid the same as date_created to avoid problems
			 * when they are being used to sort the data, as refunds don't have them filled
			 */
			$date_created_gmt                   = self::datetime_to_object( $order->get_date_created() );
			$order_stats_data['date_completed'] = $date_created_gmt;
			$order_stats_data['date_paid']      = $date_created_gmt;
		}

		return $order_stats_data;
	}

	/**
	 * Calculation methods.
	 */

	/**
	 * Get number of items sold among all orders.
	 *
	 * @param WC_Order $order WC_Order object.
	 * @return int
	 */
	protected static function get_num_items_sold( $order ) {
		$num_items = 0;

		$line_items = $order->get_items( 'line_item' );
		foreach ( $line_items as $line_item ) {
			$num_items += $line_item->get_quantity();
		}

		return $num_items;
	}

	/**
	 * Get the net amount from an order without shipping, tax, or refunds.
	 *
	 * @param WC_Order $order WC_Order object.
	 * @return float
	 */
	protected static function get_net_total( $order ) {
		$net_total = floatval( $order->get_total() ) - floatval( $order->get_total_tax() ) - floatval( $order->get_shipping_total() );
		return $net_total;
	}

	/**
	 * Get the total fees tax from an order.
	 *
	 * @param WC_Order $order WC_Order object.
	 * @return float
	 */
	protected static function get_total_fees_tax( $order ) {
		$total_fees_tax = array_sum(
			array_map(
				function ( $item ) {
					return $item->get_total_tax();
				},
				array_values( $order->get_items( 'fee' ) )
			)
		);

		return $total_fees_tax;
	}

	/**
	 * Get the order stats row for a given order ID.
	 *
	 * @param int $order_id The order ID.
	 * @return array|null|void Database query result in format specified by $output or null on failure.
	 */
	private function get_order_stats_item( $order_id ) {
		global $wpdb;

		$query = $wpdb->prepare(
			"SELECT * FROM {$this->table()} WHERE order_id = %d", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$order_id
		);

		return $wpdb->get_row( $query, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Get the order stats rows for a given order IDs.
	 *
	 * @param array $order_ids The order IDs.
	 * @return array|null Database query result in format specified by $output or null on failure.
	 */
	private function get_order_stats_items( $order_ids ) {
		global $wpdb;

		$placeholders = implode( ',', array_fill( 0, count( $order_ids ), '%d' ) );
		$query        = $wpdb->prepare(
			"SELECT * FROM {$this->table()} WHERE order_id IN ( $placeholders )", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
			$order_ids
		);

		return $wpdb->get_results( $query, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Check if the COGS feature is enabled.
	 *
	 * @return bool True if the COGS feature is enabled, false otherwise.
	 */
	private function is_cogs_enabled() {
		return FeaturesUtil::feature_is_enabled( 'cost_of_goods_sold' );
	}

	/**
	 * Get order product lookup data.
	 *
	 * @param mixed $order The order ID or the WC_Order object.
	 * @return array|bool The order product data or false if no data exists.
	 */
	protected function get_order_product_data( $order ) {
		if ( is_numeric( $order ) ) {
			$order_id = $order;
			$order    = wc_get_order( $order );
		} elseif ( $order instanceof WC_Abstract_Order ) {
			$order_id = $order->get_id();
		} else {
			return false;
		}

		// If the order does not exist, check if product lookup data exists in the database.
		if ( ! $order ) {
			return $this->get_order_product_data_from_db( $order_id );
		}

		// Get the order product data from the order object.
		$order_products = $order->get_items( 'line_item' );

		if ( empty( $order_products ) ) {
			// Not a common use case, but there could be a case where this returns empty.
			return $this->get_order_product_data_from_db( $order_id );
		}

		$is_refund_order = $this->is_refund_order( $order_id );
		$round_tax       = 'no' === get_option( 'woocommerce_tax_round_at_subtotal' );
		$decimals        = wc_get_price_decimals();

		$results = array();
		foreach ( $order_products as $order_product ) {
			$shipping_amount     = $order->get_item_shipping_amount( $order_product );
			$shipping_tax_amount = $order->get_item_shipping_tax_amount( $order_product );
			$coupon_amount       = $order->get_item_coupon_amount( $order_product );
			// Tax amount.
			$tax_amount  = 0;
			$order_taxes = $order->get_taxes();
			$tax_data    = $order_product->get_taxes();
			foreach ( $order_taxes as $tax_item ) {
				$tax_item_id = $tax_item->get_rate_id();
				$tax_amount += isset( $tax_data['total'][ $tax_item_id ] ) ? (float) $tax_data['total'][ $tax_item_id ] : 0;
			}

			$net_revenue = round( $order_product->get_total( 'edit' ), $decimals );
			if ( $round_tax ) {
				$tax_amount = round( $tax_amount, $decimals );
			}

			$product_id  = $order_product->get_product_id();
			$cogs_amount = $this->get_order_product_cogs_value( $order_product );

			$product_data = array(
				'order_id'              => $order_id,
				'order_item_id'         => $order_product->get_id(),
				'product_id'            => $product_id,
				'variation_id'          => $order_product->get_variation_id(),
				'product_qty'           => $order_product->get_quantity(),
				'product_net_revenue'   => $net_revenue,
				'product_gross_revenue' => $net_revenue + $tax_amount + $shipping_amount + $shipping_tax_amount,
				'shipping_amount'       => $shipping_amount,
				'shipping_tax_amount'   => $shipping_tax_amount,
				'coupon_amount'         => $coupon_amount,
				'tax_amount'            => $tax_amount,
				'customer_id'           => $order->get_report_customer_id(),
				'date_created'          => self::datetime_to_object( $order->get_date_created() ),
				'cogs_amount'           => $is_refund_order ? -abs( $cogs_amount ) : $cogs_amount,
			);

			$results[] = $product_data;
		}

		return $results;
	}

	/**
	 * Get COGS value for an order product.
	 *
	 * @param object $order_product The order product object.
	 * @return float|null The COGS amount or null if not available.
	 */
	private function get_order_product_cogs_value( $order_product ) {
		if ( ! method_exists( $order_product, 'get_cogs_value' ) || ! $this->is_cogs_enabled() ) {
			return null;
		}

		$cogs_amount = $order_product->get_cogs_value();

		// Only fallback to product's COGS value if order product's COGS is null (not set).
		if ( null === $cogs_amount ) {
			$product_id = $order_product->get_product_id();
			$product    = wc_get_product( $product_id );

			if ( $product && method_exists( $product, 'get_cogs_value' ) ) {
				$product_cogs_value = $product->get_cogs_value();
				if ( null !== $product_cogs_value ) {
					$cogs_amount = $product_cogs_value;
				}
			}
		}

		return $cogs_amount;
	}

	/**
	 * Get order product lookup data from database.
	 *
	 * @param int $order_id The order ID.
	 * @return array|bool The order product data or false if no data exists.
	 */
	protected function get_order_product_data_from_db( $order_id ) {
		$results = $this->get_order_lookup_data_from_db( 'wc_order_product_lookup', $order_id );

		if ( empty( $results ) ) {
			return false;
		}

		$is_refund_order = $this->is_refund_order( $order_id );

		$parsed_results = array();
		foreach ( $results as $result ) {
			$order_item  = WC_Order_Factory::get_order_item( absint( $result['order_item_id'] ) );
			$cogs_amount = $this->get_order_product_cogs_value( $order_item );

			$product_data = array(
				'date_created'          => self::datetime_to_object( $result['date_created'] ),
				'product_net_revenue'   => floatval( $result['product_net_revenue'] ),
				'product_gross_revenue' => floatval( $result['product_gross_revenue'] ),
				'shipping_amount'       => floatval( $result['shipping_amount'] ),
				'shipping_tax_amount'   => floatval( $result['shipping_tax_amount'] ),
				'product_qty'           => intval( $result['product_qty'] ),
				'variation_id'          => intval( $result['variation_id'] ),
				'product_id'            => intval( $result['product_id'] ),
				'customer_id'           => intval( $result['customer_id'] ),
				'coupon_amount'         => floatval( $result['coupon_amount'] ),
				'tax_amount'            => floatval( $result['tax_amount'] ),
				'order_item_id'         => intval( $result['order_item_id'] ),
				'order_id'              => intval( $result['order_id'] ),
				'cogs_amount'           => $is_refund_order ? -abs( $cogs_amount ) : $cogs_amount,
			);

			$parsed_results[] = $product_data;
		}

		return $parsed_results;
	}

	/**
	 * Check if the order is a refund order.
	 *
	 * @param int $order_id The order ID.
	 * @return bool True if the order is a refund order, false otherwise.
	 */
	private function is_refund_order( $order_id ) {
		$order_stats_data = $this->get_order_stats_item( $order_id );

		if ( ! $order_stats_data || empty( $order_stats_data['parent_id'] ) ) {
			return false;
		}

		$parent_id               = $order_stats_data['parent_id'];
		$parent_order_stats_data = $this->get_order_stats_item( $parent_id );

		if ( ! $parent_order_stats_data || empty( $parent_order_stats_data['status'] ) ) {
			return false;
		}

		return OrderInternalStatus::REFUNDED === $parent_order_stats_data['status'];
	}

	/**
	 * Get order coupon lookup data.
	 *
	 * @param mixed $order The order ID or the WC_Order object.
	 * @return array|bool The order coupon data or false if no data exists.
	 */
	protected function get_order_coupon_data( $order ) {
		if ( is_numeric( $order ) ) {
			$order_id = $order;
			$order    = wc_get_order( $order );
		} elseif ( $order instanceof WC_Abstract_Order ) {
			$order_id = $order->get_id();
		} else {
			return false;
		}

		// If the order does not exist, check if coupon lookup data exists in the database.
		if ( ! $order ) {
			return $this->get_order_coupon_data_from_db( $order_id );
		}

		// Get the order coupon data from the order object.
		$order_coupons = $order->get_coupons();

		$results = array();
		foreach ( $order_coupons as $coupon ) {
			$results[] = array(
				'order_id'        => $order_id,
				'coupon_id'       => CouponsDataStore::get_coupon_id( $coupon ),
				'discount_amount' => $coupon->get_discount(),
				'date_created'    => self::datetime_to_object( $order->get_date_created() ),
				'coupon_code'     => $coupon->get_code(),
			);
		}

		return $results;
	}

	/**
	 * Get order coupon lookup data from database.
	 *
	 * @param int $order_id The order ID.
	 * @return array|bool The order coupon data or false if no data exists.
	 */
	protected function get_order_coupon_data_from_db( $order_id ) {
		$results = $this->get_order_lookup_data_from_db( 'wc_order_coupon_lookup', $order_id );

		if ( empty( $results ) ) {
			return false;
		}

		$parsed_results = array();
		foreach ( $results as $result ) {
			$result_data                = array(
				'date_created'    => self::datetime_to_object( $result['date_created'] ),
				'discount_amount' => floatval( $result['discount_amount'] ),
				'order_id'        => intval( $result['order_id'] ),
				'coupon_id'       => intval( $result['coupon_id'] ),
			);
			$coupon                     = new WC_Coupon( absint( $result['coupon_id'] ) );
			$result_data['coupon_code'] = $coupon->get_code();
			$parsed_results[]           = $result_data;
		}

		return $parsed_results;
	}

	/**
	 * Get order tax lookup data.
	 *
	 * @param mixed $order The order ID or the WC_Order object.
	 * @return array|bool The order tax data or false if no data exists.
	 */
	protected function get_order_tax_data( $order ) {
		if ( is_numeric( $order ) ) {
			$order_id = $order;
			$order    = wc_get_order( $order );
		} elseif ( $order instanceof WC_Abstract_Order ) {
			$order_id = $order->get_id();
		} else {
			return false;
		}

		// If the order does not exist, check if tax lookup data exists in the database.
		if ( ! $order ) {
			return $this->get_order_tax_data_from_db( $order_id );
		}

		// Get the order tax data from the order object.
		$order_taxes = $order->get_taxes();

		$results = array();
		foreach ( $order_taxes as $tax ) {
			$order_tax    = (float) $tax->get_tax_total();
			$shipping_tax = (float) $tax->get_shipping_tax_total();
			$results[]    = array(
				'order_id'      => $order_id,
				'tax_rate_id'   => $tax->get_rate_id(),
				'order_tax'     => $order_tax,
				'shipping_tax'  => $shipping_tax,
				'total_tax'     => $order_tax + $shipping_tax,
				'date_created'  => self::datetime_to_object( $order->get_date_created() ),
				'tax_rate_code' => $tax->get_rate_code(),
			);
		}

		return $results;
	}

	/**
	 * Get order tax lookup data from database.
	 *
	 * @param int $order_id The order ID.
	 * @return array|bool The order tax data or false if no data exists.
	 */
	protected function get_order_tax_data_from_db( $order_id ) {
		$results = $this->get_order_lookup_data_from_db( 'wc_order_tax_lookup', $order_id );

		if ( empty( $results ) ) {
			return false;
		}

		$parsed_results = array();
		foreach ( $results as $result ) {
			$result_data      = array(
				'date_created'  => self::datetime_to_object( $result['date_created'] ),
				'order_tax'     => floatval( $result['order_tax'] ),
				'total_tax'     => floatval( $result['total_tax'] ),
				'shipping_tax'  => floatval( $result['shipping_tax'] ),
				'order_id'      => intval( $result['order_id'] ),
				'tax_rate_id'   => intval( $result['tax_rate_id'] ),
				'tax_rate_code' => WC_Tax::get_rate_code( $result['tax_rate_id'] ) ?? '',
			);
			$parsed_results[] = $result_data;
		}

		return $parsed_results;
	}

	/**
	 * Get order lookup data from database.
	 *
	 * @param string $table_name The name of the table.
	 * @param int    $order_id The order ID.
	 * @return array|bool The order lookup data or false if no data exists.
	 */
	protected function get_order_lookup_data_from_db( $table_name, $order_id ) {
		global $wpdb;

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$query = $wpdb->prepare(
			"SELECT * FROM {$wpdb->prefix}{$table_name} WHERE order_id = %d",
			$order_id
		);
		// phpcs:enable

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$results = $wpdb->get_results( $query, ARRAY_A );

		if ( empty( $results ) ) {
			return false;
		}

		return $results;
	}

	/**
	 * Get the order stats data from the database.
	 *
	 * @param int $order_id The order ID.
	 * @return array|bool The order stats data or false if the order stats item does not exist.
	 */
	private function get_order_stats_data_from_db( $order_id ) {
		$order_stats_data = $this->get_order_stats_item( $order_id );

		if ( ! $order_stats_data ) {
			return false;
		}

		// Convert date strings to datetime objects.
		$order_stats_data['date_created']   = self::datetime_to_object( $order_stats_data['date_created'] );
		$order_stats_data['date_completed'] = self::datetime_to_object( $order_stats_data['date_completed'] );
		$order_stats_data['date_paid']      = self::datetime_to_object( $order_stats_data['date_paid'] );

		return $order_stats_data;
	}

	/**
	 * Perform an order status discrepancy check between the order object and the item in the wc_order_stats table.
	 *
	 * @param WC_Order $order WC_Order object.
	 * @param array    $order_stats_item The order stats item.
	 *
	 * @return void
	 */
	private function do_order_status_discrepancy_check( $order, $order_stats_item = array() ) {
		if ( ! $order instanceof WC_Abstract_Order ) {
			return;
		}

		$order_id = $order->get_id();

		// If the order_stats_item is empty, then fetch it from the wc_order_stats table.
		if ( empty( $order_stats_item ) ) {
			$order_stats_item = $this->get_order_stats_data_from_db( $order_id );
		}

		// Check for discrepancy in the order status. Happens in old orders that were not updated and hence the OrderStatsFixer did not run.
		$normalized_order_status = self::normalize_order_status( $order->get_status() );
		if ( $order_stats_item && $normalized_order_status !== $order_stats_item['status'] ) {
			/**
			 * Trigger the action to fix the order stats. The OrderStatusFixer should be hooked to this action.
			 *
			 * @param int $order_id The order ID.
			 */
			do_action( 'woocommerce_analytics_incorrect_order_status_detected', $order_id );
		}
	}
}
