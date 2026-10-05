<?php
/**
 * Test file for Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Class WooCommerce_Analytics_Module_Test
 *
 * Covers the public module contract that does not require a WooCommerce runtime.
 *
 * @covers Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics
 */
#[CoversClass( Modules\WooCommerce_Analytics::class )]
class WooCommerce_Analytics_Module_Test extends BaseTestCase {

	/**
	 * The module instance.
	 *
	 * @var Modules\WooCommerce_Analytics
	 */
	private $module;

	/**
	 * Runs once before the tests.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		require_once __DIR__ . '/../stubs/class-wc-datetime.php';
		require_once __DIR__ . '/../stubs/woocommerce-analytics-functions.php';
	}

	/**
	 * Runs before every test in this class.
	 */
	protected function setUp(): void {
		parent::setUp();
		$this->module = new Modules\WooCommerce_Analytics();
	}

	/**
	 * Runs after every test in this class.
	 */
	protected function tearDown(): void {
		unset( $GLOBALS['jetpack_sync_test_orders'], $GLOBALS['jetpack_sync_test_old_full_refund_data'] );
		remove_all_filters( 'woocommerce_analytics_update_order_stats_data' );
		remove_filter( 'jetpack_sync_options_whitelist', array( $this->module, 'add_woocommerce_analytics_options_whitelist' ), 10 );
		remove_filter( 'jetpack_sync_post_meta_whitelist', array( $this->module, 'add_woocommerce_analytics_post_meta_whitelist' ), 10 );
		parent::tearDown();
	}

	/**
	 * The module registers its minimum data requirements.
	 */
	public function test_registers_minimum_data_requirements() {
		$this->assertSame( 10, has_filter( 'jetpack_sync_options_whitelist', array( $this->module, 'add_woocommerce_analytics_options_whitelist' ) ) );
		$this->assertSame( 10, has_filter( 'jetpack_sync_post_meta_whitelist', array( $this->module, 'add_woocommerce_analytics_post_meta_whitelist' ) ) );
	}

	/**
	 * The module can load without WooCommerce's OrderAttributionMeta trait.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_module_does_not_require_order_attribution_meta_trait() {
		$this->assertFalse( trait_exists( 'Automattic\\WooCommerce\\Internal\\Traits\\OrderAttributionMeta', false ) );
		$this->assertInstanceOf( Modules\WooCommerce_Analytics::class, $this->module );
	}

	/**
	 * Consumers can add options without duplicating the module minimum.
	 */
	public function test_adds_options_whitelist_minimum() {
		$options = $this->module->add_woocommerce_analytics_options_whitelist( array( 'consumer_option' ) );

		$this->assertSame(
			array( 'consumer_option', 'woocommerce_excluded_report_order_statuses' ),
			$options
		);
		$this->assertSame( $options, $this->module->add_woocommerce_analytics_options_whitelist( $options ) );
	}

	/**
	 * Consumers can add post meta without duplicating the module minimum.
	 */
	public function test_adds_post_meta_whitelist_minimum() {
		$post_meta = $this->module->add_woocommerce_analytics_post_meta_whitelist( array( '_consumer_meta' ) );

		$this->assertSame(
			array( '_consumer_meta', '_stock', '_stock_quantity', '_cogs_total_value', '_global_unique_id' ),
			$post_meta
		);
		$this->assertSame( $post_meta, $this->module->add_woocommerce_analytics_post_meta_whitelist( $post_meta ) );
	}

	/**
	 * The module name is a cross-repo contract (WPCOM dispatcher, Premium Analytics
	 * tracker and JS, the standalone WooCommerce Analytics plugin). It must never change.
	 */
	public function test_name_is_the_public_contract() {
		$this->assertSame( 'woocommerce_analytics', $this->module->name() );
	}

	/**
	 * Full sync action name is likewise consumed by the WPCOM receiving side.
	 */
	public function test_full_sync_actions() {
		$this->assertSame( array( 'jetpack_full_sync_woocommerce_analytics' ), $this->module->get_full_sync_actions() );
	}

	/**
	 * The module reads from the order stats table keyed by order_id.
	 */
	public function test_table_and_id_field() {
		global $wpdb;
		$this->assertSame( $wpdb->prefix . 'wc_order_stats', $this->module->table() );
		$this->assertSame( 'order_id', $this->module->id_field() );
	}

	/**
	 * Unsupported object types are rejected.
	 */
	public function test_get_objects_by_id_rejects_unsupported_types() {
		$this->assertSame( array(), $this->module->get_objects_by_id( 'coupon', array( 1, 2 ) ) );
		$this->assertSame( array(), $this->module->get_objects_by_id( 'order', array() ) );
		$this->assertFalse( $this->module->get_object_by_id( 'not_a_type', 1 ) );
	}

	/**
	 * The expand_data handler unwraps the first hook argument and rejects malformed input.
	 */
	public function test_expand_data() {
		$this->assertFalse( $this->module->expand_data( 'not-an-array' ) );
		$this->assertFalse( $this->module->expand_data( array() ) );
		$this->assertSame( array( 'id' => 5 ), $this->module->expand_data( array( array( 'id' => 5 ) ) ) );
	}

