<?php
/**
 * WooCommerce Products sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use DateTimeZone;
use WC_DateTime;
use WP_Error;

/**
 * Class to handle sync for WooCommerce Products table.
 *
 * Note: This module is currently used for analytics purposes only.
 */
class WooCommerce_Products extends Module {

	const PRODUCT_POST_TYPES = array( 'product', 'product_variation' );

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Preprocess action to be sent by Jetpack sync for wp_delete_post.
		add_action( 'delete_post', array( $this, 'action_wp_delete_post' ), 10, 1 );
		add_action( 'trashed_post', array( $this, 'action_wp_trash_post' ), 10, 1 );
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

		// Listen to product trashed.
		add_action( 'jetpack_sync_woocommerce_product_trashed', $callable, 10, 1 );

		// Listen to product deletion via wp_delete_post (more reliable than WC hooks)
		add_action( 'jetpack_sync_woocommerce_product_deleted', $callable, 10, 1 );

		// Add filters to expand product data before sync
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_new_product', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_update_product', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_new_product_variation', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_update_product_variation', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_updated_product_stock', array( $this, 'expand_product_data' ) );
		add_filter( 'jetpack_sync_before_enqueue_jetpack_sync_woocommerce_product_trashed', array( $this, 'expand_product_data' ) );
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
		if ( $this->is_a_product_post( $post_id ) ) {
			/**
			 * Fires when a WooCommerce product is deleted via wp_delete_post.
			 *
			 * @param int $post_id The product ID being deleted.
			 */
			do_action( 'jetpack_sync_woocommerce_product_deleted', $post_id );
		}
	}

	/**
	 * Handle wp_trash_post action and trigger custom product trashed sync for WooCommerce products.
	 *
	 * @param int $post_id The post ID being trashed.
	 */
	public function action_wp_trash_post( $post_id ) {
		if ( $this->is_a_product_post( $post_id ) ) {
			/**
			 * Fires when a WooCommerce product is trashed via wp_trash_post.
			 *
			 * @param int $post_id The product ID being trashed.
			 */
			do_action( 'jetpack_sync_woocommerce_product_trashed', $post_id );
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
		if ( ! is_array( $ids ) ) {
			return array();
		}

		// Make sure the IDs are numeric and are non-zero.
		$ids = array_filter( array_map( 'intval', $ids ) );

		if ( empty( $ids ) ) {
			return array();
		}

		$posts         = $this->get_product_posts( $ids, $order );
		$product_types = $this->get_product_types( $ids, $order );

		$products = array();

		// Build base product data from posts.
		foreach ( $posts as $post ) {
			$products[ $post->ID ] = array(
				'product_id'    => $post->ID,
				'title'         => $post->post_title,
				'post_status'   => $post->post_status,
				'slug'          => $post->post_name,
				'date_created'  => $this->datetime_to_object( $post->post_date ),
				'date_modified' => $this->datetime_to_object( $post->post_modified ),
			);

			$post_type = $post->post_type;
			// ProductType::VARIATION and ProductType::SIMPLE have only existed since WooCommerce 9.7, so
			// we can't rely on that existing, but using the strings is probably safe enough.
			if ( 'product_variation' === $post_type ) {
				$product_type = 'variation';
			} elseif ( 'product' === $post_type ) {
				$product_type = $product_types[ $post->ID ] ?? 'simple';
			} else {
				$product_type = null;
			}
			$products[ $post->ID ]['type'] = $product_type;
		}

		// Merge in product meta data.
		$product_meta_data = $this->get_product_meta_data( $ids, $order );
		foreach ( $product_meta_data as $meta ) {
			$product_id = $meta['product_id'];
			if ( isset( $products[ $product_id ] ) ) {
				$products[ $product_id ] = array_merge( $products[ $product_id ], $meta );
			} else {
				$products[ $product_id ] = $meta;
			}
		}

		// Add COGS data.
		$cogs_data = $this->get_product_cogs_data( $ids, $order );
		foreach ( $cogs_data as $product_id => $cogs_value ) {
			if ( ! isset( $products[ $product_id ] ) ) {
				$products[ $product_id ] = array();
			}
			$products[ $product_id ]['cogs_amount'] = $cogs_value;
		}

		return $products;
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

	/**
	 * Get the product meta data from the product meta lookup table.
	 *
	 * @param array  $ids List of product IDs to fetch.
	 * @param string $order Either 'ASC' or 'DESC'.
	 *
	 * @return array
	 */
	private function get_product_meta_data( $ids, $order = '' ) {
		global $wpdb;

		// Prepare the placeholders for the prepared query below.
		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );

		$query = "SELECT * FROM {$this->table()} WHERE product_id IN ( $placeholders )";
		if ( ! empty( $order ) && in_array( $order, array( 'ASC', 'DESC' ), true ) ) {
			$query .= " ORDER BY product_id $order";
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Hardcoded query, no user variable
		$product_meta_data = $wpdb->get_results( $wpdb->prepare( $query, $ids ), ARRAY_A );

		if ( ! is_array( $product_meta_data ) ) {
			return array();
		}

		return $product_meta_data;
	}

	/**
	 * Get the product data from the posts table.
	 *
	 * @param array  $ids List of product IDs to fetch.
	 * @param string $order Either 'ASC' or 'DESC'.
	 *
	 * @return array
	 */
	private function get_product_posts( $ids, $order = '' ) {
		$posts = get_posts(
			array(
				'include'     => $ids,
				'order'       => $order,
				'post_type'   => self::PRODUCT_POST_TYPES,
				'post_status' => array( 'any', 'trash', 'auto-draft' ),
				'numberposts' => -1, // Get all posts.
			)
		);

		return $posts;
	}

	/**
	 * Get the product cogs data from the product meta lookup table.
	 *
	 * @param array  $ids List of product IDs to fetch.
	 * @param string $order Either 'ASC' or 'DESC'.
	 *
	 * @return array
	 */
	private function get_product_cogs_data( $ids, $order = '' ) {
		// @phan-suppress-current-line UnusedPluginSuppression @phan-suppress-next-line PhanUndeclaredClassMethod -- we're checking for the class (around since WooCommerce 7.1) before calling the method (introduced as part of the original class). See also: https://github.com/phan/phan/issues/1204
		$is_cogs_enabled = class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) && \Automattic\WooCommerce\Utilities\FeaturesUtil::feature_is_enabled( 'cost_of_goods_sold' );

		if ( ! $is_cogs_enabled ) {
			return array();
		}

		global $wpdb;

		// Prepare the placeholders for the prepared query below.
		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );

		$query = "
          SELECT post_id, meta_value
          FROM {$wpdb->postmeta}
          WHERE post_id IN ( $placeholders )
          AND meta_key = '_cogs_total_value'
      ";

		if ( ! empty( $order ) && in_array( $order, array( 'ASC', 'DESC' ), true ) ) {
			$query .= " ORDER BY post_id $order";
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Hardcoded query, no user variable
		$results = $wpdb->get_results( $wpdb->prepare( $query, $ids ), ARRAY_A );

		if ( ! is_array( $results ) ) {
			return array();
		}

		$product_cogs_data = array();
		foreach ( $results as $result ) {
			$cogs_value                              = '' === $result['meta_value'] ? null : (float) $result['meta_value'];
			$product_cogs_data[ $result['post_id'] ] = $cogs_value;
		}

		return $product_cogs_data;
	}

	/**
	 * Get product types for multiple product IDs in bulk.
	 *
	 * @param array  $ids List of product IDs to fetch types for.
	 * @param string $order Either 'ASC' or 'DESC'.
	 *
	 * @return array Array of product_id => product_type mapping.
	 */
	private function get_product_types( $ids, $order = '' ) {
		if ( empty( $ids ) ) {
			return array();
		}

		global $wpdb;

		// Bulk load term relationships and term data
		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
		$query        = "
			SELECT tr.object_id, t.name
			FROM {$wpdb->term_relationships} tr
			INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
			INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
			WHERE tr.object_id IN ( $placeholders )
			AND tt.taxonomy = 'product_type'
		";

		if ( ! empty( $order ) && in_array( $order, array( 'ASC', 'DESC' ), true ) ) {
			$query .= " ORDER BY tr.object_id $order";
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Hardcoded query, no user variable
		$results = $wpdb->get_results( $wpdb->prepare( $query, $ids ) );

		if ( ! is_array( $results ) ) {
			return array();
		}

		$product_types = array();
		foreach ( $results as $result ) {
			$product_types[ $result->object_id ] = sanitize_title( $result->name );
		}

		return $product_types;
	}

	/**
	 * Convert the WC_DateTime objects to stdClass objects to ensure they are properly encoded.
	 *
	 * @param WC_DateTime|mixed $wc_datetime The datetime object.
	 * @param bool              $utc         Whether to convert to UTC.
	 * @return object|null
	 */
	private function datetime_to_object( $wc_datetime, $utc = false ) {
		if ( is_string( $wc_datetime ) ) {
			$wc_datetime = new WC_DateTime( $wc_datetime, new DateTimeZone( wc_timezone_string() ) );
		}

		if ( is_a( $wc_datetime, 'WC_DateTime' ) ) {
			if ( $utc ) {
				$wc_datetime->setTimezone( new DateTimeZone( 'UTC' ) );
			} else {
				$wc_datetime->setTimezone( new DateTimeZone( wc_timezone_string() ) );
			}
			return (object) (array) $wc_datetime;
		}

		return null;
	}

	/**
	 * Check if the post is a product post.
	 *
	 * @param int $post_id The post ID to check.
	 * @return bool True if the post is a product post, false otherwise.
	 */
	private function is_a_product_post( $post_id ) {
		$post_type = get_post_type( $post_id );
		return in_array( $post_type, self::PRODUCT_POST_TYPES, true );
	}
}
