<?php

require_once JETPACK__PLUGIN_DIR . '/sync/class.jetpack-sync-module.php';

class Jetpack_Sync_Module_WooCommerce extends Jetpack_Sync_Module {

	private $meta_whitelist = array( 
		'_product_id',
		'_variation_id',
		'_qty',
		'_tax_class',
		'_line_subtotal',
		'_line_subtotal_tax',
		'_line_total',
		'_line_tax',
		'_line_tax_data',
	);

	private $order_item_table_name;

	public function __construct() {
		global $wpdb;
		$this->order_item_table_name = $wpdb->prefix . 'woocommerce_order_items';
	}

	function name() {
		return "woocommerce";
	}

	public function init_listeners( $callable ) {
		// orders
		add_action( 'woocommerce_new_order', $callable, 10, 1 );
		add_action( 'woocommerce_order_status_changed', $callable, 10, 3 );
		add_action( 'woocommerce_payment_complete', $callable, 10, 1 );

		// order items
		add_action( 'woocommerce_new_order_item', $callable, 10, 4 );
		add_action( 'woocommerce_update_order_item', $callable, 10, 4 );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_new_order_item', array( $this, 'filter_order_item' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_update_order_item', array( $this, 'filter_order_item' ) );

		// order item meta
		$this->init_listeners_for_meta_type( 'order_item', $callable );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_woocommerce_order_items', $callable ); // also sends post meta
	}

	public function get_full_sync_actions() {
		return array( 'jetpack_full_sync_woocommerce_order_items' );
	}

	public function init_before_send() {
		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_woocommerce_order_items', array( $this, 'expand_order_item_ids' ) );
	}

	public function filter_order_item( $args ) {
		$args[1] = $this->build_order_item( $args[1] );
		return $args;
	}

	public function expand_order_item_ids( $args ) {
		$order_item_ids = $args[0];

		global $wpdb;

		$order_item_ids_sql = implode( ', ', array_map( 'intval', $order_item_ids ) );

		$order_items = $wpdb->get_results( 
			"SELECT * FROM $this->order_item_table_name WHERE order_item_id IN ( $order_item_ids_sql )"
		);

		return array(
			$order_items,
			$this->get_metadata( $order_item_ids, 'order_item', $this->meta_whitelist )
		);
	}

	public function build_order_item( $order_item ) {
		if ( is_numeric( $order_item ) ) {
			global $wpdb;
			return $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $this->order_item_table_name WHERE order_item_id = %d", $order_item ) );
		} elseif ( is_array( $order_item ) ) {
			return $order_item;
		} else {
			return (object)array(
				'order_item_id'   => $order_item->get_id(),
				'order_item_type' => $order_item->get_type(),
				'order_item_name' => $order_item->get_name(),
				'order_id'        => $order_item->get_order_id(),
			);
		}
	}

	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		global $wpdb;

		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_woocommerce_order_items', $this->order_item_table_name, 'order_item_id', $this->get_where_sql( $config ), $max_items_to_enqueue, $state );
	}

	public function estimate_full_sync_actions( $config ) {
		global $wpdb;

		$query = "SELECT count(*) FROM $this->order_item_table_name WHERE " . $this->get_where_sql( $config );
		$count = $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	private function get_where_sql( $config ) {
		return '1=1';
	}
}
