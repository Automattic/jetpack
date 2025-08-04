<?php
/**
 * WooCommerce Product Meta Lookup sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use WP_Error;

/**
 * Class to handle sync for WooCommerce Product Meta Lookup table.
 */
class WooCommerce_Product_Meta_Lookup extends Module {

	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'woocommerce_product_meta_lookup';
	}

	/**
	 * The table in the database with the prefix.
	 *
	 * @access public
	 *
	 * @return string|bool
	 */
	public function table() {
		global $wpdb;
		return $wpdb->prefix . 'wc_product_meta_lookup';
	}

	/**
	 * The id field in the database.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function id_field() {
		return 'product_id';
	}

	/**
	 * The full sync action name for this module.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function full_sync_action_name() {
		return 'jetpack_full_sync_woocommerce_product_meta_lookup';
	}

	/**
	 * Initialize WooCommerce Product Lookup action listeners.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_listeners( $callable ) {
		// Listen to product creation and updates - these hooks trigger lookup table updates
		add_action( 'woocommerce_new_product', $callable, 10, 1 );
		add_action( 'woocommerce_update_product', $callable, 10, 1 );
		add_action( 'woocommerce_delete_product', $callable, 10, 1 );

		// Listen to variation creation and updates (they also affect lookup table)
		add_action( 'woocommerce_new_product_variation', $callable, 10, 1 );
		add_action( 'woocommerce_update_product_variation', $callable, 10, 1 );
		add_action( 'woocommerce_delete_product_variation', $callable, 10, 1 );

		// Listen to specific stock update.
		add_action( 'woocommerce_updated_product_stock', $callable, 10, 1 );

		// Add filters to expand product data before sync
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_new_product', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_update_product', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_new_product_variation', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_update_product_variation', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_updated_product_stock', array( $this, 'expand_product_data' ) );
	}

	/**
	 * Initialize WooCommerce Product Lookup action listeners for full sync.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_woocommerce_product_meta_lookup', $callable );
	}

	/**
	 * Retrieve the actions that will be sent for this module during a full sync.
	 *
	 * @access public
	 *
	 * @return array Full sync actions of this module.
	 */
	public function get_full_sync_actions() {
		return array( 'jetpack_full_sync_woocommerce_product_meta_lookup' );
	}

	/**
	 * Initialize the module in the sender.
	 *
	 * @access public
	 */
	public function init_before_send() {
		// Full sync.
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_woocommerce_product_meta_lookup', array( $this, 'build_full_sync_action_array' ) );
	}

	/**
	 * Expand product data to include lookup table information.
	 *
	 * @param array $args The hook arguments.
	 * @return array $args The hook arguments with expanded data.
	 */
	public function expand_product_data( $args ) {
		if ( empty( $args[0] ) ) {
			return $args;
		}

		$product_id = $args[0];

		// Get the product lookup data
		$lookup_data = $this->get_product_lookup_by_ids( array( $product_id ) );

		if ( ! empty( $lookup_data ) ) {
			$args[1] = reset( $lookup_data ); // Get the first (and only) result
		}

		return $args;
	}

	/**
	 * Enqueue the WooCommerce Product Lookup actions for full sync.
	 *
	 * @access public
	 *
	 * @param array   $config               Full sync configuration for this sync module.
	 * @param int     $max_items_to_enqueue Maximum number of items to enqueue.
	 * @param boolean $state                True if full sync has finished enqueueing this module, false otherwise.
	 * @return array Number of actions enqueued, and next module state.
	 */
	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		return $this->enqueue_all_ids_as_action(
			'jetpack_full_sync_woocommerce_product_meta_lookup',
			$this->table(),
			'product_id',
			$this->get_where_sql( $config ),
			$max_items_to_enqueue,
			$state
		);
	}

	/**
	 * Retrieve an estimated number of actions that will be enqueued.
	 *
	 * @access public
	 *
	 * @param array $config Full sync configuration for this sync module.
	 * @return int Number of items yet to be enqueued.
	 */
	public function estimate_full_sync_actions( $config ) {
		global $wpdb;

		$query = "SELECT count(*) FROM {$this->table()} WHERE " . $this->get_where_sql( $config );
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = (int) $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	/**
	 * Return a list of objects by their type and IDs
	 *
	 * @param string $object_type Object type.
	 * @param array  $ids IDs of objects to return.
	 *
	 * @access public
	 *
	 * @return array|object|WP_Error|null
	 */
	public function get_objects_by_id( $object_type, $ids ) {
		if ( 'product_meta_lookup' !== $object_type || empty( $ids ) || ! is_array( $ids ) ) {
			return array();
		}

		return $this->get_product_lookup_by_ids( $ids );
	}

	/**
	 * Returns a list of product lookup objects by their IDs.
	 *
	 * @param array  $ids List of product IDs to fetch.
	 * @param string $order Either 'ASC' or 'DESC'.
	 *
	 * @access public
	 *
	 * @return array|object|null
	 */
	public function get_product_lookup_by_ids( $ids, $order = '' ) {
		global $wpdb;

		if ( ! is_array( $ids ) ) {
			return array();
		}

		// Make sure the IDs are numeric and are non-zero.
		$ids = array_filter( array_map( 'intval', $ids ) );

		if ( empty( $ids ) ) {
			return array();
		}

		// Prepare the placeholders for the prepared query below.
		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );

		$query = "SELECT * FROM {$this->table()} WHERE product_id IN ( $placeholders )";
		if ( ! empty( $order ) && in_array( $order, array( 'ASC', 'DESC' ), true ) ) {
			$query .= " ORDER BY product_id $order";
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Hardcoded query, no user variable
		$results = $wpdb->get_results( $wpdb->prepare( $query, $ids ), ARRAY_A );

		// Transform the data to include cogs_amount
		return array_map( array( $this, 'transform_product_lookup_data' ), $results );
	}

	/**
	 * Transform product lookup data to include cogs_amount and other computed fields.
	 *
	 * @param array $lookup_data Raw lookup table data.
	 * @return array Transformed data with cogs_amount.
	 */
	public function transform_product_lookup_data( $lookup_data ) {
		if ( empty( $lookup_data['product_id'] ) ) {
			return $lookup_data;
		}

		$product_id = $lookup_data['product_id'];

		// Attempt to retrieve the WooCommerce product object and its COGS value.
		$lookup_data['cogs_amount'] = null;

		if ( function_exists( 'wc_get_product' ) ) {
			$product = wc_get_product( $product_id );
			if ( $product instanceof WC_Product && is_callable( array( $product, 'get_cogs_value' ) ) ) {
				$lookup_data['cogs_amount'] = $product->get_cogs_value();
			}
		}

		return $lookup_data;
	}

	/**
	 * Build the full sync action object for WooCommerce product lookup.
	 *
	 * @access public
	 *
	 * @param array $args An array with the product lookup data and the previous end.
	 *
	 * @return array An array with the product lookup data and the previous end.
	 */
	public function build_full_sync_action_array( $args ) {
		list( $filtered_product_lookup, $previous_end ) = $args;
		return array(
			'product_meta_lookup' => $filtered_product_lookup['objects'],
			'previous_end'        => $previous_end,
		);
	}

	/**
	 * Given the Module Configuration and Status return the next chunk of items to send.
	 *
	 * @param array $config This module Full Sync configuration.
	 * @param array $status This module Full Sync status.
	 * @param int   $chunk_size Chunk size.
	 *
	 * @return array
	 */
	public function get_next_chunk( $config, $status, $chunk_size ) {
		$product_ids = parent::get_next_chunk( $config, $status, $chunk_size );

		if ( empty( $product_ids ) ) {
			return array();
		}

		// Fetch the product lookup data in DESC order for the next chunk logic to work.
		$product_lookup_data = $this->get_product_lookup_by_ids( $product_ids, 'DESC' );

		// If no data was fetched, make sure to return the expected structure so that status is updated correctly.
		if ( empty( $product_lookup_data ) ) {
			return array(
				'object_ids' => $product_ids,
				'objects'    => array(),
			);
		}
		// Filter the product lookup data based on the maximum size constraints.
		// We don't have separate metadata, so we pass empty array for metadata.
		list( $filtered_product_ids, $filtered_product_lookup_data, ) = $this->filter_objects_and_metadata_by_size(
			'product_meta_lookup',
			$product_lookup_data,
			array(), // No separate metadata for product lookup table
			0,       // No individual meta size limit since we don't have separate metadata
			self::MAX_SIZE_FULL_SYNC
		);

		return array(
			'object_ids' => $filtered_product_ids,
			'objects'    => $filtered_product_lookup_data,
		);
	}
}
