<?php
/**
 * WooCommerce Products sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use WP_Error;

/**
 * Class to handle sync for WooCommerce Products table.
 */
class WooCommerce_Products extends Module {
	/**
	 * Constructor.
	 */
	public function __construct() {
		// Preprocess action to be sent by Jetpack sync for wp_delete_post.
		add_action( 'delete_post', array( $this, 'action_wp_delete_post' ), 10, 1 );
	}

	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'woocommerce_products';
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
		return 'jetpack_full_sync_woocommerce_products';
	}

	/**
	 * Initialize WooCommerce Products action listeners.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_listeners( $callable ) {
		// Listen to product creation and updates - these hooks trigger products table updates
		add_action( 'woocommerce_new_product', $callable, 10, 1 );
		add_action( 'woocommerce_update_product', $callable, 10, 1 );

		// Listen to variation creation and updates (they also affect products table)
		add_action( 'woocommerce_new_product_variation', $callable, 10, 1 );
		add_action( 'woocommerce_update_product_variation', $callable, 10, 1 );

		// Listen to specific stock update.
		add_action( 'woocommerce_updated_product_stock', $callable, 10, 1 );

		// Listen to product deletion via wp_delete_post (more reliable than WC hooks)
		add_action( 'jetpack_sync_woocommerce_product_deleted', $callable, 10, 1 );

		// Add filters to expand product data before sync
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_new_product', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_update_product', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_new_product_variation', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_update_product_variation', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_updated_product_stock', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_jetpack_sync_woocommerce_product_deleted', array( $this, 'expand_product_data' ) );
	}

	/**
	 * Initialize WooCommerce Products action listeners for full sync.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_woocommerce_products', $callable );
	}

	/**
	 * Retrieve the actions that will be sent for this module during a full sync.
	 *
	 * @access public
	 *
	 * @return array Full sync actions of this module.
	 */
	public function get_full_sync_actions() {
		return array( 'jetpack_full_sync_woocommerce_products' );
	}

	/**
	 * Initialize the module in the sender.
	 *
	 * @access public
	 */
	public function init_before_send() {
		// Full sync.
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_woocommerce_products', array( $this, 'build_full_sync_action_array' ) );
	}

	/**
	 * Handle wp_delete_post action and trigger custom product deletion sync for WooCommerce products.
	 *
	 * @param int $post_id The post ID being deleted.
	 */
	public function action_wp_delete_post( $post_id ) {
		$post_type = get_post_type( $post_id );

		// Only process WooCommerce product and product variation post types
		if ( in_array( $post_type, array( 'product', 'product_variation' ), true ) ) {
			/**
			 * Fires when a WooCommerce product is deleted via wp_delete_post.
			 *
			 * @param int $post_id The product ID being deleted.
			 */
			do_action( 'jetpack_sync_woocommerce_product_deleted', $post_id );
		}
	}

	/**
	 * Expand product data to include products table information.
	 *
	 * @param array $args The hook arguments.
	 * @return array $args The hook arguments with expanded data.
	 */
	public function expand_product_data( $args ) {
		if ( empty( $args[0] ) ) {
			return $args;
		}

		$product_id = $args[0];

		// Get the product data
		$product_data = $this->get_product_by_ids( array( $product_id ) );

		if ( ! empty( $product_data ) ) {
			$args[1] = reset( $product_data ); // Get the first (and only) result
		}

		return $args;
	}

	/**
	 * Enqueue the WooCommerce Products actions for full sync.
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
			'jetpack_full_sync_woocommerce_products',
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
		if ( 'product' !== $object_type || empty( $ids ) || ! is_array( $ids ) ) {
			return array();
		}

		return $this->get_product_by_ids( $ids );
	}

	/**
	 * Returns a list of product objects by their IDs.
	 *
	 * @param array  $ids List of product IDs to fetch.
	 * @param string $order Either 'ASC' or 'DESC'.
	 *
	 * @access public
	 *
	 * @return array|object|null
	 */
	public function get_product_by_ids( $ids, $order = '' ) {
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
		return array_map( array( $this, 'transform_product_data' ), $results );
	}

	/**
	 * Transform product data to include cogs_amount and other computed fields.
	 *
	 * @param array $product_data Raw products table data.
	 * @return array Transformed data with cogs_amount.
	 */
	public function transform_product_data( $product_data ) {
		if ( empty( $product_data['product_id'] ) ) {
			return $product_data;
		}

		$product_id = $product_data['product_id'];

		// Attempt to retrieve the WooCommerce product object and its COGS value.
		$product_data['cogs_amount'] = null;

		$cogs_enabled = class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) && \Automattic\WooCommerce\Utilities\FeaturesUtil::feature_is_enabled( 'cost_of_goods_sold' );

		if ( $cogs_enabled && function_exists( 'wc_get_product' ) ) {
			$product = wc_get_product( $product_id );
			if ( $product instanceof \WC_Product && is_callable( array( $product, 'get_cogs_value' ) ) ) {
				$product_data['cogs_amount'] = $product->get_cogs_value();
			}
		}

		return $product_data;
	}

	/**
	 * Build the full sync action object for WooCommerce products.
	 *
	 * @access public
	 *
	 * @param array $args An array with the product data and the previous end.
	 *
	 * @return array An array with the product data and the previous end.
	 */
	public function build_full_sync_action_array( $args ) {
		list( $filtered_product, $previous_end ) = $args;
		return array(
			'product'      => $filtered_product['objects'],
			'previous_end' => $previous_end,
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

		// Fetch the product data in DESC order for the next chunk logic to work.
		$product_data = $this->get_product_by_ids( $product_ids, 'DESC' );

		// If no data was fetched, make sure to return the expected structure so that status is updated correctly.
		if ( empty( $product_data ) ) {
			return array(
				'object_ids' => $product_ids,
				'objects'    => array(),
			);
		}
		// Filter the product data based on the maximum size constraints.
		// We don't have separate metadata, so we pass empty array for metadata.
		list( $filtered_product_ids, $filtered_product_data, ) = $this->filter_objects_and_metadata_by_size(
			'product',
			$product_data,
			array(), // No separate metadata for products table
			0,       // No individual meta size limit since we don't have separate metadata
			self::MAX_SIZE_FULL_SYNC
		);

		return array(
			'object_ids' => $filtered_product_ids,
			'objects'    => $filtered_product_data,
		);
	}
}
