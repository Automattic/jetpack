<?php

require_once JETPACK__PLUGIN_DIR . '/sync/class.jetpack-sync-module.php';

class Jetpack_Sync_Module_WooCommerce extends Jetpack_Sync_Module {

	private $order_item_meta_whitelist = array(
		// https://github.com/woocommerce/woocommerce/blob/master/includes/data-stores/class-wc-order-item-product-store.php#L20
		'_product_id',
		'_variation_id',
		'_qty',
		// Tax ones also included in below class
		// https://github.com/woocommerce/woocommerce/blob/master/includes/data-stores/class-wc-order-item-fee-data-store.php#L20
		'_tax_class',
		'_tax_status',
		'_line_subtotal',
		'_line_subtotal_tax',
		'_line_total',
		'_line_tax',
		'_line_tax_data',
		// https://github.com/woocommerce/woocommerce/blob/master/includes/data-stores/class-wc-order-item-shipping-data-store.php#L20
		'method_id',
		'cost',
		'total_tax',
		'taxes',
		// https://github.com/woocommerce/woocommerce/blob/master/includes/data-stores/class-wc-order-item-tax-data-store.php#L20
		'rate_id',
		'label',
		'compound',
		'tax_amount',
		'shipping_tax_amount',
		// https://github.com/woocommerce/woocommerce/blob/master/includes/data-stores/class-wc-order-item-coupon-data-store.php
		'discount_amount',
		'discount_amount_tax',
	);

	private $order_item_table_name;

	public function __construct() {
		global $wpdb;
		$this->order_item_table_name = $wpdb->prefix . 'woocommerce_order_items';

		// options, constants and post meta whitelists
		add_filter( 'jetpack_sync_options_whitelist', array( $this, 'add_woocommerce_options_whitelist' ), 10 );
		add_filter( 'jetpack_sync_constants_whitelist', array( $this, 'add_woocommerce_constants_whitelist' ), 10 );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'add_woocommerce_post_meta_whitelist' ), 10 );

		add_filter( 'jetpack_sync_before_enqueue_woocommerce_new_order_item', array( $this, 'filter_order_item' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_update_order_item', array( $this, 'filter_order_item' ) );
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
			$this->get_metadata( $order_item_ids, 'order_item', $this->order_item_meta_whitelist ),
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

	public function add_woocommerce_options_whitelist( $list ) {
		return array_merge( $list, self::$wc_options_whitelist );
	}

	public function add_woocommerce_constants_whitelist( $list ) {
		return array_merge( $list, self::$wc_constants_whitelist );
	}

	public function add_woocommerce_post_meta_whitelist( $list ) {
		return array_merge( $list, self::$wc_post_meta_whitelist );
	}

	private static $wc_options_whitelist = array(
		'woocommerce_currency',
		'woocommerce_db_version',
		'woocommerce_weight_unit',
		'woocommerce_version',
		'woocommerce_unforce_ssl_checkout',
		'woocommerce_tax_total_display',
		'woocommerce_tax_round_at_subtotal',
		'woocommerce_tax_display_shop',
		'woocommerce_tax_display_cart',
		'woocommerce_prices_include_tax',
		'woocommerce_price_thousand_sep',
		'woocommerce_price_num_decimals',
		'woocommerce_price_decimal_sep',
		'woocommerce_notify_low_stock',
		'woocommerce_notify_low_stock_amount',
		'woocommerce_notify_no_stock',
		'woocommerce_notify_no_stock_amount',
		'woocommerce_manage_stock',
		'woocommerce_force_ssl_checkout',
		'woocommerce_hide_out_of_stock_items',
		'woocommerce_file_download_method',
		'woocommerce_enable_signup_and_login_from_checkout',
		'woocommerce_enable_shipping_calc',
		'woocommerce_enable_review_rating',
		'woocommerce_enable_guest_checkout',
		'woocommerce_enable_coupons',
		'woocommerce_enable_checkout_login_reminder',
		'woocommerce_enable_ajax_add_to_cart',
		'woocommerce_dimension_unit',
		'woocommerce_default_country',
		'woocommerce_default_customer_address',
		'woocommerce_currency_pos',
		'woocommerce_api_enabled',
		'woocommerce_allow_tracking',
	);

	private static $wc_constants_whitelist = array(
		//woocommerce options
		'WC_PLUGIN_FILE',
		'WC_ABSPATH',
		'WC_PLUGIN_BASENAME',
		'WC_VERSION',
		'WOOCOMMERCE_VERSION',
		'WC_ROUNDING_PRECISION',
		'WC_DISCOUNT_ROUNDING_MODE',
		'WC_TAX_ROUNDING_MODE',
		'WC_DELIMITER',
		'WC_LOG_DIR',
		'WC_SESSION_CACHE_GROUP',
		'WC_TEMPLATE_DEBUG_MODE',
	);

	private static $wc_post_meta_whitelist = array(
		//woocommerce products
		'_stock_status',
		'_visibility',
		'total_sales',
		'_downloadable',
		'_virtual',
		'_regular_price',
		'_sale_price',
		'_tax_status',
		'_tax_class',
		'_featured',
		'_price',
		'_stock',
		'_backorders',
		'_manage_stock',

		//woocommerce orders
		'_order_currency',
		'_prices_include_tax',
		'_created_via',
		'_billing_country',
		'_billing_city',
		'_billing_state',
		'_billing_postcode',
		'_shipping_country',
		'_shipping_city',
		'_shipping_state',
		'_shipping_postcode',
		'_payment_method',
		'_payment_method_title',
		'_order_shipping',
		'_cart_discount',
		'_cart_discount_tax',
		'_order_tax',
		'_order_shipping_tax',
		'_order_total',
		'_download_permissions_granted',
		'_recorded_sales',
		'_order_stock_reduced',
	);
}
