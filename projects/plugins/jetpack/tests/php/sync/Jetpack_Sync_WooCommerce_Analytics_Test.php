<?php

use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics;
use Automattic\Jetpack\Sync\Replicastore\Table_Checksum;
use Automattic\WooCommerce\Admin\API\Reports\Orders\Stats\DataStore as OrderStatsDataStore;
use Automattic\WooCommerce\Caches\OrderCache;
use Automattic\WooCommerce\Utilities\OrderUtil;
use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/Jetpack_Sync_TestBase.php';
require_once __DIR__ . '/../trait-woo-tests.php';

/**
 * Integration tests for the shared WooCommerce Analytics Sync module.
 *
 * @group woocommerce
 */
#[Group( 'woocommerce' )]
class Jetpack_Sync_WooCommerce_Analytics_Test extends Jetpack_Sync_TestBase {
	/**
	 * Load WooCommerce's PHPUnit framework and helpers.
	 */
	use WooCommerceTestTrait;

	/**
	 * Sync module instances initialized before this test.
	 *
	 * @var array|null
	 */
	private $original_sync_modules;

	/**
	 * Set up.
	 */
	public function set_up() {
		if ( ! self::$woo_enabled ) {
			$this->markTestSkipped();
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
		}

		parent::set_up();

		$this->original_sync_modules = Modules::get_modules();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		if ( null !== $this->original_sync_modules ) {
			$this->set_sync_modules( $this->original_sync_modules );
		}

		parent::tear_down();
	}

	/**
	 * Analytics checksum tables are available when the module is active.
	 */
	public function test_analytics_checksum_tables_are_available_when_module_is_active() {
		$this->enable_analytics_module();

		foreach ( array( 'wc_order_stats', 'wc_order_product_lookup', 'wc_order_coupon_lookup', 'wc_order_tax_lookup' ) as $table ) {
			$this->assertInstanceOf( Table_Checksum::class, new Table_Checksum( $table ) );
		}
	}

	/**
	 * Analytics checksum tables reject use when the module is absent.
	 */
	public function test_analytics_checksum_tables_require_module() {
		$this->expectException( Exception::class );

		// @phan-suppress-next-line PhanNoopNew -- Expecting the constructor to throw.
		new Table_Checksum( 'wc_order_stats' );
	}

	/**
	 * A real WooCommerce order is expanded into the Analytics reports payload.
	 */
	public function test_order_payload_contains_product_coupon_and_tax_data() {
		list( $order, $product, $coupon ) = $this->create_analytics_order();

		$payload = ( new WooCommerce_Analytics() )->get_object_by_id( 'order', $order->get_id() );

		$this->assertSame( $order->get_id(), $payload['order_stats']['order_id'] );
		$this->assertSame( 2, $payload['order_stats']['num_items_sold'] );
		$this->assertSame( 3.5, (float) $payload['order_stats']['tax_total'] );
		$this->assertSame( 5.0, (float) $payload['order_stats']['discount_total'] );

		$this->assertSame( $product->get_id(), $payload['order_product_data'][0]['product_id'] );
		$this->assertSame( 2, $payload['order_product_data'][0]['product_qty'] );
		$this->assertSame( 3.5, (float) $payload['order_product_data'][0]['tax_amount'] );

		$this->assertSame( $coupon->get_id(), $payload['order_coupon_data'][0]['coupon_id'] );
		$this->assertSame( $coupon->get_code(), $payload['order_coupon_data'][0]['coupon_code'] );
		$this->assertSame( 5.0, (float) $payload['order_coupon_data'][0]['discount_amount'] );

		$this->assertSame( 'SYNC-TEST-10', $payload['order_tax_data'][0]['tax_rate_code'] );
		$this->assertSame( 3.5, (float) $payload['order_tax_data'][0]['total_tax'] );
	}

	/**
	 * A real WooCommerce refund is expanded with negative order, product, and tax values.
	 */
	public function test_refund_payload_preserves_parent_and_negative_values() {
		list( $order ) = $this->create_analytics_order();

		$product_item = current( $order->get_items( 'line_item' ) );
		$refund       = wc_create_refund(
			array(
				'amount'         => 19.25,
				'order_id'       => $order->get_id(),
				'refund_payment' => false,
				'restock_items'  => false,
				'line_items'     => array(
					$product_item->get_id() => array(
						'qty'          => 1,
						'refund_total' => 17.5,
						'refund_tax'   => array( 1 => 1.75 ),
					),
				),
			)
		);

		$this->assertNotWPError( $refund );

		$payload = ( new WooCommerce_Analytics() )->get_object_by_id( 'order', $refund->get_id() );

		$this->assertSame( $order->get_id(), $payload['order_stats']['parent_id'] );
		$this->assertSame( -19.25, (float) $payload['order_stats']['total_sales'] );
		$this->assertSame( -1.75, (float) $payload['order_stats']['tax_total'] );
		$this->assertSame( -1, $payload['order_product_data'][0]['product_qty'] );
		$this->assertSame( -17.5, (float) $payload['order_product_data'][0]['product_net_revenue'] );
		$this->assertSame( -1.75, (float) $payload['order_tax_data'][0]['total_tax'] );
	}

