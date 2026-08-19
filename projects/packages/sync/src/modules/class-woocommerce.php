<?php
/**
 * WooCommerce sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use WC_Order;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class to handle sync for WooCommerce.
 */
class WooCommerce extends Module {
	/**
	 * Whitelist for order item meta we are interested to sync.
	 *
	 * @access private
	 *
	 * @var array
	 */
	public static $order_item_meta_whitelist = array(
		// See https://github.com/woocommerce/woocommerce/blob/master/includes/data-stores/class-wc-order-item-product-store.php#L20 .
		'_product_id',
		'_variation_id',
		'_qty',
		// Tax ones also included in below class
		// See https://github.com/woocommerce/woocommerce/blob/master/includes/data-stores/class-wc-order-item-fee-data-store.php#L20 .
		'_tax_class',
		'_tax_status',
		'_line_subtotal',
		'_line_subtotal_tax',
		'_line_total',
		'_line_tax',
		'_line_tax_data',
		// See https://github.com/woocommerce/woocommerce/blob/master/includes/data-stores/class-wc-order-item-shipping-data-store.php#L20 .
		'method_id',
		'cost',
		'total_tax',
		'taxes',
		// See https://github.com/woocommerce/woocommerce/blob/master/includes/data-stores/class-wc-order-item-tax-data-store.php#L20 .
		'rate_id',
		'label',
		'compound',
		'tax_amount',
		'shipping_tax_amount',
		// See https://github.com/woocommerce/woocommerce/blob/master/includes/data-stores/class-wc-order-item-coupon-data-store.php .
		'discount_amount',
		'discount_amount_tax',
	);

	/**
	 * Mapping between WooCommerce customer detail user meta keys and customer prop names.
	 *
	 * @access private
	 *
	 * @var array
	 */
	private static $customer_detail_meta_key_to_prop = array(
		'paying_customer'     => 'is_paying_customer',
		'billing_first_name'  => 'billing_first_name',
		'billing_last_name'   => 'billing_last_name',
		'billing_company'     => 'billing_company',
		'billing_address_1'   => 'billing_address_1',
		'billing_address_2'   => 'billing_address_2',
		'billing_city'        => 'billing_city',
		'billing_state'       => 'billing_state',
		'billing_postcode'    => 'billing_postcode',
		'billing_country'     => 'billing_country',
		'billing_email'       => 'billing_email',
		'billing_phone'       => 'billing_phone',
		'shipping_first_name' => 'shipping_first_name',
		'shipping_last_name'  => 'shipping_last_name',
		'shipping_company'    => 'shipping_company',
		'shipping_address_1'  => 'shipping_address_1',
		'shipping_address_2'  => 'shipping_address_2',
		'shipping_city'       => 'shipping_city',
		'shipping_state'      => 'shipping_state',
		'shipping_postcode'   => 'shipping_postcode',
		'shipping_country'    => 'shipping_country',
		'shipping_phone'      => 'shipping_phone',
	);

	/**
	 * Name of the order item database table.
	 *
	 * @access private
	 *
	 * @var string
	 */
	private $order_item_table_name;

	/**
	 * Customer detail meta changes to sync at the end of the request.
	 *
	 * @var array
	 */
	private $customer_meta_updates = array();

	/**
	 * User IDs deleted during the current request.
	 *
	 * @var array
	 */
	private $deleted_user_ids = array();

	/**
	 * Order IDs whose total we've already emitted this request, so an order's total is emitted once
	 * even if both woocommerce_new_order and woocommerce_order_status_changed observe it.
	 *
	 * @var array
	 */
	private $synced_order_total_keys = array();

	/**
	 * Cached list of order statuses WooCommerce considers paid, memoized per request to avoid
	 * re-running wc_get_is_paid_statuses() (and its filters) on every order this request observes.
	 *
	 * @var array|null
	 */
	private $paid_order_statuses = null;

	/**
	 * The table name.
	 *
	 * @access public
	 *
	 * @return string
	 * @deprecated since 3.11.0 Use table() instead.
	 */
	public function table_name() {
		_deprecated_function( __METHOD__, '3.11.0', 'Automattic\\Jetpack\\Sync\\WooCommerce->table' );
		return $this->order_item_table_name;
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
		return $wpdb->prefix . 'woocommerce_order_items';
	}

