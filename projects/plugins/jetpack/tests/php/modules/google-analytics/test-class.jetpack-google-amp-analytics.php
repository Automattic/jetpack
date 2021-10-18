<?php
/**
 * Tests for the WooCommerce Google Analytics.
 *
 * @package automattic/jetpack
 */

/**
 * Class WP_Test_Jetpack_Google_AMP_Analytics
 */
class WP_Test_Jetpack_Google_AMP_Analytics extends WP_UnitTestCase {

	/**
	 * A WooCommerce product.
	 *
	 * @var WC_Product
	 */
	protected $product;

	/**
	 * Is Woo Enabled
	 *
	 * @var bool
	 */
	protected static $woo_enabled;

	/**
	 * Runs the routine before setting up all tests.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		if ( 1 !== (int) getenv( 'JETPACK_TEST_WOOCOMMERCE' ) ) {
			return;
		}

		self::$woo_enabled = true;

		$woo_tests_dir = dirname( __FILE__ ) . '/../../../../woocommerce/tests';

		if ( ! file_exists( $woo_tests_dir ) ) {
			error_log( 'PLEASE RUN THE GIT VERSION OF WooCommerce that has the tests folder. Found at github.com/WooCommerce/woocommerce' );
			self::$woo_enabled = false;
		}
	}

	/**
	 * Runs the routine before each test is executed.
	 *
	 * @return void
	 */
	public function set_up() {
		if ( ! self::$woo_enabled ) {
			$this->markTestSkipped();
			return;
		}

		parent::set_up();

		add_filter( 'jetpack_is_amp_request', '__return_true' );

		$this->product = $this->create_product();

		WC()->cart->empty_cart();
		WC()->initialize_session();
	}

	/**
	 * Confirm that the Session is properly updated when adding to cart.
	 */
	public function test_add_to_cart() {
		WC()->cart->add_to_cart( $this->product->get_id() );

		$this->assertEqualsCanonicalizing(
			WC()->session->get( 'wc_ga_events' ),
			array(
				array(
					'type'      => 'add',
					'ga_params' => array(
						'pa'    => 'add',
						'pr1id' => 'DUMMY SKU',
						'pr1nm' => 'Dummy Product',
						'pr1qt' => 1,
					),
				),
			)
		);
	}

	/**
	 * Confirm that the Session is properly updated in the thank you page.
	 */
	public function test_after_purchase() {

		$order = $this->create_order();
		remove_action( 'woocommerce_thankyou', 'woocommerce_order_details_table', 10 );
		do_action( 'woocommerce_thankyou', $order->get_id() );

		$i     = 1;
		$event = array(
			'type'      => 'purchase',
			'ga_params' => array(
				'pa' => 'purchase',
				'ti' => $order->get_id(),
				'tr' => $order->get_total(),
				'tt' => $order->get_total_tax(),
			),
		);
		foreach ( $order->get_items() as $item ) {
			$product = $item->get_product();
			if ( $product ) {
				$event['ga_params'][ 'pr' . $i . 'id' ] = Jetpack_Google_Analytics_Utils::get_product_sku_or_id( $product );
				$event['ga_params'][ 'pr' . $i . 'nm' ] = $item->get_name();
				$event['ga_params'][ 'pr' . $i . 'qt' ] = $item->get_quantity();
				$i++;
			}
		}

		$events = array( $event );

		$this->assertEqualsCanonicalizing(
			WC()->session->get( 'wc_ga_events' ),
			array_merge(
				array(
					array(
						'type'      => 'add',
						'ga_params' => array(
							'pa'    => 'add',
							'pr1id' => 'DUMMY SKU',
							'pr1nm' => 'Dummy Product',
							'pr1qt' => 1,
						),
					),
				),
				$events
			)
		);
	}

	/**
	 * Mimic WC_Helper_Product::create_product() WooCommerce helper.
	 *
	 * @return WC_Product
	 */
	protected function create_product() {
		$product = new WC_Product_Simple();
		$product->set_props(
			array(
				'name'          => 'Dummy Product',
				'regular_price' => 10,
				'price'         => 10,
				'sku'           => 'DUMMY SKU',
				'manage_stock'  => false,
				'tax_status'    => 'taxable',
				'downloadable'  => false,
				'virtual'       => false,
				'stock_status'  => 'instock',
				'weight'        => '1.1',
			)
		);

		$product->save();
		return wc_get_product( $product->get_id() );
	}

	/**
	 * Mimic WC_Helper_Order::create_order() WooCommerce helper.
	 *
	 * @return WC_Order
	 */
	protected function create_order() {
		$_SERVER['REMOTE_ADDR'] = '127.0.0.1'; // Required, else wc_create_order throws an exception.

		$order = wc_create_order(
			array(
				'status'        => 'pending',
				'customer_id'   => 1,
				'customer_note' => '',
				'total'         => '',
			)
		);

		// Add order products.
		$item = new WC_Order_Item_Product();
		$item->set_props(
			array(
				'product'  => $this->product,
				'quantity' => 1,
				'subtotal' => wc_get_price_excluding_tax( $this->product, array( 'qty' => 1 ) ),
				'total'    => wc_get_price_excluding_tax( $this->product, array( 'qty' => 1 ) ),
			)
		);
		$item->save();
		$order->add_item( $item );

		// Set billing address.
		$order->set_billing_first_name( 'Jeroen' );
		$order->set_billing_last_name( 'Sormani' );
		$order->set_billing_company( 'WooCompany' );
		$order->set_billing_address_1( 'WooAddress' );
		$order->set_billing_address_2( '' );
		$order->set_billing_city( 'WooCity' );
		$order->set_billing_state( 'NY' );
		$order->set_billing_postcode( '12345' );
		$order->set_billing_country( 'US' );
		$order->set_billing_email( 'admin@example.org' );
		$order->set_billing_phone( '555-32123' );

		// Add shipping costs.
		$shipping_taxes = WC_Tax::calc_shipping_tax( '10', WC_Tax::get_shipping_tax_rates() );
		$rate           = new WC_Shipping_Rate( 'flat_rate_shipping', 'Flat rate shipping', '10', $shipping_taxes, 'flat_rate' );
		$item           = new WC_Order_Item_Shipping();
		$item->set_props(
			array(
				'method_title' => $rate->label,
				'method_id'    => $rate->id,
				'total'        => wc_format_decimal( $rate->cost ),
				'taxes'        => $rate->taxes,
			)
		);
		foreach ( $rate->get_meta_data() as $key => $value ) {
			$item->add_meta_data( $key, $value, true );
		}
		$order->add_item( $item );

		// Set payment gateway.
		$payment_gateways = WC()->payment_gateways->payment_gateways();
		$order->set_payment_method( $payment_gateways['bacs'] );

		// Set totals.
		$order->set_shipping_total( 10 );
		$order->set_discount_total( 0 );
		$order->set_discount_tax( 0 );
		$order->set_cart_tax( 0 );
		$order->set_shipping_tax( 0 );
		$order->set_total( 10 ); // 1 x $10 simple helper product
		$order->save();

		return $order;
	}
}
