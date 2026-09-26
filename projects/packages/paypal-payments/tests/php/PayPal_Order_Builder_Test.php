<?php
/**
 * Tests for the PayPal_Order_Builder class.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_Order_Builder_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Order_Builder
 */
#[CoversClass( PayPal_Order_Builder::class )]
class PayPal_Order_Builder_Test extends TestCase {

	/**
	 * A payment link, as PayPal returns it.
	 *
	 * @param array $item Line item fields to add or override.
	 * @return array
	 */
	private function resource( array $item = array() ) {
		return array(
			'id'         => 'PLB-ORDER1',
			'line_items' => array(
				array_merge(
					array(
						'name'        => 'Widget',
						'description' => 'A fine widget.',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '10.00',
						),
					),
					$item
				),
			),
		);
	}

	/**
	 * A line item priced per option.
	 *
	 * @return array
	 */
	private function sized_item() {
		return array(
			'unit_amount' => null,
			'variants'    => array(
				'dimensions' => array(
					array(
						'name'    => 'Size',
						'primary' => true,
						'options' => array(
							array(
								'label'       => 'Small',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '12.50',
								),
							),
							array(
								'label'       => 'Large',
								'unit_amount' => array(
									'currency_code' => 'USD',
									'value'         => '20.00',
								),
							),
						),
					),
					array(
						'name'    => 'Color',
						'options' => array(
							array( 'label' => 'Red' ),
							array( 'label' => 'Blue' ),
						),
					),
				),
			),
		);
	}

	public function test_prices_a_fixed_price_item_by_quantity() {
		$built = PayPal_Order_Builder::build( $this->resource( array( 'adjustable_quantity' => array( 'maximum' => 5 ) ) ), 3 );

		$this->assertIsArray( $built );
		$unit = $built['purchase_unit'];
		$this->assertSame( 'PLB-ORDER1', $unit['custom_id'] );
		$this->assertSame( '30.00', $unit['amount']['value'] );
		$this->assertSame( 'USD', $unit['amount']['currency_code'] );
		$this->assertSame(
			array(
				'item_total' => array(
					'currency_code' => 'USD',
					'value'         => '30.00',
				),
			),
			$unit['amount']['breakdown']
		);
		$this->assertSame( 'Widget', $unit['items'][0]['name'] );
		$this->assertSame( '3', $unit['items'][0]['quantity'] );
		$this->assertSame( '10.00', $unit['items'][0]['unit_amount']['value'] );
		$this->assertSame( 'A fine widget.', $unit['items'][0]['description'] );
		$this->assertSame( '30.00', $built['summary']['total'] );
	}

	public function test_prices_from_the_chosen_primary_option() {
		$built = PayPal_Order_Builder::build(
			$this->resource( $this->sized_item() ),
			1,
			array(
				'Size'  => 'Large',
				'Color' => 'Red',
			)
		);

		$this->assertIsArray( $built );
		$this->assertSame( '20.00', $built['purchase_unit']['amount']['value'] );
		// The chosen options replace the product description, so the merchant sees what sold.
		$this->assertSame( 'Size: Large, Color: Red', $built['purchase_unit']['items'][0]['description'] );
		$this->assertSame(
			array(
				array(
					'name'  => 'Size',
					'label' => 'Large',
				),
				array(
					'name'  => 'Color',
					'label' => 'Red',
				),
			),
			$built['summary']['options']
		);
	}

	public function test_rejects_a_missing_or_unknown_option() {
		$missing = PayPal_Order_Builder::build( $this->resource( $this->sized_item() ), 1, array( 'Size' => 'Large' ) );
		$unknown = PayPal_Order_Builder::build(
			$this->resource( $this->sized_item() ),
			1,
			array(
				'Size'  => 'Huge',
				'Color' => 'Red',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $missing );
		$this->assertSame( 'paypal_order_invalid_option', $missing->get_error_code() );
		$this->assertStringContainsString( 'Color', $missing->get_error_message() );
		$this->assertInstanceOf( \WP_Error::class, $unknown );
		$this->assertSame( 'paypal_order_invalid_option', $unknown->get_error_code() );
	}

	public function test_the_option_price_never_comes_from_the_request() {
		// A selection can name a label only; a price in it changes nothing.
		$built = PayPal_Order_Builder::build(
			$this->resource( $this->sized_item() ),
			1,
			array(
				'Size'  => 'Small',
				'Color' => 'Blue',
				'price' => '0.01',
			)
		);

		$this->assertSame( '12.50', $built['purchase_unit']['amount']['value'] );
	}

	public function test_rejects_a_quantity_the_payment_does_not_allow() {
		$fixed = PayPal_Order_Builder::build( $this->resource(), 2 );
		$over  = PayPal_Order_Builder::build( $this->resource( array( 'adjustable_quantity' => array( 'maximum' => 3 ) ) ), 4 );
		$zero  = PayPal_Order_Builder::build( $this->resource(), 0 );

		foreach ( array( $fixed, $over, $zero ) as $result ) {
			$this->assertInstanceOf( \WP_Error::class, $result );
			$this->assertSame( 'paypal_order_invalid_quantity', $result->get_error_code() );
		}
	}

	public function test_adds_tax_shipping_handling_and_discount_to_the_breakdown() {
		$built = PayPal_Order_Builder::build(
			$this->resource(
				array(
					'adjustable_quantity' => array( 'maximum' => 10 ),
					'taxes'               => array(
						array(
							'type'  => 'PERCENTAGE',
							'value' => '10',
						),
					),
					'shipping'            => array(
						array(
							'type'                  => 'FLAT',
							'value'                 => '5.00',
							'additional_unit_value' => '1.50',
						),
					),
					'handling'            => array( array( 'value' => '2.00' ) ),
					'discounts'           => array(
						array(
							'type'  => 'FLAT',
							'value' => '4.00',
						),
					),
				)
			),
			3
		);

		$breakdown = $built['purchase_unit']['amount']['breakdown'];
		$this->assertSame( '30.00', $breakdown['item_total']['value'] );
		$this->assertSame( '3.00', $breakdown['tax_total']['value'] );
		// 5.00 for the first unit, 1.50 for each of the other two.
		$this->assertSame( '8.00', $breakdown['shipping']['value'] );
		$this->assertSame( '2.00', $breakdown['handling']['value'] );
		$this->assertSame( '4.00', $breakdown['discount']['value'] );
		$this->assertSame( '39.00', $built['purchase_unit']['amount']['value'] );
	}

	public function test_a_flat_tax_is_charged_per_unit_and_a_percentage_discount_on_the_items() {
		$built = PayPal_Order_Builder::build(
			$this->resource(
				array(
					'adjustable_quantity' => array( 'maximum' => 10 ),
					'taxes'               => array(
						array(
							'type'  => 'FLAT',
							'value' => '0.50',
						),
					),
					'discounts'           => array(
						array(
							'type'  => 'PERCENTAGE',
							'value' => '25',
						),
					),
				)
			),
			2
		);

		$breakdown = $built['purchase_unit']['amount']['breakdown'];
		$this->assertSame( '1.00', $breakdown['tax_total']['value'] );
		$this->assertSame( '5.00', $breakdown['discount']['value'] );
		$this->assertSame( '16.00', $built['purchase_unit']['amount']['value'] );
	}

	public function test_refuses_rates_that_live_in_the_paypal_account() {
		$tax      = PayPal_Order_Builder::build( $this->resource( array( 'taxes' => array( array( 'type' => 'PREFERENCE' ) ) ) ), 1 );
		$shipping = PayPal_Order_Builder::build(
			$this->resource(
				array(
					'shipping' => array(
						array(
							'type'  => 'PREFERENCE',
							'value' => 'PROFILE',
						),
					),
				)
			),
			1
		);
		$free     = PayPal_Order_Builder::build(
			$this->resource(
				array(
					'shipping' => array(
						array(
							'type'  => 'PREFERENCE',
							'value' => 'FREE_SHIPPING',
						),
					),
				)
			),
			1
		);

		$this->assertSame( 'paypal_order_profile_rates', $tax->get_error_code() );
		$this->assertSame( 'paypal_order_profile_rates', $shipping->get_error_code() );
		// Free shipping is a rate the page knows.
		$this->assertIsArray( $free );
		$this->assertArrayNotHasKey( 'shipping', $free['purchase_unit']['amount']['breakdown'] );
	}

	public function test_formats_a_zero_decimal_currency_without_decimals() {
		$built = PayPal_Order_Builder::build(
			$this->resource(
				array(
					'unit_amount'         => array(
						'currency_code' => 'JPY',
						'value'         => '1500',
					),
					'adjustable_quantity' => array( 'maximum' => 2 ),
				)
			),
			2
		);

		$this->assertSame( '3000', $built['purchase_unit']['amount']['value'] );
		$this->assertSame( '1500', $built['purchase_unit']['items'][0]['unit_amount']['value'] );
	}

	public function test_rejects_a_payment_with_no_price() {
		$result = PayPal_Order_Builder::build( $this->resource( array( 'unit_amount' => null ) ), 1 );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertSame( 'paypal_order_invalid_amount', $result->get_error_code() );
	}

	public function test_supports_attributes_mirrors_the_profile_rate_rule() {
		$this->assertTrue( PayPal_Order_Builder::supports_attributes( array() ) );
		$this->assertTrue(
			PayPal_Order_Builder::supports_attributes(
				array(
					'taxEnabled'      => true,
					'taxType'         => 'PERCENTAGE',
					'shippingEnabled' => true,
					'shippingMode'    => 'FLAT',
				)
			)
		);
		$this->assertFalse(
			PayPal_Order_Builder::supports_attributes(
				array(
					'taxEnabled' => true,
					'taxType'    => 'PREFERENCE',
				)
			)
		);
		$this->assertFalse(
			PayPal_Order_Builder::supports_attributes(
				array(
					'shippingEnabled' => true,
					'shippingMode'    => 'PROFILE',
				)
			)
		);
		// A profile rate that is switched off does not count.
		$this->assertTrue(
			PayPal_Order_Builder::supports_attributes(
				array(
					'taxEnabled' => false,
					'taxType'    => 'PREFERENCE',
				)
			)
		);
	}
}
