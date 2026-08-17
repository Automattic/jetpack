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
	 * tracker and JS, Woo AI). It must never change.
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
	 * Analytics datetime conversion retains its fixed site-offset behavior.
	 */
	public function test_datetime_conversion() {
		$this->assertNull( $this->invoke_static_helper( 'datetime_to_object', null ) );

		$from_string = $this->invoke_static_helper( 'datetime_to_object', '2024-01-02 03:04:05' );
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
	 * Invoke a protected static helper on the Analytics module.
	 *
	 * @param string $method_name Helper method name.
	 * @param mixed  $argument    Helper argument.
	 * @return mixed
	 */
	private function invoke_static_helper( $method_name, $argument ) {
		$method = new \ReflectionMethod( Modules\WooCommerce_Analytics::class, $method_name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( null, $argument );
	}

	/**
	 * Invoke a non-public instance helper on the Analytics module.
	 *
	 * @param string $method_name Helper method name.
	 * @param mixed  $argument    Helper argument.
	 * @return mixed
	 */
	private function invoke_instance_helper( $method_name, $argument ) {
		$method = new \ReflectionMethod( Modules\WooCommerce_Analytics::class, $method_name );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( $this->module, $argument );
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