	/**
	 * A partial refund followed by a full refund does not double-count the returns amount (woocommerce/woocommerce#66320).
	 */
	public function test_partial_then_full_refund_does_not_double_count_returns() {
		$this->skip_before_woocommerce( '11.1' );
		$order = $this->create_completed_refundable_order();

		$partial = $this->refund(
			$order,
			20.00,
			array(
				array_key_first( $order->get_items() ) => array(
					'qty'          => 2,
					'refund_total' => 20.00,
				),
			)
		);
		$full    = $this->refund( $order, (float) $order->get_total() - (float) $order->get_total_refunded() );
		$full->update_meta_data( '_refund_type', 'full' );
		$full->save_meta_data();
		$this->clear_order_cache( $full->get_id() );

		$partial_row = $this->get_synced_order_stats_matching_core( $partial->get_id() );
		$full_row    = $this->get_synced_order_stats_matching_core( $full->get_id() );

		$this->assertEqualsWithDelta( -55.00, $partial_row['net_total'] + $partial_row['tax_total'] + $partial_row['shipping_total'] + $full_row['net_total'] + $full_row['tax_total'] + $full_row['shipping_total'], 0.02 );
		$this->assertEqualsWithDelta( -40.00, $partial_row['net_total'] + $full_row['net_total'], 0.02 );
	}

	/**
	 * A sole lump-sum refund of the whole order without a refund type takes its amounts from the order (woocommerce/woocommerce#64106).
	 */
	public function test_lump_sum_full_refund_without_refund_type_uses_parent_net_total() {
		$this->skip_before_woocommerce( '10.9' );
		$order  = $this->create_completed_refundable_order();
		$refund = $this->refund( $order, (float) $order->get_total() );
		$refund->delete_meta_data( '_refund_type' );
		$refund->save_meta_data();
		$this->clear_order_cache( $refund->get_id() );

		$row = $this->get_synced_order_stats_matching_core( $refund->get_id() );

		$this->assertEqualsWithDelta( -40.00, $row['net_total'], 0.02 );
	}

	/**
	 * A lump-sum refund of a never-paid order has no paid or completed date from WooCommerce 11.2 (woocommerce/woocommerce#67710).
	 */
	public function test_refund_of_never_paid_order_matches_core_dates() {
		$order = $this->create_refundable_order();
		$order->set_status( 'failed' );
		$order->save();

		// Setting the status to "refunded" fires wc_order_fully_refunded(), creating the lump-sum refund.
		$order->update_status( 'refunded' );
		$refunds = $order->get_refunds();
		$this->assertCount( 1, $refunds );

		// Before 11.2 core backfills both dates; matching core's row covers that case.
		$row = $this->get_synced_order_stats_matching_core( reset( $refunds )->get_id() );

		if ( version_compare( WC_VERSION, '11.2', '>=' ) ) {
			$this->assertNull( $row['date_paid'] );
			$this->assertNull( $row['date_completed'] );
		}
	}

	/**
	 * A refund's paid and completed dates follow core's stored row, which keeps the dates an older WooCommerce wrote.
	 */
	public function test_refund_dates_follow_stored_order_stats_row() {
		global $wpdb;

		$order  = $this->create_completed_refundable_order();
		$refund = $this->refund( $order, (float) $order->get_total() );
		OrderStatsDataStore::sync_order( $refund->get_id() );

		$wpdb->update( "{$wpdb->prefix}wc_order_stats", array( 'date_paid' => null ), array( 'order_id' => $refund->get_id() ) );
		$synced = ( new WooCommerce_Analytics() )->get_object_by_id( 'order', $refund->get_id() )['order_stats'];

		$this->assertNull( $synced['date_paid'] );
		$this->assertEquals( $synced['date_created'], $synced['date_completed'] );
	}