	/**
	 * The id field in the database.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function id_field() {
		return 'order_item_id';
	}

	/**
	 * The full sync action name for this module.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function full_sync_action_name() {
		return 'jetpack_full_sync_woocommerce_order_items';
	}

	/**
	 * Constructor.
	 *
	 * @global $wpdb
	 *
	 * @todo Should we refactor this to use $this->set_defaults() instead?
	 */
	public function __construct() {
		global $wpdb;
		$this->order_item_table_name = $wpdb->prefix . 'woocommerce_order_items';

		// Options, constants and post meta whitelists.
		add_filter( 'jetpack_sync_options_whitelist', array( $this, 'add_woocommerce_options_whitelist' ), 10 );
		add_filter( 'jetpack_sync_constants_whitelist', array( $this, 'add_woocommerce_constants_whitelist' ), 10 );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'add_woocommerce_post_meta_whitelist' ), 10 );
		add_filter( 'jetpack_sync_comment_meta_whitelist', array( $this, 'add_woocommerce_comment_meta_whitelist' ), 10 );

		add_filter( 'jetpack_sync_before_enqueue_woocommerce_new_order_item', array( $this, 'filter_order_item' ) );
		add_filter( 'jetpack_sync_before_enqueue_jetpack_updated_woo_customer_meta', array( $this, 'filter_customer_updated_meta' ) );

		// Append an order's total to these actions when it reaches a paid status.
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_new_order', array( $this, 'add_order_total_to_new_order' ) );
		add_filter( 'jetpack_sync_before_enqueue_woocommerce_order_status_changed', array( $this, 'add_order_total_to_status_changed' ) );
		add_filter( 'jetpack_sync_whitelisted_comment_types', array( $this, 'add_review_comment_types' ) );

		// Blacklist Action Scheduler comment types.
		add_filter( 'jetpack_sync_prevent_sending_comment_data', array( $this, 'filter_action_scheduler_comments' ), 10, 2 );

		// Preprocess action to be sent by Jetpack sync.
		add_action( 'woocommerce_remove_order_items', array( $this, 'action_woocommerce_remove_order_items' ), 10, 2 );
	}

	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'woocommerce';
	}

	/**
	 * Initialize WooCommerce action listeners.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_listeners( $callable ) {
		// Attributes.
		add_action( 'woocommerce_attribute_added', $callable, 10, 2 );
		add_action( 'woocommerce_attribute_updated', $callable, 10, 3 );
		add_action( 'woocommerce_attribute_deleted', $callable, 10, 3 );

		// Orders. When an order reaches a paid status we append its total to these actions (via the
		// jetpack_sync_before_enqueue_* filters in the constructor) so the Activity Log can aggregate
		// revenue without a dedicated action. We register the extra accepted args so those filters
		// receive the order object WooCommerce already passes (2nd arg here, 4th for the status change)
		// and can avoid reloading it on this hot path; the filters strip the object back out before the
		// action is enqueued, so it is never serialized or sent to WPcom.
		add_action( 'woocommerce_new_order', $callable, 10, 2 );
		add_action( 'woocommerce_order_status_changed', $callable, 10, 4 );
		add_action( 'woocommerce_payment_complete', $callable, 10, 1 );

		// Order items.
		add_action( 'woocommerce_new_order_item', $callable, 10, 4 );
		add_action( 'woocommerce_delete_order_item', $callable, 10, 1 );
		add_action( 'woocommerce_remove_order_item_ids', $callable, 10, 1 );
		$this->init_listeners_for_meta_type( 'order_item', $callable );
		$this->init_meta_whitelist_handler( 'order_item', array( $this, 'filter_meta' ) );

		// Payment tokens.
		add_action( 'woocommerce_new_payment_token', $callable, 10, 1 );
		add_action( 'woocommerce_payment_token_deleted', $callable, 10, 2 );
		add_action( 'woocommerce_payment_token_updated', $callable, 10, 1 );
		$this->init_listeners_for_meta_type( 'payment_token', $callable );

		// Product downloads.
		add_action( 'woocommerce_downloadable_product_download_log_insert', $callable, 10, 1 );
		add_action( 'woocommerce_grant_product_download_access', $callable, 10, 1 );

		// Tax rates.
		// These are ignored on WP.com: tax items are derived from order data via wc_order_tax_lookup, which isn’t present there.
		add_action( 'woocommerce_tax_rate_added', $callable, 10, 2 );
		add_action( 'woocommerce_tax_rate_updated', $callable, 10, 2 );
		add_action( 'woocommerce_tax_rate_deleted', $callable, 10, 1 );

		// Webhooks.
		add_action( 'woocommerce_new_webhook', $callable, 10, 1 );
		add_action( 'woocommerce_webhook_deleted', $callable, 10, 2 );
		add_action( 'woocommerce_webhook_updated', $callable, 10, 1 );

		// Customers.
		add_action( 'added_user_meta', array( $this, 'maybe_sync_customer_meta_update' ), 10, 4 );
		add_action( 'updated_user_meta', array( $this, 'maybe_sync_customer_meta_update' ), 10, 4 );
		add_action( 'deleted_user_meta', array( $this, 'maybe_sync_customer_meta_update' ), 10, 4 );
		add_action( 'delete_user', array( $this, 'action_delete_user' ), 10, 1 );
		add_action( 'wpmu_delete_user', array( $this, 'action_delete_user' ), 10, 1 );
		add_action( 'shutdown', array( $this, 'action_customer_meta_updates' ) );
		add_action( 'jetpack_updated_woo_customer_meta', $callable, 10, 2 );
	}

	/**
	 * Initialize WooCommerce action listeners for full sync.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_woocommerce_order_items', $callable ); // Also sends post meta.
	}

	/**
	 * Retrieve the actions that will be sent for this module during a full sync.
	 *
	 * @access public
	 *
	 * @return array Full sync actions of this module.
	 */
	public function get_full_sync_actions() {
		return array( 'jetpack_full_sync_woocommerce_order_items' );
	}

	/**
	 * Initialize the module in the sender.
	 *
	 * @access public
	 */
	public function init_before_send() {
		// Full sync.
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_woocommerce_order_items', array( $this, 'build_full_sync_action_array' ) );
	}

	/**
	 * Expand the order items properly.
	 *
	 * @access public
	 *
	 * @param array $args The hook arguments.
	 * @return array $args The hook arguments.
	 */
	public function filter_order_item( $args ) {
		// Make sure we always have all the data - prior to WooCommerce 3.0 we only have the user supplied data in the second argument and not the full details.
		$args[1] = $this->build_order_item( $args[0] );
		return $args;
	}

	/**
	 * Append an order's total to the synced woocommerce_new_order args when it is paid.
	 *
	 * A brand new order can be created already in a paid status, in which case no status transition
	 * fires and only woocommerce_new_order observes the payment. When the order is paid we append a
	 * trailing order-total payload (total, currency) that the Activity Log aggregates into
	 * revenue; otherwise only the order ID is synced (the action still syncs for other purposes).
	 *
	 * @since 4.44.0 Appends a trailing [ 'total', 'currency' ] payload when the new order is paid.
	 *
	 * @param array $args Hook args: [ order_id, WC_Order ]. The order object is WooCommerce's 2nd arg.
	 * @return array|false The args ( [ order_id ] ), with a trailing order-total payload appended when paid, or false when invalid.
	 */
	public function add_order_total_to_new_order( $args ) {
		if ( ! is_array( $args ) || count( $args ) < 1 || ! is_numeric( $args[0] ) || (int) $args[0] <= 0 ) {
			return false;
		}

		$order_id = (int) $args[0];

		// Only use the order object WooCommerce passes as the 2nd arg; avoid wc_get_order on this hot path.
		$order = ( isset( $args[1] ) && $args[1] instanceof WC_Order ) ? $args[1] : null;

		// Rebuild the scalar arg shape WPcom expects. This also drops the WC_Order object the listener now
		// receives so it is never enqueued or serialized into the sync queue.
		$args = array( $order_id );
		if ( $order && $this->is_paid_order_status( $order->get_status() ) ) {
			$args = $this->maybe_append_order_total( $args, $order );
		}

		return $args;
	}

	/**
	 * Append an order's total to the synced woocommerce_order_status_changed args on payment.
	 *
	 * We emit on the transition *into* a paid status from a non-paid one — the payment moment — and
	 * skip paid -> paid steps (e.g. processing -> completed) so a fulfillment doesn't re-emit. When
	 * emitted we append a trailing order-total payload (total, currency) the Activity Log
	 * reads; otherwise only [ order_id, status_from, status_to ] is synced (the action still syncs for
	 * other purposes).
	 *
	 * @since 4.44.0 Appends a trailing [ 'total', 'currency' ] payload on the paid transition.
	 *
	 * @param array $args Hook args: [ order_id, status_from, status_to, WC_Order ]. The order is the 4th arg.
	 * @return array|false The args ( [ order_id, status_from, status_to ] ), with a trailing payload on the paid transition, or false when invalid.
	 */
	public function add_order_total_to_status_changed( $args ) {
		if ( ! is_array( $args ) || count( $args ) < 3 || ! is_numeric( $args[0] ) || (int) $args[0] <= 0 ) {
			return false;
		}

		$order_id = (int) $args[0];

		$status_from = $args[1];
		$status_to   = $args[2];
		if ( ! is_string( $status_from ) || ! is_string( $status_to ) ) {
			return false;
		}

		// Only use the order object WooCommerce passes as the 4th arg; avoid wc_get_order on this hot path.
		$order = ( isset( $args[3] ) && $args[3] instanceof WC_Order ) ? $args[3] : null;

		// Rebuild the scalar arg shape WPcom expects. This also drops the WC_Order object the listener now
		// receives so it is never enqueued or serialized into the sync queue.
		$args = array( $order_id, $status_from, $status_to );

		if ( $this->is_paid_order_status( $status_to ) && ! $this->is_paid_order_status( $status_from ) ) {
			$args = $this->maybe_append_order_total( $args, $order );
		}

		return $args;
	}

	/**
	 * Append the order-total payload to the given args when this is the order's paid moment.
	 *
	 * @param array         $args  The scalar args built so far for the action.
	 * @param WC_Order|null $order Order object, or null when WooCommerce did not pass one.
	 * @return array The args, with a trailing order-total payload appended when emitted.
	 */
	private function maybe_append_order_total( $args, $order ) {
		if ( $order && $this->claim_order_total_emission( $order ) ) {
			$payload = $this->build_order_total_payload( $order );

			if ( $payload !== null ) {
				$args[] = $payload;
			}
		}

		return $args;
	}

	/**
	 * Claim the once-per-request emission slot for an order's total.
	 *
	 * Test-and-set: returns true (and records the claim) the first time it's called for an order this
	 * request, false thereafter — so the woocommerce_new_order and woocommerce_order_status_changed
	 * hooks don't both emit a freshly created paid order. Callers must confirm the order is paid first.
	 *
	 * @param WC_Order $order Order object.
	 * @return bool True when the caller obtained the claim and should emit.
	 */
	private function claim_order_total_emission( $order ) {
		$key = $order->get_id();
		if ( isset( $this->synced_order_total_keys[ $key ] ) ) {
			return false;
		}
		$this->synced_order_total_keys[ $key ] = true;

		return true;
	}

	/**
	 * Build the trailing order-total payload appended to a paid order's synced action args.
	 *
	 * Intentionally minimal and scalar-only so it is safe to store and index on WPcom (Activity Log,
	 * Elasticsearch, MCP integrations). We read with the 'edit' context to get the raw stored values and
	 * skip the woocommerce_order_get_total / _currency view filters (e.g. multi-currency display
	 * conversion), then still normalize the total to a numeric string and cast the currency rather than
	 * trust whatever WooCommerce returns.
	 *
	 * @param WC_Order $order Order object.
	 * @return null|array {
	 *     @type string   $total       Order total as a numeric string.
	 *     @type string   $currency    Order currency code (e.g. 'USD').
	 * }
	 */
	private function build_order_total_payload( $order ) {
		$total = $order->get_total( 'edit' );

		if ( $total <= 0 ) {
			return null;
		}

		return array(
			'total'    => function_exists( 'wc_format_decimal' ) ? wc_format_decimal( $total ) : (string) $total,
			'currency' => (string) $order->get_currency( 'edit' ),
		);
	}

	/**
	 * Whether an order status is one WooCommerce considers paid (and whose total we therefore sync).
	 *
	 * Uses WooCommerce's canonical, filterable list (wc_get_is_paid_statuses(), default 'processing'
	 * and 'completed', un-prefixed) so stores that register custom paid statuses are covered.
	 *
	 * @param string $status Order status without the `wc-` prefix (e.g. 'processing').
	 * @return bool True when WooCommerce treats the status as paid.
	 */
	private function is_paid_order_status( $status ) {
		// Fail fast on empty/invalid input (e.g. a missing status arg) before the WooCommerce lookup.
		if ( ! is_string( $status ) || '' === $status || ! function_exists( 'wc_get_is_paid_statuses' ) ) {
			return false;
		}

		if ( null === $this->paid_order_statuses ) {
			$this->paid_order_statuses = wc_get_is_paid_statuses();
		}

		return in_array( $status, $this->paid_order_statuses, true );
	}

	/**
	 * Validate the minimal customer meta update payload before enqueueing.
	 *
	 * @param array $args Hook arguments.
	 * @return array|false Minimal user object and changed prop names, or false when invalid.
	 */
	public function filter_customer_updated_meta( $args ) {
		if (
			! is_array( $args )
			|| ! isset( $args[0] )
			|| ! isset( $args[1] )
			|| ! is_object( $args[0] )
			|| ! isset( $args[0]->data )
			|| ! is_object( $args[0]->data )
			|| ! isset( $args[0]->data->ID )
			|| ! is_numeric( $args[0]->data->ID )
			|| ! is_array( $args[1] )
		) {
			return false;
		}

		$customer_id = (int) $args[0]->data->ID;
		if ( $customer_id <= 0 ) {
			return false;
		}

		$updated_props = $this->get_customer_detail_props( $args[1] );
		if ( empty( $updated_props ) ) {
			return false;
		}

		return array( $this->build_minimal_customer_user_object( $customer_id ), $updated_props );
	}

	/**
	 * Track updated WooCommerce customer meta props for syncing.
	 *
	 * @param int|array $meta_id  ID of the meta object, or IDs for deleted meta.
	 * @param int       $user_id  User ID.
	 * @param string    $meta_key Meta key.
	 * @param mixed     $value    Meta value.
	 */
	public function maybe_sync_customer_meta_update( $meta_id, $user_id, $meta_key, $value ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$customer_id = (int) $user_id;
		if ( $customer_id <= 0 ) {
			return;
		}

		if ( 'deleted_user_meta' === current_action() && isset( $this->deleted_user_ids[ $customer_id ] ) ) {
			return;
		}

		if ( ! is_string( $meta_key ) && ! is_numeric( $meta_key ) ) {
			return;
		}

		$meta_key = sanitize_key( (string) $meta_key );
		if ( ! isset( self::$customer_detail_meta_key_to_prop[ $meta_key ] ) ) {
			return;
		}

		$updated_prop = self::$customer_detail_meta_key_to_prop[ $meta_key ];

		if ( ! isset( $this->customer_meta_updates[ $customer_id ] ) ) {
			$this->customer_meta_updates[ $customer_id ] = array();
		}

		$this->customer_meta_updates[ $customer_id ][ $updated_prop ] = true;
	}

	/**
	 * Mark a deleted user so customer meta cleanup does not sync as profile changes.
	 *
	 * @param int $user_id User ID.
	 */
	public function action_delete_user( $user_id ) {
		$customer_id = (int) $user_id;
		if ( $customer_id <= 0 ) {
			return;
		}

		$this->deleted_user_ids[ $customer_id ] = true;
		unset( $this->customer_meta_updates[ $customer_id ] );
	}

	/**
	 * Send batched WooCommerce customer meta updates.
	 */
	public function action_customer_meta_updates() {
		if ( empty( $this->customer_meta_updates ) ) {
			return;
		}

		$customer_meta_updates       = $this->customer_meta_updates;
		$this->customer_meta_updates = array();

		foreach ( $customer_meta_updates as $customer_id => $updated_props ) {
			if ( isset( $this->deleted_user_ids[ (int) $customer_id ] ) ) {
				continue;
			}

			/**
			 * Fires when WooCommerce customer details stored in user meta are updated.
			 *
			 * @param object $customer      Minimal WP_User-shaped customer object.
			 * @param array  $updated_props Updated customer detail prop names.
			 */
			do_action(
				'jetpack_updated_woo_customer_meta',
				$this->build_minimal_customer_user_object( (int) $customer_id ),
				array_keys( $updated_props )
			);
		}
	}

	/**
	 * Retrieve whitelisted WooCommerce customer detail props.
	 *
	 * @param array $props Customer detail meta keys or prop names.
	 * @return array Customer detail prop names.
	 */
	private function get_customer_detail_props( $props ) {
		$updated_props = array();
		foreach ( $props as $prop ) {
			if ( ! is_string( $prop ) && ! is_numeric( $prop ) ) {
				continue;
			}

			$prop = sanitize_key( (string) $prop );
			if ( isset( self::$customer_detail_meta_key_to_prop[ $prop ] ) ) {
				$updated_props[] = self::$customer_detail_meta_key_to_prop[ $prop ];
				continue;
			}

			if ( in_array( $prop, self::$customer_detail_meta_key_to_prop, true ) ) {
				$updated_props[] = $prop;
			}
		}

		return array_values( array_unique( $updated_props ) );
	}

	/**
	 * Build a minimal WP_User-shaped object for Activity Log.
	 *
	 * @param int $customer_id Customer user ID.
	 * @return object Minimal user object.
	 */
	private function build_minimal_customer_user_object( $customer_id ) {
		$user_data = (object) array(
			'ID'           => $customer_id,
			'display_name' => '',
			'user_login'   => '',
			'user_email'   => '',
		);

		$user = get_userdata( $customer_id );
		if ( $user ) {
			$user_data->display_name = (string) $user->display_name;
			$user_data->user_login   = (string) $user->user_login;
			$user_data->user_email   = (string) $user->user_email;
		}

		return (object) array(
			'ID'   => $customer_id,
			'data' => $user_data,
		);
	}

	/**
	 * Handler for filtering out non-whitelisted order item meta.
	 *
	 * @since 4.22.3
	 *
	 * @param array $args Hook arguments.
	 * @return array|false False if not whitelisted, the original hook args otherwise.
	 */
	public function filter_meta( $args ) {
		if (
			! empty( $args[2] ) && $this->is_whitelisted_order_item_meta( $args[2] )
		) {
			return $args;
		}

		return false;
	}

	/**
	 * Whether an order item meta key is whitelisted for sync.
	 *
	 * @access public
	 *
	 * @since 4.22.3
	 *
	 * @param string $meta_key Order item meta key.
	 * @return bool True if whitelisted.
	 */
	public function is_whitelisted_order_item_meta( $meta_key ) {
		return is_string( $meta_key ) && in_array( $meta_key, self::$order_item_meta_whitelist, true );
	}

	/**
	 * Retrieve the order item ids to be removed and send them as one action
	 *
	 * @param WC_Order $order The order argument.
	 * @param string   $type Order item type.
	 */
	public function action_woocommerce_remove_order_items( WC_Order $order, $type ) {
		if ( $type ) {
			$order_items = $order->get_items( $type );
		} else {
			$order_items = $order->get_items();
		}
		$order_item_ids = array_keys( $order_items );

		if ( $order_item_ids ) {
			do_action( 'woocommerce_remove_order_item_ids', $order_item_ids );
		}
	}

	/**
	 * Expand order item IDs to order items and their meta.
	 *
	 * @access public
	 *
	 * @todo Refactor table name to use a $wpdb->prepare placeholder.
	 *
	 * @param array $args The hook arguments.
	 * @return array $args Expanded order items with meta.
	 * @deprecated since 4.7.0
	 */
	public function expand_order_item_ids( $args ) {
		_deprecated_function( __METHOD__, '4.7.0' );
		$order_item_ids = $args[0];

		global $wpdb;

		$order_item_ids_sql = implode( ', ', array_map( 'intval', $order_item_ids ) );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$order_items = $wpdb->get_results(
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			"SELECT * FROM $this->order_item_table_name WHERE order_item_id IN ( $order_item_ids_sql )"
		);

		return array(
			$order_items,
			$this->get_metadata( $order_item_ids, 'order_item', static::$order_item_meta_whitelist ),
		);
	}
	/**
	 * Extract the full order item from the database by its ID.
	 *
	 * @access public
	 *
	 * @param int $order_item_id Order item ID.
	 * @return object Order item.
	 */
	public function build_order_item( $order_item_id ) {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Direct database access is intentional; caching is not required for this query.
		return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM %i WHERE order_item_id = %d', $this->order_item_table_name, $order_item_id ) );
	}

	/**
	 * Enqueue the WooCommerce actions for full sync.
	 *
	 * @access public
	 *
	 * @param array   $config               Full sync configuration for this sync module.
	 * @param int     $max_items_to_enqueue Maximum number of items to enqueue.
	 * @param boolean $state                True if full sync has finished enqueueing this module, false otherwise.
	 * @return array Number of actions enqueued, and next module state.
	 */
	public function enqueue_full_sync_actions( $config, $max_items_to_enqueue, $state ) {
		return $this->enqueue_all_ids_as_action( 'jetpack_full_sync_woocommerce_order_items', $this->order_item_table_name, 'order_item_id', $this->get_where_sql( $config ), $max_items_to_enqueue, $state );
	}

	/**
	 * Retrieve an estimated number of actions that will be enqueued.
	 *
	 * @access public
	 *
	 * @todo Refactor the SQL query to use $wpdb->prepare().
	 *
	 * @param array $config Full sync configuration for this sync module.
	 * @return int Number of items yet to be enqueued.
	 */
	public function estimate_full_sync_actions( $config ) {
		global $wpdb;

		$query = "SELECT count(*) FROM $this->order_item_table_name WHERE " . $this->get_where_sql( $config );
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = (int) $wpdb->get_var( $query );

		return (int) ceil( $count / self::ARRAY_CHUNK_SIZE );
	}

	/**
	 * Retrieve the WHERE SQL clause based on the module config.
	 *
	 * @access private
	 *
	 * @param array $config Full sync configuration for this sync module.
	 * @return string WHERE SQL clause.
	 */
	public function get_where_sql( $config ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return '1=1';
	}

	/**
	 * Add WooCommerce options to the options whitelist.
	 *
	 * @param array $list Existing options whitelist.
	 * @return array Updated options whitelist.
	 */
	public function add_woocommerce_options_whitelist( $list ) {
		return array_merge( $list, self::$wc_options_whitelist );
	}

	/**
	 * Add WooCommerce constants to the constants whitelist.
	 *
	 * @param array $list Existing constants whitelist.
	 * @return array Updated constants whitelist.
	 */
	public function add_woocommerce_constants_whitelist( $list ) {
		return array_merge( $list, self::$wc_constants_whitelist );
	}

	/**
	 * Add WooCommerce post meta to the post meta whitelist.
	 *
	 * @param array $list Existing post meta whitelist.
	 * @return array Updated post meta whitelist.
	 */
	public function add_woocommerce_post_meta_whitelist( $list ) {
		return array_merge( $list, self::$wc_post_meta_whitelist );
	}

	/**
	 * Add WooCommerce comment meta to the comment meta whitelist.
	 *
	 * @param array $list Existing comment meta whitelist.
	 * @return array Updated comment meta whitelist.
	 */
	public function add_woocommerce_comment_meta_whitelist( $list ) {
		return array_merge( $list, self::$wc_comment_meta_whitelist );
	}

	/**
	 * Adds 'revew' to the list of comment types so Sync will listen for status changes on 'reviews'.
	 *
	 * @access public
	 *
	 * @param array $comment_types The list of comment types prior to this filter.
	 * return array                The list of comment types with 'review' added.
	 */
	public function add_review_comment_types( $comment_types ) {
		if ( is_array( $comment_types ) ) {
			$comment_types[] = 'review';
		}
		return $comment_types;
	}

	/**
	 * Stop comments from the Action Scheduler from being synced.
	 * https://github.com/woocommerce/woocommerce/tree/e7762627c37ec1f7590e6cac4218ba0c6a20024d/includes/libraries/action-scheduler
	 *
	 * @since 1.6.3
	 * @since-jetpack 7.7.0
	 *
	 * @param boolean $can_sync Should we prevent comment data from bing synced to WordPress.com.
	 * @param mixed   $comment  WP_COMMENT object.
	 *
	 * @return bool
	 */
	public function filter_action_scheduler_comments( $can_sync, $comment ) {
		if ( isset( $comment->comment_agent ) && 'ActionScheduler' === $comment->comment_agent ) {
			return true;
		}
		return $can_sync;
	}

	/**
	 * Whitelist for options we are interested to sync.
	 *
	 * @access private
	 * @static
	 *
	 * @var array
	 */
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
		'woocommerce_task_list_hidden',
		'woocommerce_cod_settings',
		'woocommerce_store_address',
		'woocommerce_store_address_2',
		'woocommerce_store_city',
		'woocommerce_store_postcode',
		'woocommerce_admin_install_timestamp',
		'woocommerce_enable_signup_from_checkout_for_subscriptions', // This and the below options relate to the WooCommerce Accounts and Privacy settings page. Required for the Activity Log.
		'woocommerce_enable_myaccount_registration',
		'woocommerce_registration_generate_password',
		'woocommerce_erasure_request_removes_order_data',
		'woocommerce_erasure_request_removes_subscription_data',
		'woocommerce_erasure_request_removes_download_data',
		'woocommerce_allow_bulk_remove_personal_data',
		'woocommerce_registration_privacy_policy_text',
		'woocommerce_checkout_privacy_policy_text',
		'woocommerce_delete_inactive_accounts',
		'woocommerce_trash_pending_orders',
		'woocommerce_trash_failed_orders',
		'woocommerce_trash_cancelled_orders',
		'woocommerce_anonymize_refunded_orders',
		'woocommerce_anonymize_completed_orders',
		'woocommerce_anonymize_ended_subscriptions',
		'woocommerce_enable_delayed_account_creation',
		'woocommerce_gateway_stripe_retention',
		'wc_downloads_approved_directories_mode', // This and the below options relate to the WooCommerce Products settings page. Required for the Activity Log.
		'woocommerce_attribute_lookup_direct_updates',
		'woocommerce_attribute_lookup_enabled',
		'woocommerce_attribute_lookup_optimized_updates',
		'woocommerce_cart_redirect_after_add',
		'woocommerce_downloads_add_hash_to_filename',
		'woocommerce_downloads_count_partial',
		'woocommerce_downloads_deliver_inline',
		'woocommerce_downloads_grant_access_after_payment',
		'woocommerce_downloads_redirect_fallback_allowed',
		'woocommerce_downloads_require_login',
		'woocommerce_enable_reviews',
		'woocommerce_hold_stock_minutes',
		'woocommerce_review_rating_required',
		'woocommerce_review_rating_verification_label',
		'woocommerce_review_rating_verification_required',
		'woocommerce_shop_page_id',
		'woocommerce_stock_email_recipient',
		'woocommerce_stock_format',
		'woocommerce_allowed_countries',  // This and the below options relate to the WooCommerce General settings page. Required for the Activity Log.
		'woocommerce_specific_allowed_countries',
		'woocommerce_ship_to_countries',
		'woocommerce_specific_ship_to_countries',
		'woocommerce_all_except_countries',
		'woocommerce_calc_taxes',
		'woocommerce_calc_discounts_sequentially',
		'woocommerce_analytics_enabled', // This and the below options relate to the WooCommerce Advanced settings page. Required for the Activity Log.
		'woocommerce_cart_page_id',
		'woocommerce_checkout_order_received_endpoint',
		'woocommerce_checkout_page_id',
		'woocommerce_checkout_pay_endpoint',
		'woocommerce_custom_orders_table_data_sync_enabled',
		'woocommerce_custom_orders_table_enabled',
		'woocommerce_feature_block_email_editor_enabled',
		'woocommerce_feature_blueprint_enabled',
		'woocommerce_feature_cost_of_goods_sold_enabled',
		'woocommerce_feature_customer_review_request_enabled',
		'woocommerce_feature_deferred_transactional_emails_enabled',
		'woocommerce_feature_destroy-empty-sessions_enabled',
		'woocommerce_feature_email_improvements_enabled',
		'woocommerce_feature_mcp_integration_enabled',
		'woocommerce_feature_order_attribution_enabled',
		'woocommerce_feature_point_of_sale_enabled',
		'woocommerce_feature_product_instance_caching_enabled',
		'woocommerce_feature_rate_limit_checkout_enabled',
		'woocommerce_feature_remote_logging_enabled',
		'woocommerce_feature_rest_api_caching_enabled',
		'woocommerce_feature_site_visibility_badge_enabled',
		'woocommerce_hpos_datastore_caching_enabled',
		'woocommerce_hpos_fts_index_enabled',
		'woocommerce_logout_endpoint',
		'woocommerce_myaccount_add_payment_method_endpoint',
		'woocommerce_myaccount_delete_payment_method_endpoint',
		'woocommerce_myaccount_downloads_endpoint',
		'woocommerce_myaccount_edit_account_endpoint',
		'woocommerce_myaccount_edit_address_endpoint',
		'woocommerce_myaccount_lost_password_endpoint',
		'woocommerce_myaccount_orders_endpoint',
		'woocommerce_myaccount_page_id',
		'woocommerce_myaccount_payment_methods_endpoint',
		'woocommerce_myaccount_set_default_payment_method_endpoint',
		'woocommerce_myaccount_subscription_payment_method_endpoint',
		'woocommerce_myaccount_subscriptions_endpoint',
		'woocommerce_myaccount_view_order_endpoint',
		'woocommerce_myaccount_view_subscription_endpoint',
		'woocommerce_show_marketplace_suggestions',
		'woocommerce_terms_page_id',
		'woocommerce_pickup_location_settings',  // This and the below options relate to the WooCommerce Shipping settings page. Required for the Activity Log.
		'pickup_location_pickup_locations',
		'woocommerce_ship_to_destination',
		'woocommerce_shipping_cost_requires_address',
		'woocommerce_shipping_debug_mode',
		'woocommerce_shipping_hide_rates_when_free',
		'woocommerce-ppcp-data-payment', // This and the below options relate to the Pay with PayPal payments settings page. Required for the Activity Log.
		'woocommerce-ppcp-data-settings',
		'woocommerce_ppcp-applepay_settings',
		'woocommerce_ppcp-axo-gateway_settings',
		'woocommerce_ppcp-bancontact_settings',
		'woocommerce_ppcp-blik_settings',
		'woocommerce_ppcp-card-button-gateway_settings',
		'woocommerce_ppcp-credit-card-gateway_settings',
		'woocommerce_ppcp-eps_settings',
		'woocommerce-ppcp-data-common',
		'woocommerce-ppcp-data-onboarding',
		'woocommerce_ppcp-googlepay_settings',
		'woocommerce_ppcp-ideal_settings',
		'woocommerce_ppcp-multibanco_settings',
		'woocommerce_ppcp-mybank_settings',
		'woocommerce_ppcp-oxxo-gateway_settings',
		'woocommerce_ppcp-p24_settings',
		'woocommerce_ppcp-pay-upon-invoice-gateway_settings',
		'woocommerce_ppcp-pwc_settings',
		'woocommerce_ppcp-trustly_settings',
		'_wcpay_feature_customer_multi_currency', // This and the below options relate to WooPayments.
		'current_protection_level',
		'woocommerce_woocommerce_payments_apple_pay_settings',
		'woocommerce_woocommerce_payments_google_pay_settings',
		'woocommerce_woocommerce_payments_settings',
		'wc_stripe_agentic_commerce_webhook_secret',  // This and the below options relate to additional payment types.
		'wc_square_settings',
		'woocommerce_amazon_payments_advanced_settings',
		'woocommerce_gift_cards_pay_settings',
		'woocommerce_square_cash_app_pay_settings',
		'woocommerce_square_credit_card_settings',
		'woocommerce_stripe_settings',
		'woocommerce_bacs_accounts', // This and the below options relate to offline payments.
		'woocommerce_bacs_settings',
		'woocommerce_cheque_settings',
		'woocommerce_ppcp-recaptcha_settings', // This and the below options relate to the WooCommerce Integrations settings page. Required for the Activity Log.
		'woocommerce_maxmind_geolocation_settings',
		'woocommerce_store_pages_only', // This and the below options relate to the WooCommerce Site Visibility settings page. Required for the Activity Log.
		'woocommerce_private_link',
		'woocommerce_coming_soon',
		'wcpay_multi_currency_enabled_currencies',  // This and the below option relate to the WooCommerce Multi-Currency settings page. Required for the Activity Log.
		'wcpay_multi_currency_enable_auto_currency',
		'woocommerce_pos_store_name', // This and the below options relate to the WooCommerce Point of Sale settings page. Required for the Activity Log.
		'woocommerce_pos_store_address',
		'woocommerce_pos_store_phone',
		'woocommerce_pos_store_email',
		'woocommerce_pos_refund_returns_policy',
		'wcs_notification_settings_update_time', // This and the below options relate to the WooCommerce Subscriptions settings page. Required for the Activity Log.
		'wcsatt_add_cart_to_subscription',
		'wcsatt_add_product_to_subscription',
		'woocommerce_subscriptions_accept_manual_renewals',
		'woocommerce_subscriptions_allow_switching',
		'woocommerce_subscriptions_allow_switching_product_plans',
		'woocommerce_subscriptions_apportion_length',
		'woocommerce_subscriptions_apportion_recurring_price',
		'woocommerce_subscriptions_apportion_sign_up_fee',
		'woocommerce_subscriptions_cancelled_role',
		'woocommerce_subscriptions_customer_notifications_enabled',
		'woocommerce_subscriptions_customer_notifications_offset',
		'woocommerce_subscriptions_downloads_add_line_items',
		'woocommerce_subscriptions_drip_downloadable_content_on_renewal',
		'woocommerce_subscriptions_enable_auto_renewal_toggle',
		'woocommerce_subscriptions_enable_downloadable_file_linking',
		'woocommerce_subscriptions_enable_early_renewal',
		'woocommerce_subscriptions_enable_retry',
		'woocommerce_subscriptions_enable_simple_subscription',
		'woocommerce_subscriptions_enable_variable_subscription',
		'woocommerce_subscriptions_first_billing_behavior',
		'woocommerce_subscriptions_gifting_default_option',
		'woocommerce_subscriptions_gifting_downloadable_products',
		'woocommerce_subscriptions_gifting_enable_gifting',
		'woocommerce_subscriptions_max_customer_suspensions',
		'woocommerce_subscriptions_multiple_purchase',
		'woocommerce_subscriptions_prorate_physical',
		'woocommerce_subscriptions_subscriber_role',
		'woocommerce_subscriptions_turn_off_automatic_payments',
		'woocommerce_subscriptions_zero_initial_payment_requires_payment',
		'woocommerce_email_from_address', // This and the below options relate to the WooCommerce Emails settings page. Required for the Activity Log.
		'woocommerce_email_from_name',
		'woocommerce_email_reply_to_address',
		'woocommerce_email_reply_to_enabled',
		'woocommerce_email_reply_to_name',
	);

	/**
	 * Whitelist for constants we are interested to sync.
	 *
	 * @access private
	 * @static
	 *
	 * @var array
	 */
	private static $wc_constants_whitelist = array(
		// WooCommerce constants.
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

	/**
	 * Whitelist for post meta we are interested to sync.
	 *
	 * @access private
	 * @static
	 *
	 * @var array
	 */
	public static $wc_post_meta_whitelist = array(
		// WooCommerce products.
		// See https://github.com/woocommerce/woocommerce/blob/8ed6e7436ff87c2153ed30edd83c1ab8abbdd3e9/includes/data-stores/class-wc-product-data-store-cpt.php#L21 .
		'_visibility',
		'_sku',
		'_price',
		'_regular_price',
		'_sale_price',
		'_sale_price_dates_from',
		'_sale_price_dates_to',
		'total_sales',
		'_tax_status',
		'_tax_class',
		'_manage_stock',
		'_backorders',
		'_sold_individually',
		'_weight',
		'_length',
		'_width',
		'_height',
		'_upsell_ids',
		'_crosssell_ids',
		'_purchase_note',
		'_default_attributes',
		'_product_attributes',
		'_virtual',
		'_downloadable',
		'_download_limit',
		'_download_expiry',
		'_featured',
		'_downloadable_files',
		'_wc_rating_count',
		'_wc_average_rating',
		'_wc_review_count',
		'_variation_description',
		'_thumbnail_id',
		'_file_paths',
		'_product_image_gallery',
		'_product_version',
		'_wp_old_slug',

		// Woocommerce orders.
		// See https://github.com/woocommerce/woocommerce/blob/8ed6e7436ff87c2153ed30edd83c1ab8abbdd3e9/includes/data-stores/class-wc-order-data-store-cpt.php#L27 .
		'_order_key',
		'_order_currency',
		// '_billing_first_name', do not sync these as they contain personal data
		// '_billing_last_name',
		// '_billing_company',
		// '_billing_address_1',
		// '_billing_address_2',
		'_billing_city',
		'_billing_state',
		'_billing_postcode',
		'_billing_country',
		// '_billing_email', do not sync these as they contain personal data.
		// '_billing_phone',
		// '_shipping_first_name',
		// '_shipping_last_name',
		// '_shipping_company',
		// '_shipping_address_1',
		// '_shipping_address_2',
		'_shipping_city',
		'_shipping_state',
		'_shipping_postcode',
		'_shipping_country',
		'_completed_date',
		'_paid_date',
		'_cart_discount',
		'_cart_discount_tax',
		'_order_shipping',
		'_order_shipping_tax',
		'_order_tax',
		'_order_total',
		'_payment_method',
		'_payment_method_title',
		// '_transaction_id', do not sync these as they contain personal data.
		// '_customer_ip_address',
		// '_customer_user_agent',
		'_created_via',
		'_order_version',
		'_prices_include_tax',
		'_date_completed',
		'_date_paid',
		'_payment_tokens',
		// '_billing_address_index', do not sync these as they contain personal data.
		// '_shipping_address_index',
		'_recorded_sales',
		'_recorded_coupon_usage_counts',
		// See https://github.com/woocommerce/woocommerce/blob/8ed6e7436ff87c2153ed30edd83c1ab8abbdd3e9/includes/data-stores/class-wc-order-data-store-cpt.php#L539 .
		'_download_permissions_granted',
		// See https://github.com/woocommerce/woocommerce/blob/8ed6e7436ff87c2153ed30edd83c1ab8abbdd3e9/includes/data-stores/class-wc-order-data-store-cpt.php#L594 .
		'_order_stock_reduced',
		'_cart_hash',

		// Woocommerce order refunds.
		// See https://github.com/woocommerce/woocommerce/blob/b8a2815ae546c836467008739e7ff5150cb08e93/includes/data-stores/class-wc-order-refund-data-store-cpt.php#L20 .
		'_order_currency',
		'_refund_amount',
		'_refunded_by',
		'_refund_reason',
		'_order_shipping',
		'_order_shipping_tax',
		'_order_tax',
		'_order_total',
		'_order_version',
		'_prices_include_tax',
		'_payment_tokens',
	);

	/**
	 * Whitelist for comment meta we are interested to sync.
	 *
	 * @access private
	 * @static
	 *
	 * @var array
	 */
	private static $wc_comment_meta_whitelist = array(
		'rating',
	);

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
		switch ( $object_type ) {
			case 'order_item':
				return $this->get_order_item_by_ids( $ids );
		}

		return new WP_Error( 'unsupported_object_type', 'Unsupported object type' );
	}

	/**
	 * Returns a list of order_item objects by their IDs.
	 *
	 * @param array  $ids List of order_item IDs to fetch.
	 * @param string $order Either 'ASC' or 'DESC'.
	 *
	 * @access public
	 *
	 * @return array|object|null
	 */
	public function get_order_item_by_ids( $ids, $order = '' ) {
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

		$query = "SELECT * FROM {$this->order_item_table_name} WHERE order_item_id IN ( $placeholders )";
		if ( ! empty( $order ) && in_array( $order, array( 'ASC', 'DESC' ), true ) ) {
			$query .= " ORDER BY order_item_id $order";
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		return $wpdb->get_results( $wpdb->prepare( $query, $ids ), ARRAY_A );
	}

	/**
	 * Build the full sync action object for WooCommerce order items.
	 *
	 * @access public
	 *
	 * @param array $args An array with the order items and the previous end.
	 *
	 * @return array An array with the order items, order item meta and the previous end.
	 */
	public function build_full_sync_action_array( $args ) {
		list( $filtered_order_items, $previous_end ) = $args;
		return array(
			'order_items'     => $filtered_order_items['objects'],
			'order_item_meta' => $filtered_order_items['meta'],
			'previous_end'    => $previous_end,
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

		$order_item_ids = parent::get_next_chunk( $config, $status, $chunk_size );

		if ( empty( $order_item_ids ) ) {
			return array();
		}
		// Fetch the order items in DESC order for the next chunk logic to work.
		$order_items = $this->get_order_item_by_ids( $order_item_ids, 'DESC' );

		// If no orders were fetched, make sure to return the expected structure so that status is updated correctly.
		if ( empty( $order_items ) ) {
			return array(
				'object_ids' => $order_item_ids,
				'objects'    => array(),
			);
		}

		// Get the order IDs from the orders that were fetched.
		$fetched_order_item_ids = wp_list_pluck( $order_items, 'order_item_id' );
		$metadata               = $this->get_metadata( $fetched_order_item_ids, 'order_item', static::$order_item_meta_whitelist );

		// Filter the orders and metadata based on the maximum size constraints.
		list( $filtered_order_item_ids, $filtered_order_items, $filtered_order_items_metadata ) = $this->filter_objects_and_metadata_by_size(
			'order_item',
			$order_items,
			$metadata,
			self::MAX_META_LENGTH,
			self::MAX_SIZE_FULL_SYNC
		);

		return array(
			'object_ids' => $filtered_order_item_ids,
			'objects'    => $filtered_order_items,
			'meta'       => $filtered_order_items_metadata,
		);
	}
}