	/**
	 * Deletion sync ignores empty IDs and emits the filtered payload for valid IDs.
	 */
	public function test_sync_deleted_analytics_data() {
		$filter_calls = 0;
		$payloads     = array();
		$filter       = static function ( $data ) use ( &$filter_calls ) {
			++$filter_calls;
			$data['filtered'] = true;
			return $data;
		};
		$action       = static function ( $data ) use ( &$payloads ) {
			$payloads[] = $data;
		};

		add_filter( 'woocommerce_analytics_deletion_data', $filter );
		add_action( 'woocommerce_analytics_delete_reports_data', $action );

		try {
			$this->module->sync_deleted_analytics_data( 0 );
			$this->module->sync_deleted_analytics_data( 42 );
		} finally {
			remove_filter( 'woocommerce_analytics_deletion_data', $filter );
			remove_action( 'woocommerce_analytics_delete_reports_data', $action );
		}

		$this->assertSame( 1, $filter_calls );
		$this->assertSame(
			array(
				array(
					'id'       => 42,
					'filtered' => true,
				),
			),
			$payloads
		);
	}

	/**
	 * The public HPOS helper prefixes only registered statuses.
	 */
	public function test_hpos_status_helper() {
		$this->assertSame( 'wc-pending', Modules\WooCommerce_HPOS_Orders::get_wc_order_status_with_prefix( 'pending' ) );
		$this->assertSame( 'wc-checkout-draft', Modules\WooCommerce_HPOS_Orders::get_wc_order_status_with_prefix( 'checkout-draft' ) );
		$this->assertSame( 'wc-custom', Modules\WooCommerce_HPOS_Orders::get_wc_order_status_with_prefix( 'custom' ) );
		$this->assertSame( 'not-registered', Modules\WooCommerce_HPOS_Orders::get_wc_order_status_with_prefix( 'not-registered' ) );
	}

	/**
	 * Analytics keeps its legacy normalization behavior while reusing the HPOS helper.
	 */
	public function test_analytics_status_normalization() {
		$this->assertSame( 'wc-pending', $this->invoke_static_helper( 'normalize_order_status', 'pending' ) );
		$this->assertSame( 'wc-pending', $this->invoke_static_helper( 'normalize_order_status', 'wc-pending' ) );
		$this->assertSame( 'not-registered', $this->invoke_static_helper( 'normalize_order_status', 'wc-not-registered' ) );
	}

	/**
	 * Refund detection does not require WooCommerce's OrderInternalStatus enum.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_refund_detection_does_not_require_order_internal_status_enum() {
		global $wpdb;

		$enum          = 'Automattic\\WooCommerce\\Enums\\OrderInternalStatus';
		$is_refund     = false;
		$original_wpdb = $wpdb;
		$wpdb          = new class() {
			/**
			 * WordPress table prefix.
			 *
			 * @var string
			 */
			public $prefix = 'wp_';

			/**
			 * Return the order ID as the prepared query.
			 *
			 * @param string $query    Query template.
			 * @param int    $order_id Order ID.
			 * @return int
			 */
			public function prepare( $query, $order_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return $order_id;
			}