	/**
	 * Incremental Analytics sync emits the expanded reports payload for a real order.
	 */
	public function test_incremental_sync_emits_real_order_payload() {
		list( $order ) = $this->create_analytics_order();

		$module        = $this->enable_analytics_module();
		$handler       = array( $this->listener, 'action_handler' );
		$update_action = version_compare( WC_VERSION, '10.3', '>=' )
			? 'woocommerce_order_scheduler_after_import_order'
			: 'woocommerce_analytics_update_order_stats';

		$module->init_listeners( $handler );
		$this->server_event_storage->reset();

		try {
			do_action( $update_action, $order->get_id() );
			$this->sender->do_sync();
			$event = $this->server_event_storage->get_most_recent_event( 'woocommerce_analytics_sync_reports_data' );
		} finally {
			$this->remove_analytics_module_listeners( $module, $handler );
		}

		$this->assertNotFalse( $event );
		$this->assertSame( $order->get_id(), $event->args['order_stats']['order_id'] );
		$this->assertSame( 2, $event->args['order_stats']['num_items_sold'] );
		$this->assertSame( 3.5, (float) $event->args['order_tax_data'][0]['total_tax'] );
	}

	/**
	 * Full sync reads a real Analytics order-stats row and expands its order payload.
	 */
	public function test_full_sync_chunk_contains_real_order_payload() {
		list( $order ) = $this->create_analytics_order();

		$this->assertNotSame( -1, OrderStatsDataStore::sync_order( $order->get_id() ) );

		$module = new WooCommerce_Analytics();
		$chunk  = $module->get_next_chunk(
			array(),
			array( 'last_sent' => $module->get_initial_last_sent() ),
			10
		);
		$action = $module->build_full_sync_action_array( array( $chunk, null ) );

		$this->assertContains( $order->get_id(), $chunk['object_ids'] );
		$this->assertArrayHasKey( $order->get_id(), $action['orders'] );
		$this->assertSame( $order->get_id(), $action['orders'][ $order->get_id() ]['order_stats']['order_id'] );
		$this->assertSame( 3.5, (float) $action['orders'][ $order->get_id() ]['order_tax_data'][0]['total_tax'] );
	}

	/**
	 * Create a pending order as WooCommerce's WC_Helper_Order::create_order() does: 4 x $10 product + $10 shipping.
	 *
	 * @return WC_Order
	 */
	private function create_refundable_order() {
		$product_item = new WC_Order_Item_Product();
		$product_item->set_product( WC_Helper_Product::create_simple_product() );
		$product_item->set_quantity( 4 );
		$product_item->set_subtotal( '40' );
		$product_item->set_total( '40' );

		$shipping_item = new WC_Order_Item_Shipping();
		$shipping_item->set_total( '10' );

		$order = wc_create_order( array( 'status' => 'pending' ) );
		$order->add_item( $product_item );
		$order->add_item( $shipping_item );
		$order->set_shipping_total( '10' );
		$order->set_total( '50' );
		$order->save();

		return $order;
	}

	/**
	 * Create a completed order with the full-refund data format on: net 40 + tax 5 + shipping 10 = 55.
	 *
	 * @return WC_Order
	 */
	private function create_completed_refundable_order() {
		update_option( 'woocommerce_db_version', '10.2.0' );
		update_option( 'woocommerce_analytics_uses_old_full_refund_data', 'no' );

		$order = $this->create_refundable_order();
		$order->set_cart_tax( '5.00' );
		$order->set_total( '55.00' );
		$order->save();
		$order->update_status( 'completed' );

		return $order;
	}

	/**
	 * Refund an order.
	 *
	 * @param WC_Order $order      Order.
	 * @param float    $amount     Refund amount.
	 * @param array    $line_items Refunded line items.
	 * @return WC_Order_Refund
	 */
	private function refund( $order, $amount, $line_items = array() ) {
		$refund = wc_create_refund(
			array(
				'order_id'   => $order->get_id(),
				'amount'     => $amount,
				'line_items' => $line_items,
			)
		);
		$this->assertInstanceOf( WC_Order_Refund::class, $refund );

		return $refund;
	}

	/**
	 * Drop an order from WooCommerce's order cache after changing its meta directly.
	 *
	 * @param int $order_id Order ID.
	 */
	private function clear_order_cache( $order_id ) {
		if ( OrderUtil::orders_cache_usage_is_enabled() ) {
			wc_get_container()->get( OrderCache::class )->remove( $order_id );
		}
	}

	/**
	 * Get an order's synced order stats, asserting they match the row core writes for it, except the status.
	 *
	 * @param int $order_id Order or refund ID.
	 * @return array The synced order stats.
	 */
	private function get_synced_order_stats_matching_core( $order_id ) {
		global $wpdb;

		OrderStatsDataStore::sync_order( $order_id );
		$core_row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}wc_order_stats WHERE order_id = %d", $order_id ), ARRAY_A );
		$synced   = ( new WooCommerce_Analytics() )->get_object_by_id( 'order', $order_id )['order_stats'];

		$this->assertIsArray( $core_row );

