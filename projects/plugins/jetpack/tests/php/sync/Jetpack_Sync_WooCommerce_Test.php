<?php

use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Modules\WooCommerce as WooCommerce_Module;
use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/Jetpack_Sync_TestBase.php';
require_once __DIR__ . '/../trait-woo-tests.php';

/**
 * Testing WooCommerce Sync
 *
 * @group woocommerce
 */
#[Group( 'woocommerce' )]
class Jetpack_Sync_WooCommerce_Test extends Jetpack_Sync_TestBase {
	/**
	 * Using the WooCommerceTestTrait to include WooCommerce related dependencies for the unit tests.
	 */
	use WooCommerceTestTrait;

	protected $post;
	protected $callable_module;
	/** @var \Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately|\Automattic\Jetpack\Sync\Modules\Full_Sync */
	protected $full_sync;

	/**
	 * Set up.
	 */
	public function set_up() {
		if ( ! self::$woo_enabled ) {
			$this->markTestSkipped();
			return; // @phan-suppress-current-line PhanPluginUnreachableCode
		}
		parent::set_up();
		$this->full_sync = Modules::get_module( 'full-sync' );
	}

	public function test_module_is_enabled() {
		$this->assertTrue( (bool) Modules::get_module( 'woocommerce' ) );
	}

	/** Incremental sync **/
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

	public function test_updated_order_item_meta_is_synced() {
		$order       = $this->createOrderWithItem();
		$order_items = $order->get_items();
		$order_item  = reset( $order_items ); // first item

		wc_add_order_item_meta( $order_item->get_id(), '_qty', 1, true );
		wc_update_order_item_meta( $order_item->get_id(), '_qty', 2 );
		wc_delete_order_item_meta( $order_item->get_id(), '_qty' );

		$this->sender->do_sync();

		$added_order_item_meta_event = $this->server_event_storage->get_most_recent_event( 'added_order_item_meta' );
		$this->assertTrue( (bool) $added_order_item_meta_event );

		$updated_order_item_meta_event = $this->server_event_storage->get_most_recent_event( 'updated_order_item_meta' );
		$this->assertTrue( (bool) $updated_order_item_meta_event );

		$deleted_order_item_meta_event = $this->server_event_storage->get_most_recent_event( 'deleted_order_item_meta' );
		$this->assertTrue( (bool) $deleted_order_item_meta_event );
	}

	public function test_non_whitelisted_order_item_meta_is_not_synced() {
		$this->server_event_storage->reset();
		$order       = $this->createOrderWithItem();
		$order_items = $order->get_items();
		$order_item  = reset( $order_items ); // first item

		wc_add_order_item_meta( $order_item->get_id(), 'foo', 'bar', true );
		wc_update_order_item_meta( $order_item->get_id(), 'foo', 'baz' );
		wc_delete_order_item_meta( $order_item->get_id(), 'foo' );

		$this->sender->do_sync();

		$added_events   = $this->server_event_storage->get_all_events( 'added_order_item_meta' );
		$updated_events = $this->server_event_storage->get_all_events( 'updated_order_item_meta' );
		$deleted_events = $this->server_event_storage->get_all_events( 'deleted_order_item_meta' );

		// Merge all events
		$meta_events = array_merge( $added_events, $updated_events, $deleted_events );

		$foo_events = array_filter(
			$meta_events,
			function ( $event ) {
				return isset( $event->args[2] ) && $event->args[2] === 'foo';
			}
		);

		$this->assertEmpty( $foo_events );
	}

