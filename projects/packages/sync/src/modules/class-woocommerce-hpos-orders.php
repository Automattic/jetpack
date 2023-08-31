<?php
/**
 * WooCommerce HPOS orders sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\WooCommerce\Internal\DataStores\Orders\OrdersTableDataStore;

/**
 * Adds WooCommerce HPOS specific data to sync when HPOS is enabled on the site.
 */
class WooCommerce_HPOS_Orders extends Module {

	/**
	 * Order table name. There are four order tables (order, addresses, operational_data and meta), but for sync purposes we only care about the main table since it has the order ID.
	 *
	 * @access private
	 *
	 * @var string
	 */
	private $order_table_name;

	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'woocommerce_hpos_orders';
	}

	/**
	 * Get the order table name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function table_name() {
		return $this->order_table_name;
	}

	/**
	 * Initialize order table data store, returns if the class don't exist (pre WC 6.x)
	 *
	 * @access public
	 */
	public function __construct() {
		if ( ! class_exists( OrdersTableDataStore::class ) ) {
			return;
		}
		$this->order_table_name = OrdersTableDataStore::get_orders_table_name();
	}

	/**
	 * Hooks sync listners on order modify events.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_listeners( $callable ) {
		add_action( 'woocommerce_after_order_object_save', $callable );
		add_action( 'woocommerce_delete_order', $callable );
		add_action( 'woocommerce_trash_order', $callable );
	}

	/**
	 * Hooks expanding order data with sync events, so that order data is populated against IDs before syncing.
	 *
	 * @access public
	 */
	public function init_before_send() {
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_after_order_object_save', array( $this, 'expand_order_object' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_delete_order', array( $this, 'expand_order_object' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_trash_order', array( $this, 'expand_order_object' ) );
		add_filter( 'jetpack_sync_before_enqueue_full_sync_orders', array( $this, 'expand_order_objects' ) );
	}

	/**
	 * Hooks the full sync listeners.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_orders', $callable );
	}

	/**
	 * Returns the ID field from wc_orders table.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function id_field() {
		return 'id';
	}

	/**
	 * Retrieve the actions that will be sent for this module during a full sync.
	 *
	 * @access public
	 *
	 * @return array Full sync actions of this module.
	 */
	public function get_full_sync_actions() {
		return array( 'jetpack_full_sync_orders' );
	}

	/**
	 * Retrieve order data by its ID.
	 *
	 * @access public
	 *
	 * @param string $object_type Type of object to retrieve. Should be `order`.
	 * @param int    $id          Order ID.
	 *
	 * @return array
	 */
	public function get_object_by_id( $object_type, $id ) {
		if ( 'order' !== $object_type ) {
			return $id;
		}
		$order_objects = $this->get_objects_by_id( $object_type, array( $id ) );
		return isset( $order_objects[ $id ] ) ? $order_objects[ $id ] : false;
	}

	/**
	 * Retrieves multiple orders data by their ID.
	 *
	 * @access public
	 *
	 * @param string $object_type Type of object to retrieve. Should be `order`.
	 * @param array  $ids         List of order IDs.
	 *
	 * @return array
	 */
	public function get_objects_by_id( $object_type, $ids ) {
		if ( 'order' !== $object_type ) {
			return $ids;
		}
		$orders      = wc_get_orders( array( 'include' => $ids ) );
		$orders_data = array();
		foreach ( $orders as $order ) {
			$orders_data[ $order->get_id() ] = $this->filter_order_data( $order->get_data() );
		}
		return $orders_data;
	}

	/**
	 * Retrieves multiple orders data by their ID.
	 *
	 * @access public
	 *
	 * @param array $args List of order IDs.
	 *
	 * @return array
	 */
	public function expand_order_objects( $args ) {
		$order_ids = $args;

		return $this->get_objects_by_id( 'order', $order_ids );
	}

	/**
	 * Retrieve order data by its ID.
	 *
	 * @access public
	 *
	 * @param array $args Order ID.
	 *
	 * @return array
	 */
	public function expand_order_object( $args ) {
		$order_object = $args[0];

		if ( is_int( $order_object ) ) {
			$order_object = wc_get_order( $order_object );
		}

		if ( ! $order_object instanceof \WC_Abstract_Order ) {
			return false;
		}

		return $this->filter_order_data( $order_object->get_data() );
	}

	/**
	 * Filters only allowed keys from order data. No PII etc information is allowed to be synced.
	 *
	 * @access private
	 *
	 * @param array $order_data Unfiltered order data.
	 *
	 * @return array Filtered order data.
	 */
	private function filter_order_data( $order_data ) {
		// Filter with allowlist.
		$allowed_data_keys   = WooCommerce::$wc_post_meta_whitelist;
		$allowed_data_keys[] = 'id';
		$filtered_order_data = array();
		foreach ( $allowed_data_keys as $key ) {
			$key       = trim( $key, '_' );
			$key_parts = explode( '_', $key );

			if ( 'order' === $key_parts[0] ) {
				if ( isset( $order_data[ $key_parts[1] ] ) && ! is_array( $order_data[ $key_parts[1] ] ) ) {
					$filtered_order_data[ $key ] = $order_data[ $key_parts[1] ];
					continue;
				}
			}

			if ( in_array( $key_parts[0], array( 'billing', 'shipping' ), true ) && 2 === count( $key_parts ) ) {
				if ( isset( $order_data[ $key_parts[0] ][ $key_parts[1] ] ) ) {
					$filtered_order_data[ $key ] = $order_data[ $key_parts[0] ][ $key_parts[1] ];
					continue;
				}
			}

			if ( isset( $order_data[ $key ] ) ) {
				$filtered_order_data[ $key ] = $order_data[ $key ];
				continue;
			}

			switch ( $key ) {
				case 'cart_discount':
					$filtered_order_data[ $key ] = isset( $order_data['discount_total'] ) ? $order_data['discount_total'] : '';
					break;
				case 'cart_discount_tax':
					$filtered_order_data[ $key ] = isset( $order_data['discount_tax'] ) ? $order_data['discount_tax'] : '';
					break;
				case 'order_shipping':
					$filtered_order_data[ $key ] = isset( $order_data['shipping_total'] ) ? $order_data['shipping_total'] : '';
					break;
				case 'order_shipping_tax':
					$filtered_order_data[ $key ] = isset( $order_data['shipping_tax'] ) ? $order_data['shipping_tax'] : '';
					break;
				case 'order_tax':
					$filtered_order_data[ $key ] = isset( $order_data['cart_tax'] ) ? $order_data['cart_tax'] : '';
					break;
				case 'order_total':
					$filtered_order_data[ $key ] = isset( $order_data['total'] ) ? $order_data['total'] : '';
					break;
			}
		}

		return $filtered_order_data;
	}

	/**
	 * Returns metadata for order object.
	 *
	 * @access protected
	 *
	 * @param array  $ids List of order IDs.
	 * @param string $meta_type Meta type.
	 * @param array  $meta_key_whitelist List of allowed meta keys.
	 *
	 * @return array Filtered order metadata.
	 */
	protected function get_metadata( $ids, $meta_type, $meta_key_whitelist ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- returning empty meta is intentional.
		return array(); // don't sync metadata, all allow-listed core data is available in the order object.
	}

	/**
	 * Retrieve an estimated number of actions that will be enqueued.
	 *
	 * @access public
	 *
	 * @param array $config Full sync configuration for this sync module.
	 * @return array Number of items yet to be enqueued.
	 */
	public function estimate_full_sync_actions( $config ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- We return all order count for full sync, so confit is not required.
		global $wpdb;

		$query = "SELECT count(*) FROM {$this->table_name()}";
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Hardcoded query, no user variable
		$count = $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	/**
	 * Enqueue the WooCommerce HPOS orders actions for full sync.
	 *
	 * @access public
	 *
	 * @param array   $config               Full sync configuration for this sync module.
	 * @param int     $max_items_to_enqueue Maximum number of items to enqueue.
	 * @param boolean $state                True if full sync has finished enqueueing this module, false otherwise.
	 * @return array Number of actions enqueued, and next module state.
	 */
	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		return $this->enqueue_all_ids_as_action( 'full_sync_orders', $this->table_name(), 'id', $this->get_where_sql( $config ), $max_items_to_enqueue, $state );
	}
}