		$this->assertSame( (int) $core_row['num_items_sold'], $synced['num_items_sold'] );
		foreach ( array( 'total_sales', 'tax_total', 'shipping_total', 'net_total' ) as $column ) {
			$this->assertEqualsWithDelta( (float) $core_row[ $column ], (float) $synced[ $column ], 0.001, $column );
		}
		foreach ( array( 'date_created', 'date_paid', 'date_completed' ) as $column ) {
			$this->assertSame( $core_row[ $column ], null === $synced[ $column ] ? null : substr( $synced[ $column ]->date, 0, 19 ), $column );
		}

		return $synced;
	}

	/**
	 * Skip the test on WooCommerce versions older than the given one.
	 *
	 * @param string $version WooCommerce version.
	 */
	private function skip_before_woocommerce( $version ) {
		if ( version_compare( WC_VERSION, $version, '<' ) ) {
			$this->markTestSkipped( "Requires WooCommerce $version or later." );
		}
	}

	/**
	 * Create a saved WooCommerce order containing product, coupon, and tax items.
	 *
	 * @return array{0:WC_Order,1:WC_Product,2:WC_Coupon}
	 */
	private function create_analytics_order() {
		$product = WC_Helper_Product::create_simple_product();
		$product->set_regular_price( '20' );
		$product->set_price( '20' );
		$product->save();

		$order = new WC_Order();

		$product_item = new WC_Order_Item_Product();
		$product_item->set_product( $product );
		$product_item->set_quantity( 2 );
		$product_item->set_subtotal( '40' );
		$product_item->set_total( '35' );
		$product_item->set_taxes(
			array(
				'subtotal' => array( 1 => '4.00' ),
				'total'    => array( 1 => '3.50' ),
			)
		);
		$order->add_item( $product_item );

		$coupon = new WC_Coupon();
		$coupon->set_code( 'sync-analytics-' . wp_generate_uuid4() );
		$coupon->set_discount_type( 'fixed_cart' );
		$coupon->set_amount( 5.0 );
		$coupon->save();

		$coupon_item = new WC_Order_Item_Coupon();
		$coupon_item->set_code( $coupon->get_code() );
		$coupon_item->set_discount( '5' );
		$coupon_item->set_discount_tax( '0.5' );
		$order->add_item( $coupon_item );

		$tax_item = new WC_Order_Item_Tax();
		$tax_item->set_rate_id( 1 );
		$tax_item->set_rate_code( 'SYNC-TEST-10' );
		$tax_item->set_label( 'Sync test tax' );
		$tax_item->set_tax_total( '3.5' );
		$tax_item->set_shipping_tax_total( '0' );
		$order->add_item( $tax_item );

		$order->set_discount_total( '5' );
		$order->set_discount_tax( '0.5' );
		$order->set_cart_tax( '3.5' );
		$order->set_total( '38.5' );
		$order->set_status( 'processing' );
		$order->save();

		return array( $order, $product, $coupon );
	}

	/**
	 * Enable the shared Analytics module for the current test.
	 *
	 * @throws RuntimeException When Sync modules were not initialized.
	 * @return WooCommerce_Analytics The enabled module.
	 */
	private function enable_analytics_module() {
		$modules = $this->original_sync_modules;
		if ( null === $modules ) {
			throw new RuntimeException( 'Sync modules were not initialized for the test.' );
		}

		$module    = new WooCommerce_Analytics();
		$modules[] = $module;

		$this->set_sync_modules( $modules );

		return $module;
	}

	/**
	 * Remove listeners registered by an Analytics module instance.
	 *
	 * @param WooCommerce_Analytics $module  The Analytics module.
	 * @param callable              $handler The Sync action handler.
	 */
	private function remove_analytics_module_listeners( $module, $handler ) {
		remove_action( 'woocommerce_analytics_delete_order_stats', array( $module, 'sync_deleted_analytics_data' ) );
		remove_action( 'woocommerce_order_scheduler_after_import_order', array( $module, 'sync_analytics_reports_data' ) );
		remove_action( 'woocommerce_analytics_update_order_stats', array( $module, 'sync_analytics_reports_data' ) );
		remove_action( 'woocommerce_analytics_sync_reports_data', $handler );
		remove_action( 'woocommerce_analytics_delete_reports_data', $handler );
		remove_filter( 'jetpack_sync_before_enqueue_woocommerce_analytics_sync_reports_data', array( $module, 'expand_data' ) );
		remove_filter( 'jetpack_sync_before_enqueue_woocommerce_analytics_delete_reports_data', array( $module, 'expand_data' ) );
	}

	/**
	 * Set the cached Sync module instances without reconstructing listener-bound modules.
	 *
	 * @param array $modules Sync module instances.
	 */
	private function set_sync_modules( array $modules ) {
		$reflection = new ReflectionClass( Modules::class );
		$property   = $reflection->getProperty( 'initialized_modules' );

		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, $modules );
	}
}