			/**
			 * Return representative child and parent order-stats rows.
			 *
			 * @param int    $order_id Prepared order ID.
			 * @param string $output   Requested output format.
			 * @return array|null
			 */
			public function get_row( $order_id, $output ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				$rows = array(
					101 => array( 'parent_id' => 202 ),
					202 => array( 'status' => 'wc-refunded' ),
				);

				return $rows[ $order_id ] ?? null;
			}
		};

		$this->assertFalse( class_exists( $enum, false ) );

		try {
			$is_refund = $this->invoke_instance_helper( 'is_refund_order', 101 );
		} finally {
			$wpdb = $original_wpdb;
		}

		$this->assertTrue( $is_refund );
		$this->assertFalse( class_exists( $enum, false ) );
	}

	/**
	 * Full-refund detection does not require WooCommerce's newer OrderUtil method.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_full_refund_detection_does_not_require_new_order_util_method() {
		$order_util = 'Automattic\\WooCommerce\\Utilities\\OrderUtil';

		$this->assertFalse( class_exists( $order_util, false ) );
		$this->assertFalse( $this->invoke_static_helper( 'uses_new_full_refund_data' ) );
		$this->assertFalse( class_exists( $order_util, false ) );
	}

	/**
	 * Analytics datetime conversion retains its fixed site-offset behavior.
	 */
	public function test_datetime_conversion() {
		$this->assertNull( $this->invoke_static_helper( 'datetime_to_object', null ) );

		$from_string = $this->invoke_static_helper( 'datetime_to_object', '2024-01-02 03:04:05' );
		$this->assertSame( array( 'date', 'timezone_type', 'timezone' ), array_keys( (array) $from_string ) );
		$this->assertSame( '2024-01-02 03:04:05.000000', $from_string->date );
		$this->assertSame( '+05:30', $from_string->timezone );

		$from_utc  = new \WC_DateTime( '2024-01-01 21:34:05', new \DateTimeZone( 'UTC' ) );
		$converted = $this->invoke_static_helper( 'datetime_to_object', $from_utc );
		$this->assertSame( '2024-01-02 03:04:05.000000', $converted->date );
		$this->assertSame( '+05:30', $converted->timezone );
	}

	/**
	 * Attribution data uses WooCommerce's default meta prefix.
	 */
	public function test_order_attribution_uses_default_meta_prefix() {
		$data = $this->invoke_instance_helper( 'get_order_attribution_data', $this->get_order_stub() );

		$this->assertSame( '_wc_order_attribution_utm_campaign', $data['utm_campaign'] );
		$this->assertSame( '_wc_order_attribution_source_type', $data['source_type'] );
	}

	/**
	 * Attribution data preserves WooCommerce's filtered prefix behavior.
	 */
	public function test_order_attribution_normalizes_filtered_meta_prefix() {
		$filter = static function () {
			return '__custom_attribution__';
		};
		$data   = array();
		add_filter( 'wc_order_attribution_tracking_field_prefix', $filter );

		try {
			$data = $this->invoke_instance_helper( 'get_order_attribution_data', $this->get_order_stub() );
		} finally {
			remove_filter( 'wc_order_attribution_tracking_field_prefix', $filter );
		}

		$this->assertSame( '_custom_attribution_utm_source', $data['utm_source'] );
		$this->assertSame( '_custom_attribution_device_type', $data['device_type'] );
	}

	/**
	 * Refund attribution reads the parent order when it can be loaded.
	 */
	public function test_order_attribution_for_refund_uses_parent_order() {
		global $jetpack_sync_test_orders;

		$jetpack_sync_test_orders = array( 202 => $this->get_attribution_stub( 202, 'shop_order', 0, 'parent' ) );
		$data                     = array();

		try {
			$data = $this->invoke_instance_helper( 'get_order_attribution_data', $this->get_attribution_stub( 101, 'shop_order_refund', 202, 'refund' ) );
		} finally {
			$jetpack_sync_test_orders = array();
		}

		$this->assertSame( 101, $data['order_id'] );
		$this->assertSame( 'parent:_wc_order_attribution_utm_source', $data['utm_source'] );
	}

	/**
	 * Refund attribution falls back to the refund when the parent order is gone.
	 */
	public function test_order_attribution_for_refund_falls_back_when_parent_missing() {
		global $jetpack_sync_test_orders;

		// No parent registered, so wc_get_order() returns false for the parent ID.
		$jetpack_sync_test_orders = array();

		$data = $this->invoke_instance_helper( 'get_order_attribution_data', $this->get_attribution_stub( 101, 'shop_order_refund', 202, 'refund' ) );

		$this->assertSame( 101, $data['order_id'] );
		$this->assertSame( 'refund:_wc_order_attribution_utm_source', $data['utm_source'] );
	}

	/**
	 * Missing order items have no COGS value.
	 */
	public function test_missing_order_item_has_no_cogs_value() {
		$this->assertNull( $this->invoke_instance_helper( 'get_order_product_cogs_value', false ) );
	}

	/**
	 * A plain order falls back to its lookup rows when WooCommerce Analytics' order class is unavailable.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_plain_order_without_analytics_class_falls_back_to_lookup_rows() {
		global $wpdb;

		require_once __DIR__ . '/../stubs/class-wc-order.php';

		$order         = new \WC_Order();
		$original_wpdb = $wpdb;
		$wpdb          = new class() {
			/**
			 * WordPress table prefix.
			 *
			 * @var string
			 */
			public $prefix = 'wp_';

			/**
			 * Return the order ID as the prepared query.
			 *
			 * @param string $query    Query template.
			 * @param int    $order_id Order ID.
			 * @return int
			 */
			public function prepare( $query, $order_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return $order_id;
			}

			/**
			 * Return the order's wc_order_stats row.
			 *
			 * @param int    $order_id Prepared order ID.
			 * @param string $output   Requested output format.
			 * @return array
			 */
			public function get_row( $order_id, $output ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return array(
					'order_id'       => $order_id,
					'status'         => 'wc-completed',
					'date_created'   => '2026-09-01 10:00:00',
					'date_completed' => null,
					'date_paid'      => null,
				);
			}
		};
		$this->module  = new class() extends Modules\WooCommerce_Analytics {
			/**
			 * Stand in for the wc_order_product_lookup query.
			 *
			 * @param int $order_id Order ID.
			 * @return array
			 */
			protected function get_order_product_data_from_db( $order_id ) {
				return array( 'products_from_db' => $order_id );
			}
		};

		$stats    = null;
		$products = null;
		try {
			$stats    = $this->invoke_instance_helper( 'get_order_stats_data', $order );
			$products = $this->invoke_instance_helper( 'get_order_product_data', $order );
		} finally {
			$wpdb = $original_wpdb;
		}

		$this->assertSame( 123, $stats['order_id'] );
		$this->assertSame( 'wc-completed', $stats['status'] );
		$this->assertSame( array( 'products_from_db' => 123 ), $products );
	}

	/**
	 * A plain order, as loaded while WooCommerce Analytics is disabled, is reloaded as the Analytics order class.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_plain_order_is_reloaded_as_analytics_order() {
		require_once __DIR__ . '/../stubs/overrides/class-order.php';

		$analytics_order = $this->invoke_static_helper( 'get_analytics_order', new \WC_Order() );

		$this->assertInstanceOf( \Automattic\WooCommerce\Admin\Overrides\Order::class, $analytics_order );
		$this->assertSame( 123, $analytics_order->get_id() );
	}

	/**
	 * An order that already has the report methods is used as is, and other order classes are not swapped.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_only_plain_orders_are_reloaded_as_analytics_orders() {
		require_once __DIR__ . '/../stubs/overrides/class-order.php';

		$analytics_order = new \Automattic\WooCommerce\Admin\Overrides\Order();
		$order_subclass  = new class() extends \WC_Order {};

		$this->assertSame( $analytics_order, $this->invoke_static_helper( 'get_analytics_order', $analytics_order ) );
		$this->assertFalse( $this->invoke_static_helper( 'get_analytics_order', $order_subclass ) );
		$this->assertFalse( $this->invoke_static_helper( 'get_analytics_order', false ) );
	}

	/**
	 * A plain refund is reloaded as the Analytics refund class.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_plain_refund_is_reloaded_as_analytics_refund() {
		require_once __DIR__ . '/../stubs/overrides/class-orderrefund.php';

		$analytics_refund = $this->invoke_static_helper( 'get_analytics_order', new \WC_Order_Refund() );

		$this->assertInstanceOf( \Automattic\WooCommerce\Admin\Overrides\OrderRefund::class, $analytics_refund );
		$this->assertSame( 123, $analytics_refund->get_id() );
	}

	/**
	 * Every report getter receives the same reloaded order.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_reports_data_reloads_a_plain_order_once() {
		require_once __DIR__ . '/../stubs/overrides/class-order.php';

		$this->module = new class() extends Modules\WooCommerce_Analytics {
			/**
			 * The order each getter received.
			 *
			 * @var array
			 */
			public $received = array();

			/**
			 * Record the order passed to a getter.
			 *
			 * @param object $order The order.
			 * @return array
			 */
			private function record( $order ) {
				$this->received[] = $order;
				return array( 'data' );
			}

			/**
			 * Record the order.
			 *
			 * @param object $order The order.
			 * @return array
			 */
			protected function get_order_stats_data( $order ) {
				return $this->record( $order );
			}

			/**
			 * Record the order.
			 *
			 * @param object $order The order.
			 * @return array
			 */
			protected function get_order_attribution_data( $order ) {
				return $this->record( $order );
			}

			/**
			 * Record the order.
			 *
			 * @param object $order The order.
			 * @return array
			 */
			protected function get_order_product_data( $order ) {
				return $this->record( $order );
			}

			/**
			 * Record the order.
			 *
			 * @param object $order The order.
			 * @return array
			 */
			protected function get_order_coupon_data( $order ) {
				return $this->record( $order );
			}

			/**
			 * Record the order.
			 *
			 * @param object $order The order.
			 * @return array
			 */
			protected function get_order_tax_data( $order ) {
				return $this->record( $order );
			}
		};

		$this->invoke_instance_helper( 'build_woocommerce_analytics_reports_data', new \WC_Order() );

		$this->assertCount( 5, $this->module->received );
		$this->assertInstanceOf( \Automattic\WooCommerce\Admin\Overrides\Order::class, $this->module->received[0] );
		$this->assertCount( 1, array_unique( array_map( 'spl_object_id', $this->module->received ) ) );
	}

	/**
	 * Queried orders load as the Analytics class, and the filter added for it is removed afterwards.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_orders_are_queried_as_analytics_orders() {
		require_once __DIR__ . '/../stubs/overrides/class-order.php';
		require_once __DIR__ . '/../stubs/wc-get-orders.php';

		$orders = $this->invoke_static_helper( 'get_analytics_orders', array( 'post__in' => array( 123 ) ) );

		$this->assertInstanceOf( \Automattic\WooCommerce\Admin\Overrides\Order::class, $orders[0] );
		$this->assertFalse( has_filter( 'woocommerce_order_class', array( \Automattic\WooCommerce\Admin\Overrides\Order::class, 'order_class_name' ) ) );
	}

	/**
	 * The class filter WooCommerce adds while Analytics is enabled survives the query.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_querying_orders_keeps_woocommerce_analytics_filter() {
		require_once __DIR__ . '/../stubs/overrides/class-order.php';
		require_once __DIR__ . '/../stubs/wc-get-orders.php';

		$callback = array( \Automattic\WooCommerce\Admin\Overrides\Order::class, 'order_class_name' );
		add_filter( 'woocommerce_order_class', $callback, 10, 3 );

		$this->invoke_static_helper( 'get_analytics_orders', array( 'post__in' => array( 123 ) ) );

		$this->assertSame( 10, has_filter( 'woocommerce_order_class', $callback ) );
	}

	/**
	 * The size filter always lets the first object through, then stops at the cap.
	 */
	public function test_filter_analytics_objects_by_size_always_allows_first_object() {
		$oversized = array( 10 => str_repeat( 'x', Modules\Module::MAX_SIZE_FULL_SYNC + 1 ) );

		list( $ids, $objects ) = $this->module->filter_analytics_objects_by_size( $oversized );

		$this->assertSame( array( 10 ), $ids );
		$this->assertSame( $oversized, $objects );
	}

	/**
	 * Objects past the size cap are dropped, preserving order.
	 */
	public function test_filter_analytics_objects_by_size_enforces_cap() {
		$half    = str_repeat( 'x', (int) ( Modules\Module::MAX_SIZE_FULL_SYNC * 0.6 ) );
		$objects = array(
			1 => $half,
			2 => $half,
			3 => 'small',
		);

		list( $ids, $filtered ) = $this->module->filter_analytics_objects_by_size( $objects );

		$this->assertSame( array( 1 ), $ids );
		$this->assertSame( array( 1 => $half ), $filtered );
	}

	/**
	 * A partial refund followed by a full refund does not double-count the returns amount (woocommerce/woocommerce#66320).
	 */
	public function test_partial_then_full_refund_does_not_double_count_returns() {
		$this->load_order_stubs();

		// Order: net 40 (4 x $10 product) + tax 5 + shipping 10 = 55 gross.
		$order   = $this->get_paid_order();
		$partial = new \Analytics_Fake_Refund(
			array(
				'id'         => 11,
				'parent_id'  => 10,
				'total'      => '-20.00',
				'quantities' => array( -2 ),
			)
		);
		$full    = new \Analytics_Fake_Refund(
			array(
				'id'        => 12,
				'parent_id' => 10,
				'total'     => '-35.00',
				'meta'      => array( '_refund_type' => 'full' ),
			)
		);

		$order->props['refunds'] = array( $full, $partial );

		$partial_row = $this->get_order_stats_row( $partial, $order );
		$full_row    = $this->get_order_stats_row( $full, $order );

		$this->assertSame( array( -2, -2 ), array( $partial_row['num_items_sold'], $full_row['num_items_sold'] ) );
		$this->assertEqualsWithDelta( -20.0, $partial_row['net_total'], 0.001 );
		$this->assertEqualsWithDelta( -20.0, $full_row['net_total'], 0.001 );
		$this->assertEqualsWithDelta( -5.0, $full_row['tax_total'], 0.001 );
		$this->assertEqualsWithDelta( -10.0, $full_row['shipping_total'], 0.001 );

		$returns = 0;
		foreach ( array( $partial_row, $full_row ) as $row ) {
			$returns += $row['net_total'] + $row['tax_total'] + $row['shipping_total'];
		}
		$this->assertEqualsWithDelta( -55.0, $returns, 0.02 );
	}

	/**
	 * A lump-sum refund of a never-paid order has no paid or completed date (woocommerce/woocommerce#67710).
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_refund_of_never_paid_order_has_null_date_paid() {
		$this->load_order_stubs( '11.2.0' );

		$order  = $this->get_paid_order(
			array(
				'status'         => 'refunded',
				'date_paid'      => null,
				'date_completed' => null,
			)
		);
		$refund = $this->get_lump_sum_refund( $order );

		$row = $this->get_order_stats_row( $refund, $order );

		$this->assertNull( $row['date_paid'] );
		$this->assertNull( $row['date_completed'] );
	}

	/**
	 * A refund of a paid order keeps its own creation date as its paid and completed dates (woocommerce/woocommerce#67710).
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_refund_of_paid_order_keeps_own_date_paid() {
		$this->load_order_stubs( '11.2.0' );

		$order  = $this->get_paid_order();
		$refund = $this->get_lump_sum_refund( $order );

		$row = $this->get_order_stats_row( $refund, $order );

		$this->assertEquals( $row['date_created'], $row['date_paid'] );
		$this->assertEquals( $row['date_created'], $row['date_completed'] );
		$this->assertSame( '2026-02-01 14:30:00.000000', $row['date_paid']->date );
	}

	/**
	 * A refund of a paid but never completed order backfills only the paid date (woocommerce/woocommerce#67710).
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_refund_of_paid_uncompleted_order_backfills_only_date_paid() {
		$this->load_order_stubs( '11.2.0' );

		$order  = $this->get_paid_order(
			array(
				'status'         => 'processing',
				'date_completed' => null,
			)
		);
		$refund = $this->get_lump_sum_refund( $order );

		$row = $this->get_order_stats_row( $refund, $order );

		$this->assertEquals( $row['date_created'], $row['date_paid'] );
		$this->assertNull( $row['date_completed'] );
	}

	/**
	 * Before WooCommerce 11.2, core backfills both dates on every refund, so the sync does too.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_refund_of_never_paid_order_keeps_dates_before_woocommerce_11_2() {
		$this->load_order_stubs( '11.1.9' );

		$order  = $this->get_paid_order(
			array(
				'date_paid'      => null,
				'date_completed' => null,
			)
		);
		$refund = $this->get_lump_sum_refund( $order );

		$row = $this->get_order_stats_row( $refund, $order );

		$this->assertEquals( $row['date_created'], $row['date_paid'] );
		$this->assertEquals( $row['date_created'], $row['date_completed'] );
	}

	/**
	 * A refund keeps its own status, which the WooCommerce Analytics plugin writes over core's parent status.
	 */
	public function test_refund_keeps_its_own_status() {
		$this->load_order_stubs();

		$order  = $this->get_paid_order( array( 'status' => 'refunded' ) );
		$refund = $this->get_lump_sum_refund( $order );

		$row = $this->get_order_stats_row( $refund, $order );

		$this->assertSame( $this->invoke_static_helper( 'normalize_order_status', 'completed' ), $row['status'] );
	}

	/**
	 * A sole lump-sum refund of the whole order takes its amounts from the order, as a full refund does.
	 */
	public function test_sole_lump_sum_refund_of_order_total_is_split_using_parent_order() {
		$this->load_order_stubs();

		$order  = $this->get_paid_order();
		$refund = $this->get_lump_sum_refund( $order );

		$row = $this->get_order_stats_row( $refund, $order );

		$this->assertSame( -4, $row['num_items_sold'] );
		$this->assertEqualsWithDelta( -40.0, $row['net_total'], 0.001 );
		$this->assertEqualsWithDelta( -5.0, $row['tax_total'], 0.001 );
		$this->assertEqualsWithDelta( -10.0, $row['shipping_total'], 0.001 );
	}

	/**
	 * A partial lump-sum refund keeps its own amounts.
	 */
	public function test_partial_lump_sum_refund_keeps_own_amounts() {
		$this->load_order_stubs();

		$order  = $this->get_paid_order();
		$refund = $this->get_lump_sum_refund( $order, '-30.00' );

		$row = $this->get_order_stats_row( $refund, $order );

		$this->assertSame( 0, $row['num_items_sold'] );
		$this->assertEqualsWithDelta( -30.0, $row['net_total'], 0.001 );
		$this->assertEqualsWithDelta( 0.0, $row['tax_total'], 0.001 );
		$this->assertEqualsWithDelta( 0.0, $row['shipping_total'], 0.001 );
	}

	/**
	 * A full refund keeps its own amounts while WooCommerce stores full refunds in the old format.
	 */
	public function test_full_refund_keeps_own_amounts_with_old_full_refund_data() {
		$this->load_order_stubs();
		$GLOBALS['jetpack_sync_test_old_full_refund_data'] = true;

		$order  = $this->get_paid_order();
		$refund = $this->get_lump_sum_refund( $order );

		$row = $this->get_order_stats_row( $refund, $order );

		$this->assertSame( 0, $row['num_items_sold'] );
		$this->assertEqualsWithDelta( -55.0, $row['net_total'], 0.001 );
		$this->assertEqualsWithDelta( 0.0, $row['tax_total'], 0.001 );
	}

	/**
	 * A refund whose parent is another refund keeps its own amounts and backfilled dates.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_refund_of_refund_keeps_own_amounts_and_dates() {
		$this->load_order_stubs( '11.2.0' );

		$parent_refund = new \Analytics_Fake_Refund(
			array(
				'id'        => 30,
				'parent_id' => 10,
				'total'     => '-55.00',
			)
		);
		$refund        = new \Analytics_Fake_Refund(
			array(
				'id'           => 31,
				'parent_id'    => 30,
				'total'        => '-5.00',
				'meta'         => array( '_refund_type' => 'full' ),
				'date_created' => '2026-02-01 09:00:00',
			)
		);

		$row = $this->get_order_stats_row( $refund, $parent_refund );

		$this->assertSame( 30, $row['parent_id'] );
		$this->assertEqualsWithDelta( -5.0, $row['net_total'], 0.001 );
		$this->assertEquals( $row['date_created'], $row['date_paid'] );
		$this->assertEquals( $row['date_created'], $row['date_completed'] );
	}

	/**
	 * A refund whose parent order is gone keeps its own amounts and backfilled dates.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_refund_with_missing_parent_keeps_own_amounts_and_dates() {
		$this->load_order_stubs( '11.2.0' );

		$refund = new \Analytics_Fake_Refund(
			array(
				'id'        => 13,
				'parent_id' => 10,
				'total'     => '-55.00',
				'meta'      => array( '_refund_type' => 'full' ),
			)
		);

		$row = $this->get_order_stats_row( $refund );

		$this->assertSame( 10, $row['parent_id'] );
		$this->assertEqualsWithDelta( -55.0, $row['net_total'], 0.001 );
		$this->assertEquals( $row['date_created'], $row['date_paid'] );
		$this->assertEquals( $row['date_created'], $row['date_completed'] );
	}

	/**
	 * The order stats filter gets the columns, formats and unshifted dates core passes it.
	 */
	public function test_order_stats_filter_receives_core_columns() {
		$this->load_order_stubs();

		$received = null;
		add_filter(
			'woocommerce_analytics_update_order_stats_data',
			static function ( $data ) use ( &$received ) {
				$received = $data;
				return $data;
			}
		);

		$this->get_order_stats_row( $this->get_paid_order() );

		$this->assertIsArray( $received );
		$this->assertSame(
			array( 'order_id', 'parent_id', 'date_created', 'date_paid', 'date_completed', 'date_created_gmt', 'num_items_sold', 'total_sales', 'tax_total', 'shipping_total', 'net_total', 'status', 'customer_id', 'returning_customer' ),
			array_keys( $received )
		);
		$this->assertSame( '2026-01-15 12:00:00', $received['date_created'] );
		$this->assertSame( '2026-01-15 12:00:00', $received['date_created_gmt'] );
		$this->assertSame( 4, $received['num_items_sold'] );
	}

	/**
	 * Core columns the filter changes reach the row; other keys do not.
	 */
	public function test_order_stats_filter_changes_reach_core_columns_only() {
		$this->load_order_stubs();

		add_filter(
			'woocommerce_analytics_update_order_stats_data',
			static function ( $data ) {
				$data['net_total']      = 12.5;
				$data['date_created']   = '2026-07-01 10:00:00';
				$data['date_paid']      = '2026-01-15 13:06:00';
				$data['date_completed'] = null;
				$data['total_fees']     = 99;
				$data['extra']          = 'ignored';
				return $data;
			}
		);

		$row = $this->get_order_stats_row( $this->get_paid_order() );

		$this->assertSame( 12.5, $row['net_total'] );
		// Read in the site's Europe/Amsterdam timezone (summer +02:00, winter +01:00), then sent at the +05:30 offset.
		$this->assertSame( '2026-07-01 13:30:00.000000', $row['date_created']->date );
		$this->assertSame( '2026-01-15 17:36:00.000000', $row['date_paid']->date );
		$this->assertNull( $row['date_completed'] );
		$this->assertSame( 0.0, $row['total_fees'] );
		$this->assertArrayNotHasKey( 'extra', $row );
		$this->assertArrayNotHasKey( 'date_created_gmt', $row );
	}

	/**
	 * A refund keeps its own status even when the order stats filter changes it, as core's refund block overrides it.
	 */
	public function test_refund_status_ignores_order_stats_filter() {
		$this->load_order_stubs();

		add_filter(
			'woocommerce_analytics_update_order_stats_data',
			static function ( $data ) {
				$data['status'] = 'wc-cancelled';
				return $data;
			}
		);

		$order  = $this->get_paid_order();
		$refund = $this->get_lump_sum_refund( $order );

		$this->assertSame( $this->invoke_static_helper( 'normalize_order_status', 'completed' ), $this->get_order_stats_row( $refund, $order )['status'] );
	}

	/**
	 * With fulfillments on, the filter gets core's fulfillment_status (WooCommerce 11.0+ class) and can change it.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_order_stats_filter_receives_fulfillment_status() {
		$this->load_order_stubs();
		require_once __DIR__ . '/../stubs/utilities/class-featuresutil.php';
		require_once __DIR__ . '/../stubs/fulfillments/class-fulfillmentutils.php';
		require_once __DIR__ . '/../stubs/reports/class-datastore.php';

		// The stored row, written by core after the same filter ran.
		$original_wpdb   = $GLOBALS['wpdb'];
		$GLOBALS['wpdb'] = new class() {
			/**
			 * Table prefix.
			 *
			 * @var string
			 */
			public $prefix = 'wp_';

			/**
			 * Return the query unchanged.
			 *
			 * @param string $query Query.
			 * @return string
			 */
			public function prepare( $query ) {
				return $query;
			}

			/**
			 * Return the stored stats row.
			 *
			 * @return array
			 */
			public function get_row() {
				return array( 'fulfillment_status' => 'partially_fulfilled' );
			}
		};

		$received = null;
		add_filter(
			'woocommerce_analytics_update_order_stats_data',
			static function ( $data ) use ( &$received ) {
				$received                   = $data;
				$data['fulfillment_status'] = 'partially_fulfilled';
				return $data;
			}
		);

		$row = null;
		try {
			$row = $this->get_order_stats_row( $this->get_paid_order() );
		} finally {
			$GLOBALS['wpdb'] = $original_wpdb;
		}

		$this->assertIsArray( $row );
		$this->assertIsArray( $received );
		$this->assertSame( 'fulfilled', $received['fulfillment_status'] );
		$this->assertSame( 'partially_fulfilled', $row['fulfillment_status'] );
	}

	/**
	 * A filter that changes nothing leaves the row as it was.
	 */
	public function test_unchanged_order_stats_filter_leaves_row_alone() {
		$this->load_order_stubs();

		$unfiltered = $this->get_order_stats_row( $this->get_paid_order() );

		add_filter(
			'woocommerce_analytics_update_order_stats_data',
			static function ( $data ) {
				return $data;
			}
		);

		$this->assertEquals( $unfiltered, $this->get_order_stats_row( $this->get_paid_order() ) );
	}

	/**
	 * The refund block runs after the filter, as in core, so a full refund's amounts win.
	 */
	public function test_refund_amounts_override_order_stats_filter() {
		$this->load_order_stubs();

		add_filter(
			'woocommerce_analytics_update_order_stats_data',
			static function ( $data ) {
				$data['tax_total'] = 99;
				return $data;
			}
		);

		$order  = $this->get_paid_order();
		$refund = $this->get_lump_sum_refund( $order );

		$this->assertEqualsWithDelta( -5.0, $this->get_order_stats_row( $refund, $order )['tax_total'], 0.001 );
	}

	/**
	 * Load the order stubs, defining WC_VERSION when given (only in a separate process).
	 *
	 * @param string|null $wc_version WooCommerce version.
	 */
	private function load_order_stubs( $wc_version = null ) {
		require_once __DIR__ . '/../stubs/class-wc-datetime.php';
		require_once __DIR__ . '/../stubs/woocommerce-analytics-functions.php';
		require_once __DIR__ . '/../fixtures/class-analytics-fake-order.php';
		require_once __DIR__ . '/../fixtures/class-analytics-fake-refund.php';
		require_once __DIR__ . '/../stubs/utilities/class-orderutil.php';

		if ( null !== $wc_version ) {
			define( 'WC_VERSION', $wc_version );
		}
	}

	/**
	 * Get a paid, completed order: net 40 (4 items) + tax 5 + shipping 10 = 55.
	 *
	 * @param array $props Properties to override.
	 * @return \Analytics_Fake_Order
	 */
	private function get_paid_order( array $props = array() ) {
		return new \Analytics_Fake_Order(
			array_merge(
				array(
					'id'             => 10,
					'total'          => '55.00',
					'total_tax'      => '5.00',
					'shipping_total' => '10.00',
					'quantities'     => array( 4 ),
					'date_paid'      => '2026-01-15 12:05:00',
					'date_completed' => '2026-01-16 08:00:00',
				),
				$props
			)
		);
	}

	/**
	 * Get a lump-sum refund (no line items) as the order's only refund.
	 *
	 * @param \Analytics_Fake_Order $order  Parent order.
	 * @param string                $amount Refund total.
	 * @return \Analytics_Fake_Refund
	 */
	private function get_lump_sum_refund( $order, $amount = '-55.00' ) {
		$refund = new \Analytics_Fake_Refund(
			array(
				'id'           => 20,
				'parent_id'    => $order->get_id(),
				'total'        => $amount,
				'date_created' => '2026-02-01 09:00:00',
			)
		);

		$order->props['refunds'] = array( $refund );

		return $refund;
	}

	/**
	 * Build the order stats row for an order, with the given orders loadable by wc_get_order().
	 *
	 * @param object $order           Order or refund.
	 * @param object ...$known_orders Orders wc_get_order() can load.
	 * @return array
	 */
	private function get_order_stats_row( $order, ...$known_orders ) {
		foreach ( $known_orders as $known_order ) {
			$GLOBALS['jetpack_sync_test_orders'][ $known_order->get_id() ] = $known_order;
		}

		return $this->invoke_instance_helper( 'get_order_stats_data', $order );
	}

	/**
	 * Invoke a protected static helper on the Analytics module.
	 *
	 * @param string $method_name Helper method name.
	 * @param mixed  ...$arguments Helper arguments.
	 * @return mixed
	 */
	private function invoke_static_helper( $method_name, ...$arguments ) {
		$method = new \ReflectionMethod( Modules\WooCommerce_Analytics::class, $method_name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invokeArgs( null, $arguments );
	}

	/**
	 * Invoke a non-public instance helper on the Analytics module.
	 *
	 * @param string $method_name Helper method name.
	 * @param mixed  ...$arguments Helper arguments.
	 * @return mixed
	 */
	private function invoke_instance_helper( $method_name, ...$arguments ) {
		$method = new \ReflectionMethod( Modules\WooCommerce_Analytics::class, $method_name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invokeArgs( $this->module, $arguments );
	}

	/**
	 * Get an order stub that returns each requested meta key as its value.
	 *
	 * @return object
	 */
	private function get_order_stub() {
		return new class() {
			/**
			 * Get the order ID.
			 *
			 * @return int
			 */
			public function get_id() {
				return 123;
			}

			/**
			 * Get the order type.
			 *
			 * @return string
			 */
			public function get_type() {
				return 'shop_order';
			}

			/**
			 * Return the requested meta key.
			 *
			 * @param string $key    Meta key.
			 * @param bool   $single Whether to return a single value.
			 * @return string
			 */
			public function get_meta( $key, $single = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return $key;
			}
		};
	}

	/**
	 * Get an order stub whose meta values are tagged with the stub's own label.
	 *
	 * Lets attribution tests prove which order object supplied the meta.
	 *
	 * @param int    $id        Order ID.
	 * @param string $type      Order type.
	 * @param int    $parent_id Parent order ID.
	 * @param string $label     Label prefixed onto returned meta values.
	 * @return object
	 */
	private function get_attribution_stub( $id, $type, $parent_id, $label ) {
		return new class( $id, $type, $parent_id, $label ) {
			/**
			 * Order ID.
			 *
			 * @var int
			 */
			private $id;

			/**
			 * Order type.
			 *
			 * @var string
			 */
			private $type;

			/**
			 * Parent order ID.
			 *
			 * @var int
			 */
			private $parent_id;

			/**
			 * Meta value label.
			 *
			 * @var string
			 */
			private $label;

			/**
			 * Constructor.
			 *
			 * @param int    $id        Order ID.
			 * @param string $type      Order type.
			 * @param int    $parent_id Parent order ID.
			 * @param string $label     Label prefixed onto returned meta values.
			 */
			public function __construct( $id, $type, $parent_id, $label ) {
				$this->id        = $id;
				$this->type      = $type;
				$this->parent_id = $parent_id;
				$this->label     = $label;
			}

			/**
			 * Get the order ID.
			 *
			 * @return int
			 */
			public function get_id() {
				return $this->id;
			}

			/**
			 * Get the order type.
			 *
			 * @return string
			 */
			public function get_type() {
				return $this->type;
			}

			/**
			 * Get the parent order ID.
			 *
			 * @return int
			 */
			public function get_parent_id() {
				return $this->parent_id;
			}

			/**
			 * Return the requested meta key tagged with this stub's label.
			 *
			 * @param string $key    Meta key.
			 * @param bool   $single Whether to return a single value.
			 * @return string
			 */
			public function get_meta( $key, $single = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return $this->label . ':' . $key;
			}
		};
	}
}