	public function test_customer_meta_updates_are_synced_without_customer_data() {
		$user_id = $this->create_test_customer_user( 'test_customer', 'customer@example.com' );

		update_user_meta( $user_id, 'billing_email', 'updated@example.com' );
		update_user_meta( $user_id, 'billing_city', 'San Francisco' );
		update_user_meta( $user_id, 'paying_customer', '1' );

		$this->flush_customer_meta_updates();
		$this->sender->do_sync();

		$customer_updated_event = $this->server_event_storage->get_most_recent_event( 'jetpack_updated_woo_customer_meta' );

		$this->assertTrue( (bool) $customer_updated_event );
		$this->assertIsObject( $customer_updated_event->args[0] );
		$this->assertNotInstanceOf( 'WC_Customer', $customer_updated_event->args[0] );
		$this->assertEquals( $user_id, $customer_updated_event->args[0]->ID );
		$this->assertEquals( $user_id, $customer_updated_event->args[0]->data->ID );
		$this->assertEquals( 'test_customer', $customer_updated_event->args[0]->data->user_login );
		$this->assertEquals( 'customer@example.com', $customer_updated_event->args[0]->data->user_email );
		$this->assertContains( 'billing_email', $customer_updated_event->args[1] );
		$this->assertContains( 'billing_city', $customer_updated_event->args[1] );
		$this->assertContains( 'is_paying_customer', $customer_updated_event->args[1] );
		$this->assertNotContains( 'paying_customer', $customer_updated_event->args[1] );

		$encoded_event_args = wp_json_encode( $customer_updated_event->args, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
		$this->assertStringNotContainsString( 'updated@example.com', $encoded_event_args );
		$this->assertStringNotContainsString( 'San Francisco', $encoded_event_args );
	}

	public function test_non_customer_meta_updates_are_not_synced_as_customer_details() {
		$user_id = $this->create_test_customer_user( 'test_customer_untracked_meta', 'untracked-customer@example.com' );

		update_user_meta( $user_id, 'session_tokens', 'secret' );
		update_user_meta( $user_id, 'first_name', 'Ada' );
		update_user_meta( $user_id, 'last_name', 'Lovelace' );

		$this->flush_customer_meta_updates();
		$this->sender->do_sync();

		$this->assertFalse( (bool) $this->server_event_storage->get_most_recent_event( 'jetpack_updated_woo_customer_meta' ) );
	}

	public function test_customer_meta_deletes_from_user_deletion_are_not_synced_as_customer_details() {
		$user_id = $this->create_test_customer_user( 'test_customer_deleted', 'deleted-customer@example.com' );

		update_user_meta( $user_id, 'billing_email', 'deleted-customer@example.com' );

		$this->flush_customer_meta_updates();
		$this->sender->do_sync();
		$this->server_event_storage->reset();

		wp_delete_user( $user_id );

		$this->flush_customer_meta_updates();
		$this->sender->do_sync();

		$this->assertFalse( (bool) $this->server_event_storage->get_most_recent_event( 'jetpack_updated_woo_customer_meta' ) );
	}

	public function test_customer_meta_filter_rebuilds_minimal_customer_object() {
		$user_id            = $this->create_test_customer_user( 'test_customer_extra_data', 'extra-customer@example.com' );
		$woocommerce_module = $this->get_woocommerce_module();

		$filtered_args = $woocommerce_module->filter_customer_updated_meta(
			array(
				(object) array(
					'ID'              => $user_id,
					'extra_top_level' => 'secret',
					'data'            => (object) array(
						'ID'                => $user_id,
						'user_login'        => 'injected_login',
						'user_email'        => 'injected@example.com',
						'billing_address_1' => '123 Secret St',
					),
				),
				array( 'billing_email' ),
			)
		);

		if ( ! is_array( $filtered_args ) ) {
			$this->fail( 'Customer meta filter returned an invalid payload.' );
		}

		$customer = $filtered_args[0];
		if ( ! is_object( $customer ) || ! isset( $customer->data ) || ! is_object( $customer->data ) ) {
			$this->fail( 'Customer meta filter did not return a minimal customer object.' );
		}

		$this->assertEquals( $user_id, $customer->ID );
		$this->assertEquals( $user_id, $customer->data->ID );
		$this->assertEquals( 'test_customer_extra_data', $customer->data->user_login );
		$this->assertEquals( 'extra-customer@example.com', $customer->data->user_email );
		$this->assertObjectNotHasProperty( 'extra_top_level', $customer );
		$this->assertObjectNotHasProperty( 'billing_address_1', $customer->data );
		$this->assertSame( array( 'billing_email' ), $filtered_args[1] );
	}

	/**
	 * Create a customer user for WooCommerce sync tests.
	 *
	 * @param string $user_login User login.
	 * @param string $user_email User email.
	 * @return int User ID.
	 */
	private function create_test_customer_user( $user_login, $user_email ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $user_login,
				'user_email' => $user_email,
				'user_pass'  => 'test',
			)
		);

		if ( is_wp_error( $user_id ) ) {
			$this->fail( $user_id->get_error_message() );
		}

		return (int) $user_id;
	}

	/**
	 * Retrieve the WooCommerce sync module.
	 *
	 * @return WooCommerce_Module WooCommerce sync module.
	 */
	private function get_woocommerce_module() {
		$woocommerce_module = Modules::get_module( 'woocommerce' );
		if ( ! $woocommerce_module instanceof WooCommerce_Module ) {
			$this->fail( 'WooCommerce sync module is not available.' );
		}

		return $woocommerce_module;
	}

	/**
	 * Flush pending customer meta updates.
	 */
	private function flush_customer_meta_updates() {
		$this->get_woocommerce_module()->action_customer_meta_updates();
	}

	public function test_approving_a_review_is_synced() {
		$post_id    = self::factory()->post->create();
		$review_ids = self::factory()->comment->create_post_comments(
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
		$this->assertSame( '1', $remote_comment->comment_approved );
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
		$post_id    = self::factory()->post->create();
		$review_ids = self::factory()->comment->create_post_comments( $post_id, 1, array( 'comment_type' => 'review' ) );
		$review     = get_comment( $review_ids[0] );

		$this->sender->do_sync();

		$this->assertSame( 1, $this->server_replica_storage->comment_count( 'approve' ) );
		$review->comment_approved = 0;
		wp_update_comment( (array) $review );

		$this->sender->do_sync();

		// Test both sync actions we're expecting
		$this->assertSame( 0, $this->server_replica_storage->comment_count( 'approve' ) );
		$remote_comment = $this->server_replica_storage->get_comment( $review->comment_ID );
		$this->assertSame( '0', $remote_comment->comment_approved );
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

	/** Full Sync **/
	public function test_full_sync_order_items() {
		$this->markTestSkipped( 'Temporarily skip this test.' );
		// @phan-suppress-next-line PhanPluginUnreachableCode
		$order1 = $this->createOrderWithItem();
		$order2 = $this->createOrderWithItem();

		// order items
		$order1_items = $order1->get_items();
		$order1_item  = reset( $order1_items ); // first item from order1
		wc_update_order_item_meta( $order1_item->get_id(), '_line_subtotal', 10 );

		$order2_items = $order2->get_items();
		$order2_item  = reset( $order2_items ); // first item from order2
		wc_update_order_item_meta( $order2_item->get_id(), '_line_subtotal', 20 );

		$this->full_sync->start( array( 'woocommerce' => true ) );
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
		$this->assertObjectHasProperty( 'order_item_id', $object );
		$this->assertObjectHasProperty( 'order_item_name', $object );
		$this->assertObjectHasProperty( 'order_item_type', $object );
		$this->assertObjectHasProperty( 'order_id', $object );

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

	/** Utility functions **/
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
