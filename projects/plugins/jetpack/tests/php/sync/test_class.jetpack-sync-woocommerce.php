<?php

use Automattic\Jetpack\Sync\Modules;

/**
 * Testing WooCommerce Sync
 */
class WP_Test_Jetpack_Sync_WooCommerce extends WP_Test_Jetpack_Sync_Base {
	protected $post;
	protected $callable_module;
	protected $full_sync;
	public static $woo_enabled;

	/**
	 * Set up before class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		if ( '1' !== getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
			return;
		}

		self::$woo_enabled = true;

		$woo_tests_dir = __DIR__ . '/../../../../woocommerce/tests';

		if ( ! file_exists( $woo_tests_dir ) ) {
			error_log( 'PLEASE RUN THE GIT VERSION OF WooCommerce that has the tests folder. Found at github.com/WooCommerce/woocommerce' );
			self::$woo_enabled = false;
		}

		// This is taken from WooCommerce's bootstrap.php file

		// framework
		require_once $woo_tests_dir . '/framework/class-wc-unit-test-factory.php';
		require_once $woo_tests_dir . '/framework/class-wc-mock-session-handler.php';
		require_once $woo_tests_dir . '/framework/class-wc-mock-wc-data.php';
		require_once $woo_tests_dir . '/framework/class-wc-mock-wc-object-query.php';
		require_once $woo_tests_dir . '/framework/class-wc-mock-payment-gateway.php';
		require_once $woo_tests_dir . '/framework/class-wc-payment-token-stub.php';
		// commenting this out for now. require_once( $woo_tests_dir . '/framework/vendor/class-wp-test-spy-rest-server.php' );

		// test cases
		require_once $woo_tests_dir . '/includes/wp-http-testcase.php';
		require_once $woo_tests_dir . '/framework/class-wc-unit-test-case.php';
		require_once $woo_tests_dir . '/framework/class-wc-api-unit-test-case.php';
		require_once $woo_tests_dir . '/framework/class-wc-rest-unit-test-case.php';

		// Helpers
		require_once $woo_tests_dir . '/framework/helpers/class-wc-helper-product.php';
		require_once $woo_tests_dir . '/framework/helpers/class-wc-helper-coupon.php';
		require_once $woo_tests_dir . '/framework/helpers/class-wc-helper-fee.php';
		require_once $woo_tests_dir . '/framework/helpers/class-wc-helper-shipping.php';
		require_once $woo_tests_dir . '/framework/helpers/class-wc-helper-customer.php';
		require_once $woo_tests_dir . '/framework/helpers/class-wc-helper-order.php';
		require_once $woo_tests_dir . '/framework/helpers/class-wc-helper-shipping-zones.php';
		require_once $woo_tests_dir . '/framework/helpers/class-wc-helper-payment-token.php';
		require_once $woo_tests_dir . '/framework/helpers/class-wc-helper-settings.php';
	}

	/**
	 * Set up.
	 */
	public function set_up() {
		if ( ! self::$woo_enabled ) {
			$this->markTestSkipped();
			return;
		}
		parent::set_up();
		$this->full_sync = Modules::get_module( 'full-sync' );
	}

	public function test_module_is_enabled() {
		$this->assertTrue( (bool) Modules::get_module( 'woocommerce' ) );
	}

	// Incremental sync
	public function test_orders_are_synced() {
		$order = $this->createOrderWithItem();

		$this->sender->do_sync();

		$order_event = $this->server_event_storage->get_most_recent_event( 'woocommerce_new_order' );

		$this->assertTrue( (bool) $order_event );
		$this->assertEquals( $order->get_id(), $order_event->args[0] );
	}

	public function test_order_status_changes_are_synced() {
		// registering a custom order status is necessary because the built-in ones leave
		// unflushed content in the output buffer
		add_filter( 'wc_order_statuses', array( $this, 'add_custom_order_status' ) );

		$order = $this->createOrderWithItem();
		$order->update_status( 'custom' );

		$this->sender->do_sync();

		$order_status_event = $this->server_event_storage->get_most_recent_event( 'woocommerce_order_status_changed' );

		$this->assertTrue( (bool) $order_status_event );
		$this->assertEquals( $order->get_id(), $order_status_event->args[0] );
		$this->assertEquals( 'pending', $order_status_event->args[1] );
		$this->assertEquals( 'custom', $order_status_event->args[2] );
	}

