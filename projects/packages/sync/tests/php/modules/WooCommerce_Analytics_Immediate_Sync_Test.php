<?php
/**
 * Tests for the opt-in immediate sync of the WooCommerce Analytics module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;
use WP_Post;

/**
 * Class WooCommerce_Analytics_Immediate_Sync_Test
 *
 * Each test runs in its own process because the WooCommerce class stubs cannot be unloaded.
 *
 * @covers Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversClass( Modules\WooCommerce_Analytics::class )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class WooCommerce_Analytics_Immediate_Sync_Test extends BaseTestCase {

	/**
	 * The module instance, which records the order IDs it would sync.
	 *
	 * @var Modules\WooCommerce_Analytics
	 */
	private $module;

	/**
	 * Order IDs passed to the sync action.
	 *
	 * @var int[]
	 */
	private $synced = array();

	/**
	 * Order IDs passed to the delete action.
	 *
	 * @var int[]
	 */
	private $deleted = array();

	/**
	 * Runs before every test in this class.
	 */
	protected function setUp(): void {
		parent::setUp();
		require_once __DIR__ . '/../stubs/woocommerce-analytics-functions.php';
		require_once __DIR__ . '/../stubs/class-wc-abstract-order.php';

		$this->module = new class() extends Modules\WooCommerce_Analytics {
			/**
			 * Return the order ID instead of building the full reports data.
			 *
			 * @param mixed $order The order.
			 * @return array
			 */
			protected function build_woocommerce_analytics_reports_data( $order ) {
				return array( 'order_id' => is_object( $order ) ? $order->get_id() : (int) $order );
			}
		};
		$this->module->init_listeners( '__return_null' );

		add_action(
			'woocommerce_analytics_sync_reports_data',
			function ( $data ) {
				$this->synced[] = $data['order_id'];
			}
		);
		add_action(
			'woocommerce_analytics_delete_reports_data',
			function ( $data ) {
				$this->deleted[] = $data['id'];
			}
		);

		$this->set_orders( array() );
		add_filter( 'jetpack_sync_woocommerce_analytics_immediate_sync', '__return_true' );
	}

	/**
	 * Replace the orders wc_get_order() can load.
	 *
	 * @param \WC_Abstract_Order[] $orders The orders.
	 */
	private function set_orders( array $orders ) {
		global $jetpack_sync_test_orders;

		$jetpack_sync_test_orders = array();
		foreach ( $orders as $order ) {
			$jetpack_sync_test_orders[ $order->get_id() ] = $order;
		}
	}

	/**
	 * Build an order stub.
	 *
	 * @param int   $id     Order ID.
	 * @param array $fields Other order fields.
	 * @return \WC_Abstract_Order
	 */
	private function order( $id, array $fields = array() ) {
		return new class( array( 'id' => $id ) + $fields ) extends \WC_Abstract_Order {
			/**
			 * Order fields.
			 *
			 * @var array
			 */
			public $fields;

			/**
			 * Constructor.
			 *
			 * @param array $data Order fields: id, type, parent_id, status, refund_ids, date_created.
			 */
			public function __construct( array $data ) {
				$this->fields = $data + array(
					'type'         => 'shop_order',
					'parent_id'    => 0,
					'status'       => 'processing',
					'refund_ids'   => array(),
					'date_created' => '2026-10-05',
				);
			}

			/**
			 * Get the order ID.
			 *
			 * @return int
			 */
			public function get_id() {
				return $this->fields['id'];
			}

			/**
			 * Get the order type.
			 *
			 * @return string
			 */
			public function get_type() {
				return $this->fields['type'];
			}

			/**
			 * Get the parent order ID.
			 *
			 * @return int
			 */
			public function get_parent_id( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return $this->fields['parent_id'];
			}

			/**
			 * Get the order status.
			 *
			 * @return string
			 */
			public function get_status( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return $this->fields['status'];
			}

			/**
			 * Get the creation date.
			 *
			 * @return string|null
			 */
			public function get_date_created( $context = 'view' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return $this->fields['date_created'];
			}

			/**
			 * Get the order's refunds from the test order registry.
			 *
			 * @return array
			 */
			public function get_refunds() {
				return array_filter( array_map( 'wc_get_order', $this->fields['refund_ids'] ) );
			}
		};
	}

	/**
	 * Build a refund stub.
	 *
	 * @param int $id        Refund ID.
	 * @param int $parent_id Parent order ID.
	 * @return \WC_Abstract_Order
	 */
	private function refund( $id, $parent_id ) {
		return $this->order(
			$id,
			array(
				'type'      => 'shop_order_refund',
				'parent_id' => $parent_id,
				'status'    => 'completed',
			)
		);
	}

	public function test_default_mode_keeps_the_import_driven_sync() {
		remove_filter( 'jetpack_sync_woocommerce_analytics_immediate_sync', '__return_true' );
		$order = $this->order( 10 );
		$this->set_orders( array( $order ) );

		do_action( 'woocommerce_after_order_object_save', $order );
		$this->module->flush_immediate_orders();
		$this->assertSame( array(), $this->synced );

		$this->module->sync_analytics_reports_data( 10 );
		$this->module->sync_deleted_analytics_data( 11 );
		$this->assertSame( array( 10 ), $this->synced );
		$this->assertSame( array( 11 ), $this->deleted );
	}

	public function test_immediate_mode_ignores_the_import_driven_hooks() {
		$this->set_orders( array( $this->order( 10 ) ) );

		$this->module->sync_analytics_reports_data( 10 );
		$this->module->sync_deleted_analytics_data( 10 );

		$this->assertSame( array(), $this->synced );
		$this->assertSame( array(), $this->deleted );
	}

	public function test_flushes_before_the_sender() {
		$this->assertSame( 9990, has_action( 'shutdown', array( $this->module, 'flush_immediate_orders' ) ) );
		$this->assertLessThan( 9998, has_action( 'shutdown', array( $this->module, 'flush_immediate_orders' ) ) );
	}

	public function test_repeated_saves_sync_the_order_once() {
		$order = $this->order( 10, array( 'status' => 'pending' ) );
		$this->set_orders( array( $order ) );

		do_action( 'woocommerce_after_order_object_save', $order );
		do_action( 'woocommerce_after_order_object_save', wc_get_order( 10 ) );
		$this->assertSame( array(), $this->synced );

		$this->module->flush_immediate_orders();
		$this->assertSame( array( 10 ), $this->synced );
	}

	public function test_flush_loads_the_order_as_it_is_at_shutdown() {
		$this->set_orders( array( $this->order( 10, array( 'status' => 'checkout-draft' ) ) ) );
		do_action( 'woocommerce_after_order_object_save', wc_get_order( 10 ) );

		// The draft is placed later in the request.
		$this->set_orders( array( $this->order( 10 ) ) );
		$this->module->flush_immediate_orders();

		$this->assertSame( array( 10 ), $this->synced );
	}

	public function test_refund_syncs_its_parent_and_sibling_refunds() {
		$this->set_orders(
			array(
				$this->order( 10, array( 'refund_ids' => array( 11, 12 ) ) ),
				$this->refund( 11, 10 ),
				$this->refund( 12, 10 ),
			)
		);

		do_action( 'woocommerce_order_refunded', 10, 12 );
		do_action( 'woocommerce_after_order_refund_object_save', wc_get_order( 12 ) );
		$this->module->flush_immediate_orders();

		$this->assertEqualsCanonicalizing( array( 10, 11, 12 ), $this->synced );
	}

	public function test_deleted_order_sends_a_deletion() {
		$this->set_orders( array() );

		do_action( 'woocommerce_delete_order', 10 );
		do_action( 'woocommerce_after_order_object_save', $this->order( 10 ) );
		$this->module->flush_immediate_orders();

		$this->assertSame( array(), $this->synced );
		$this->assertSame( array( 10 ), $this->deleted );
	}

	public function test_deletion_of_an_order_that_still_exists_syncs_it() {
		$this->set_orders( array( $this->order( 10 ) ) );

		do_action( 'woocommerce_delete_order', 10 );
		$this->module->flush_immediate_orders();

		$this->assertSame( array( 10 ), $this->synced );
		$this->assertSame( array(), $this->deleted );
	}

	public function test_missing_order_without_a_deletion_is_skipped() {
		do_action( 'woocommerce_trash_order', 10 );
		$this->module->flush_immediate_orders();

		$this->assertSame( array(), $this->synced );
		$this->assertSame( array(), $this->deleted );
	}

	public function test_deleted_refund_resyncs_its_parent() {
		$refund = $this->refund( 11, 10 );
		$this->set_orders( array( $this->order( 10 ), $refund ) );

		$this->assertNull( apply_filters( 'woocommerce_pre_delete_order_refund', null, $refund, true ) );
		$this->set_orders( array( $this->order( 10 ) ) );
		do_action( 'woocommerce_delete_order_refund', 11 );
		$this->module->flush_immediate_orders();

		$this->assertSame( array( 10 ), $this->synced );
		$this->assertSame( array( 11 ), $this->deleted );
	}

	public function test_short_circuited_refund_deletion_is_left_alone() {
		$refund = $this->refund( 11, 10 );
		$this->set_orders( array( $this->order( 10 ), $refund ) );

		$this->assertFalse( apply_filters( 'woocommerce_pre_delete_order_refund', false, $refund, true ) );
		$this->module->flush_immediate_orders();

		$this->assertSame( array(), $this->synced );
	}

	public function test_deleted_refund_post_resyncs_its_parent() {
		$this->set_orders( array( $this->order( 10 ) ) );
		$post = new WP_Post(
			(object) array(
				'ID'          => 11,
				'post_type'   => 'shop_order_refund',
				'post_parent' => 10,
			)
		);

		do_action( 'deleted_post', 11, $post );
		do_action( 'deleted_post', 12, new WP_Post( (object) array( 'post_type' => 'post' ) ) );
		$this->module->flush_immediate_orders();

		$this->assertSame( array( 10 ), $this->synced );
		$this->assertSame( array( 11 ), $this->deleted );
	}

	public function test_drafts_and_other_order_types_are_skipped() {
		$orders = array(
			$this->order( 10, array( 'status' => 'auto-draft' ) ),
			$this->order( 11, array( 'status' => 'checkout-draft' ) ),
			$this->order( 12, array( 'type' => 'shop_subscription' ) ),
			$this->order( 13, array( 'date_created' => null ) ),
			$this->order( 14 ),
		);
		$this->set_orders( $orders );

		foreach ( $orders as $order ) {
			do_action( 'woocommerce_after_order_object_save', $order );
		}
		$this->module->flush_immediate_orders();

		$this->assertSame( array( 14 ), $this->synced );
	}

	public function test_test_orders_are_skipped() {
		require_once __DIR__ . '/../stubs/class-ordersscheduler.php';
		$orders = array( $this->order( 10, array( 'is_test' => true ) ), $this->order( 11 ) );
		$this->set_orders( $orders );

		do_action( 'woocommerce_after_order_object_save', $orders[0] );
		do_action( 'woocommerce_after_order_object_save', $orders[1] );
		$this->module->flush_immediate_orders();

		$this->assertSame( array( 11 ), $this->synced );
	}

	public function test_bulk_changes_flush_early() {
		$orders = array();
		for ( $id = 1; $id <= 100; $id++ ) {
			$orders[] = $this->order( $id );
		}
		$this->set_orders( $orders );

		foreach ( $orders as $order ) {
			do_action( 'woocommerce_after_order_object_save', $order );
		}
		$this->assertCount( 100, $this->synced );

		// A later change to an already flushed order is synced again.
		do_action( 'woocommerce_after_order_object_save', $orders[0] );
		$this->module->flush_immediate_orders();
		$this->assertCount( 101, $this->synced );
	}

	public function test_orders_changed_while_flushing_are_synced_in_the_same_flush() {
		$this->set_orders( array( $this->order( 10 ), $this->order( 20 ) ) );
		add_action(
			'woocommerce_analytics_sync_reports_data',
			function ( $data ) {
				if ( 10 === $data['order_id'] ) {
					do_action( 'woocommerce_after_order_object_save', wc_get_order( 20 ) );
				}
			}
		);

		do_action( 'woocommerce_after_order_object_save', wc_get_order( 10 ) );
		$this->module->flush_immediate_orders();

		$this->assertSame( array( 10, 20 ), $this->synced );
	}

	public function test_turning_immediate_sync_off_drops_pending_orders() {
		$this->set_orders( array( $this->order( 10 ) ) );
		do_action( 'woocommerce_after_order_object_save', wc_get_order( 10 ) );

		remove_filter( 'jetpack_sync_woocommerce_analytics_immediate_sync', '__return_true' );
		$this->module->flush_immediate_orders();
		add_filter( 'jetpack_sync_woocommerce_analytics_immediate_sync', '__return_true' );
		$this->module->flush_immediate_orders();

		$this->assertSame( array(), $this->synced );
	}
}
