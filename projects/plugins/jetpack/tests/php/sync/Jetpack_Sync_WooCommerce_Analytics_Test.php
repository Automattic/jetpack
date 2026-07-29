<?php

use Automattic\Jetpack\Sync\Modules;
use Automattic\Jetpack\Sync\Modules\WooCommerce_Analytics;
use Automattic\Jetpack\Sync\Replicastore\Table_Checksum;
use Automattic\WooCommerce\Admin\API\Reports\Orders\Stats\DataStore as OrderStatsDataStore;
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
	 * WooCommerce option controlling Order Attribution.
	 *
	 * @var string
	 */
	private const ORDER_ATTRIBUTION_OPTION = 'woocommerce_feature_order_attribution_enabled';

	/**
	 * Original Order Attribution option value.
	 *
	 * @var mixed
	 */
	private $original_order_attribution_option;

	/**
	 * Whether the original Order Attribution option was captured.
	 *
	 * @var bool
	 */
	private $order_attribution_option_captured = false;

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

		$this->original_order_attribution_option = get_option( self::ORDER_ATTRIBUTION_OPTION, null );
		$this->order_attribution_option_captured = true;
		$this->original_sync_modules             = Modules::get_modules();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		if ( null !== $this->original_sync_modules ) {
			$this->set_sync_modules( $this->original_sync_modules );
		}

		unset( $_GET['section'] );
		unset( $_POST['woocommerce_feature_order_attribution_enabled'] );
		unset( $_SERVER['REQUEST_METHOD'] );

		if ( $this->order_attribution_option_captured ) {
			delete_option( self::ORDER_ATTRIBUTION_OPTION );
			if ( null !== $this->original_order_attribution_option ) {
				update_option( self::ORDER_ATTRIBUTION_OPTION, $this->original_order_attribution_option );
			}
		}

		parent::tear_down();
	}

	/**
	 * Analytics checksum tables are available when the module and feature are enabled.
	 */
	public function test_analytics_checksum_tables_are_available_when_enabled() {
		$this->enable_analytics_module();
		$this->set_order_attribution_form_state( true );

		foreach ( array( 'wc_order_stats', 'wc_order_product_lookup', 'wc_order_coupon_lookup', 'wc_order_tax_lookup' ) as $table ) {
			$this->assertInstanceOf( Table_Checksum::class, new Table_Checksum( $table ) );
		}
	}

	/**
	 * Analytics checksum tables use WooCommerce's stored feature state outside settings requests.
	 */
	public function test_analytics_checksum_tables_use_stored_order_attribution_state() {
		$this->enable_analytics_module();
		update_option( self::ORDER_ATTRIBUTION_OPTION, 'yes' );

		$this->assertInstanceOf( Table_Checksum::class, new Table_Checksum( 'wc_order_stats' ) );
	}

	/**
	 * Analytics checksum tables reject use when the module is absent.
	 */
	public function test_analytics_checksum_tables_require_module() {
		$this->set_order_attribution_form_state( true );
		$this->expectException( Exception::class );

		// @phan-suppress-next-line PhanNoopNew -- Expecting the constructor to throw.
		new Table_Checksum( 'wc_order_stats' );
	}

	/**
	 * Analytics checksum tables reject use when order attribution is disabled.
	 */
	public function test_analytics_checksum_tables_require_order_attribution() {
		$this->enable_analytics_module();
		$this->set_order_attribution_form_state( false );
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
	 * Incremental Analytics sync emits the expanded reports payload for a real order.
	 */
	public function test_incremental_sync_emits_real_order_payload() {
		list( $order ) = $this->create_analytics_order();

		$captured_payload = null;
		$capture_payload  = static function ( $payload ) use ( &$captured_payload ) {
			$captured_payload = $payload;
		};

		add_action( 'woocommerce_analytics_sync_reports_data', $capture_payload );
		( new WooCommerce_Analytics() )->sync_analytics_reports_data( $order->get_id() );
		remove_action( 'woocommerce_analytics_sync_reports_data', $capture_payload );

		$this->assertIsArray( $captured_payload );
		$this->assertSame( $order->get_id(), $captured_payload['order_stats']['order_id'] );
		$this->assertSame( 2, $captured_payload['order_stats']['num_items_sold'] );
		$this->assertSame( 3.5, (float) $captured_payload['order_tax_data'][0]['total_tax'] );
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
	 */
	private function enable_analytics_module() {
		$modules = $this->original_sync_modules;
		if ( null === $modules ) {
			throw new RuntimeException( 'Sync modules were not initialized for the test.' );
		}

		$modules[] = new WooCommerce_Analytics();

		$this->set_sync_modules( $modules );
	}

	/**
	 * Make the order attribution settings request report an enabled or disabled value.
	 *
	 * @param bool $enabled Whether order attribution should be enabled.
	 */
	private function set_order_attribution_form_state( $enabled ) {
		$_GET['section']           = 'features';
		$_SERVER['REQUEST_METHOD'] = 'POST';

		if ( $enabled ) {
			$_POST['woocommerce_feature_order_attribution_enabled'] = 'yes';
		} else {
			unset( $_POST['woocommerce_feature_order_attribution_enabled'] );
		}
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