	public function test_order_status_payment_complete_is_synced() {
		$order = $this->createOrderWithItem();

		// pay
		$order->payment_complete( '12345' );

		// just for fun
		$this->assertEquals( 'completed', $order->get_status() );
		$this->assertSame( '12345', $order->get_transaction_id() );

		$this->sender->do_sync();

		$payment_complete_event = $this->server_event_storage->get_most_recent_event( 'woocommerce_payment_complete' );

		$this->assertTrue( (bool) $payment_complete_event );
		$this->assertEquals( $order->get_id(), $payment_complete_event->args[0] );
	}

	public function test_created_order_items_are_synced() {
		$order       = $this->createOrderWithItem();
		$order_items = $order->get_items();
		$order_item  = reset( $order_items ); // first item

		$this->sender->do_sync();

		$create_order_item_event = $this->server_event_storage->get_most_recent_event( 'woocommerce_new_order_item' );

		$this->assertTrue( (bool) $create_order_item_event );
		$this->assertEquals( $order_item->get_id(), $create_order_item_event->args[0] );
		$this->assertHasOrderItemProperties( $create_order_item_event->args[1], $order_item );
		$this->assertEquals( $order->get_id(), $create_order_item_event->args[2] );
	}

	public function test_updated_order_items_are_synced() {
		$order       = $this->createOrderWithItem();
		$order_items = $order->get_items();
		$order_item  = reset( $order_items ); // first item

		// trigger an update
		$order_item->set_name( 'A new name' );
		$order_item->save();

		$this->sender->do_sync();

		$update_order_item_event = $this->server_event_storage->get_most_recent_event( 'woocommerce_update_order_item' );

		$this->assertTrue( (bool) $update_order_item_event );
		$this->assertEquals( $order_item->get_id(), $update_order_item_event->args[0] );
		$this->assertHasOrderItemProperties( $update_order_item_event->args[1], $order_item );
		$this->assertEquals( $order->get_id(), $update_order_item_event->args[2] );
	}

	public function test_updated_order_item_meta_is_synced() {
		$order       = $this->createOrderWithItem();
		$order_items = $order->get_items();
		$order_item  = reset( $order_items ); // first item

		wc_add_order_item_meta( $order_item->get_id(), 'foo', 'bar', true );
		wc_update_order_item_meta( $order_item->get_id(), 'foo', 'baz' );
		wc_delete_order_item_meta( $order_item->get_id(), 'foo' );

		$this->sender->do_sync();

		$added_order_item_meta_event = $this->server_event_storage->get_most_recent_event( 'added_order_item_meta' );
		$this->assertTrue( (bool) $added_order_item_meta_event );

		$updated_order_item_meta_event = $this->server_event_storage->get_most_recent_event( 'updated_order_item_meta' );
		$this->assertTrue( (bool) $updated_order_item_meta_event );

		$deleted_order_item_meta_event = $this->server_event_storage->get_most_recent_event( 'deleted_order_item_meta' );
		$this->assertTrue( (bool) $deleted_order_item_meta_event );
	}

	public function test_approving_a_review_is_synced() {
		$post_id    = $this->factory->post->create();
		$review_ids = $this->factory->comment->create_post_comments(
			$post_id,
			1,
			array(
				'comment_type'     => 'review',
				'comment_approved' => 0,
			)
		);
		$review     = get_comment( $review_ids[0] );

		$this->sender->do_sync();

		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$review->comment_approved = 1;
		wp_update_comment( (array) $review );

		$this->sender->do_sync();

		// Test both sync actions we're expecting
		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$remote_comment = $this->server_replica_storage->get_comment( $review->comment_ID );
		$this->assertSame( 1, $remote_comment->comment_approved );
		$comment_approved_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_review' );
		$this->assertTrue( (bool) $comment_approved_event );

		$comment_unapproved_to_approved_event = $this->server_event_storage->get_most_recent_event( 'comment_unapproved_to_approved' );
		$this->assertTrue( (bool) $comment_unapproved_to_approved_event );

		// Test both sync actions again, this time without causing a change in state (comment_unapproved_review remains true despite no state change, while comment_approved_to_unapproved does not)

		$this->server_event_storage->reset();

		wp_update_comment( (array) $review );
		$this->sender->do_sync();

		$comment_approved_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_review' );
		$this->assertTrue( (bool) $comment_approved_event );

		$comment_unapproved_to_approved_event = $this->server_event_storage->get_most_recent_event( 'comment_unapproved_to_approved' );
		$this->assertFalse( (bool) $comment_unapproved_to_approved_event );
	}

	public function test_unapproving_a_review_is_synced() {
		$post_id    = $this->factory->post->create();
		$review_ids = $this->factory->comment->create_post_comments( $post_id, 1, array( 'comment_type' => 'review' ) );
		$review     = get_comment( $review_ids[0] );

		$this->sender->do_sync();

		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$review->comment_approved = 0;
		wp_update_comment( (array) $review );

		$this->sender->do_sync();

		// Test both sync actions we're expecting
		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$remote_comment = $this->server_replica_storage->get_comment( $review->comment_ID );
		$this->assertSame( 0, $remote_comment->comment_approved );
		$comment_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_unapproved_review' );
		$this->assertTrue( (bool) $comment_unapproved_event );

		$comment_approved_to_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_to_unapproved' );
		$this->assertTrue( (bool) $comment_approved_to_unapproved_event );

		// Test both sync actions again, this time without causing a change in state (comment_unapproved_review remains true despite no state change, while comment_approved_to_unapproved does not)

		$this->server_event_storage->reset();

		wp_update_comment( (array) $review );
		$this->sender->do_sync();

		$comment_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_unapproved_review' );
		$this->assertTrue( (bool) $comment_unapproved_event );

		$comment_approved_to_unapproved_event = $this->server_event_storage->get_most_recent_event( 'comment_approved_to_unapproved' );
		$this->assertFalse( (bool) $comment_approved_to_unapproved_event );
	}

	// Full Sync

	public function test_full_sync_order_items() {
		$order1 = $this->createOrderWithItem();
		$order2 = $this->createOrderWithItem();

		// order items
		$order1_items = $order1->get_items();
		$order1_item  = reset( $order1_items ); // first item from order1
		wc_update_order_item_meta( $order1_item->get_id(), '_line_subtotal', 10 );

		$order2_items = $order2->get_items();
		$order2_item  = reset( $order2_items ); // first item from order2
		wc_update_order_item_meta( $order2_item->get_id(), '_line_subtotal', 20 );

		$this->full_sync->start();
		$this->sender->do_full_sync();

		$full_sync_order_items = $this->server_event_storage->get_most_recent_event( 'jetpack_full_sync_woocommerce_order_items' );

		$this->assertTrue( (bool) $full_sync_order_items );
		$synced_order_items = $full_sync_order_items->args[0];

		$found_order_item_2 = false;
		$found_order_item_1 = $found_order_item_2; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		foreach ( $synced_order_items as $synced_order_item ) {
			if ( $order1_item->get_id() === $synced_order_item->order_item_id ) {
				$this->assertHasOrderItemProperties( $synced_order_item, $order1_item );
				$found_order_item_1 = true; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				continue;
			}

			if ( $order2_item->get_id() === $synced_order_item->order_item_id ) {
				$this->assertHasOrderItemProperties( $synced_order_item, $order2_item );
				$found_order_item_2 = true;
				continue;
			}
		}

		$synced_order_item_metas = $full_sync_order_items->args[1];

		// find the _line_subtotal metas and assert they have the right values
		$this->assertHasObjectMetaValue( $synced_order_item_metas, $order1_item->get_id(), '_line_subtotal', 10 );
		$this->assertHasObjectMetaValue( $synced_order_item_metas, $order2_item->get_id(), '_line_subtotal', 20 );
	}

	private function assertHasOrderItemProperties( $object, $compare = false ) {
		$this->assertObjectHasAttribute( 'order_item_id', $object );
		$this->assertObjectHasAttribute( 'order_item_name', $object );
		$this->assertObjectHasAttribute( 'order_item_type', $object );
		$this->assertObjectHasAttribute( 'order_id', $object );

		if ( $compare ) {
			$this->assertEquals( $compare->get_id(), $object->order_item_id );
			$this->assertEquals( $compare->get_type(), $object->order_item_type );
			$this->assertEquals( $compare->get_name(), $object->order_item_name );
			$this->assertEquals( $compare->get_order_id(), $object->order_id );
		}
	}

	private function assertHasObjectMetaValue( $metas, $order_item_id, $expected_meta_key, $expected_meta_value ) {
		$has_meta_entry = false;
		foreach ( $metas as $meta ) {
			if ( $order_item_id === $meta->order_item_id && $expected_meta_key === $meta->meta_key ) {
				$this->assertEquals( $expected_meta_value, $meta->meta_value );
				$has_meta_entry = true;
			}
		}

		$this->assertTrue( $has_meta_entry );
	}

	// Utility functions

	public function add_custom_order_status( $statuses ) {
		$statuses['wc-custom'] = 'Custom';
		return $statuses;
	}

	private function createOrderWithItem() {
		$product = WC_Helper_Product::create_simple_product();
		$order   = new WC_Order();
		$item    = new WC_Order_Item_Product(
			array(
				'product'  => $product,
				'quantity' => 4,
			)
		);

		$order->add_item( $item );
		$order->save();

		return $order;
	}
}

