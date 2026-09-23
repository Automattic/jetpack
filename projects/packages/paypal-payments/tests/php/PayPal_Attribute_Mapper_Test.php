<?php
/**
 * Tests for the PayPal_Attribute_Mapper class.
 *
 * Covers attribute validation, bidirectional mapping between block attributes
 * and PayPal API request/response formats, resource ID validation, and
 * merge behavior for frontend-only fields.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Class PayPal_Attribute_Mapper_Test
 *
 * @covers \Automattic\Jetpack\PaypalPayments\PayPal_Attribute_Mapper
 */
#[CoversClass( PayPal_Attribute_Mapper::class )]
class PayPal_Attribute_Mapper_Test extends TestCase {

	// --- validate_attributes: required fields ---

	/**
	 * Test that missing productName is rejected.
	 */
	public function test_validate_rejects_missing_product_name() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'price'        => '10.00',
				'currencyCode' => 'USD',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_product_name', $result->get_error_code() );
	}

	/**
	 * Test that empty productName is rejected.
	 */
	public function test_validate_rejects_empty_product_name() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => '',
				'price'        => '10.00',
				'currencyCode' => 'USD',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_product_name', $result->get_error_code() );
	}

	/**
	 * Test that whitespace-only productName is rejected.
	 */
	public function test_validate_rejects_whitespace_only_product_name() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => '   ',
				'price'        => '10.00',
				'currencyCode' => 'USD',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_product_name', $result->get_error_code() );
	}

	/**
	 * Test that an array productName is rejected.
	 *
	 * The method is public, so anything can come in. A non-string name becomes an empty
	 * string before trim() sees it.
	 */
	public function test_validate_rejects_array_product_name() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => array( 'Widget' ),
				'price'        => '10.00',
				'currencyCode' => 'USD',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_product_name', $result->get_error_code() );
	}

	/**
	 * Test that productName exceeding 127 characters is rejected.
	 */
	public function test_validate_rejects_name_too_long() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => str_repeat( 'A', 128 ),
				'price'        => '10.00',
				'currencyCode' => 'USD',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'product_name_too_long', $result->get_error_code() );
	}

	/**
	 * Test that missing price is rejected.
	 */
	public function test_validate_rejects_missing_price() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'currencyCode' => 'USD',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_price', $result->get_error_code() );
	}

	// --- validate_attributes: invalid prices ---

	/**
	 * Test that invalid price values are rejected.
	 *
	 * @param string $price The invalid price to test.
	 * @dataProvider invalid_price_provider
	 */
	#[DataProvider( 'invalid_price_provider' )]
	public function test_validate_rejects_invalid_price( $price ) {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'price'        => $price,
				'currencyCode' => 'USD',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_price', $result->get_error_code() );
	}

	/**
	 * Data provider for invalid price values.
	 *
	 * @return array[] Test cases.
	 */
	public static function invalid_price_provider(): array {
		return array(
			'negative'       => array( '-5.00' ),
			'zero'           => array( '0' ),
			'zero decimal'   => array( '0.00' ),
			'non-numeric'    => array( 'abc' ),
			'three decimals' => array( '1.999' ),
			'letters mixed'  => array( '10abc' ),
		);
	}

	// --- validate_attributes: valid prices ---

	/**
	 * Test that valid price formats are accepted.
	 *
	 * @param string $price The valid price to test.
	 * @dataProvider valid_price_provider
	 */
	#[DataProvider( 'valid_price_provider' )]
	public function test_validate_accepts_valid_price( $price ) {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'price'        => $price,
				'currencyCode' => 'USD',
			)
		);

		$this->assertTrue( $result );
	}

	/**
	 * Data provider for valid price values.
	 *
	 * @return array[] Test cases.
	 */
	public static function valid_price_provider(): array {
		return array(
			'integer'      => array( '10' ),
			'one decimal'  => array( '29.9' ),
			'two decimals' => array( '29.99' ),
			'large amount' => array( '9999' ),
			'small amount' => array( '1' ),
			'one cent'     => array( '0.01' ),
		);
	}

	// --- validate_attributes: currency ---

	/**
	 * Test that an unsupported currency code is rejected.
	 */
	public function test_validate_rejects_unsupported_currency() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'price'        => '10.00',
				'currencyCode' => 'XYZ',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_currency', $result->get_error_code() );
	}

	/**
	 * Test that every supported currency is accepted.
	 *
	 * A whole-number price, because three of them refuse decimals.
	 */
	public function test_validate_accepts_all_supported_currencies() {
		foreach ( PayPal_Attribute_Mapper::SUPPORTED_CURRENCIES as $currency ) {
			$result = PayPal_Attribute_Mapper::validate_attributes(
				array(
					'productName'  => 'Widget',
					'price'        => '10',
					'currencyCode' => $currency,
				)
			);

			$this->assertTrue( $result, "Currency $currency should be accepted" );
		}

		$this->assertCount( 24, PayPal_Attribute_Mapper::SUPPORTED_CURRENCIES );
	}

	// --- validate_attributes: zero-decimal currencies ---

	/**
	 * Data provider for the currencies PayPal prices without decimals.
	 *
	 * @return array[] Test cases.
	 */
	public static function zero_decimal_currency_provider(): array {
		return array(
			'JPY' => array( 'JPY' ),
			'HUF' => array( 'HUF' ),
			'TWD' => array( 'TWD' ),
		);
	}

	/**
	 * Test that is_zero_decimal_currency knows the three currencies and nothing else.
	 */
	public function test_is_zero_decimal_currency() {
		$this->assertTrue( PayPal_Attribute_Mapper::is_zero_decimal_currency( 'JPY' ) );
		$this->assertTrue( PayPal_Attribute_Mapper::is_zero_decimal_currency( 'huf' ) );
		$this->assertTrue( PayPal_Attribute_Mapper::is_zero_decimal_currency( 'TWD' ) );
		$this->assertFalse( PayPal_Attribute_Mapper::is_zero_decimal_currency( 'USD' ) );
		$this->assertFalse( PayPal_Attribute_Mapper::is_zero_decimal_currency( 'EUR' ) );
		// The legacy table lists INR as zero-decimal, but PayPal does not support it at all.
		$this->assertFalse( PayPal_Attribute_Mapper::is_zero_decimal_currency( 'INR' ) );
	}

	/**
	 * Test that a decimal price is rejected in a currency PayPal prices whole.
	 *
	 * @param string $currency Zero-decimal currency code.
	 * @dataProvider zero_decimal_currency_provider
	 */
	#[DataProvider( 'zero_decimal_currency_provider' )]
	public function test_validate_rejects_decimal_price_for_zero_decimal_currency( $currency ) {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'price'        => '1500.50',
				'currencyCode' => $currency,
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_price', $result->get_error_code() );
		$this->assertStringContainsString( 'whole numbers', $result->get_error_message() );
	}

	/**
	 * Test that a whole-number price is accepted in a currency PayPal prices whole.
	 *
	 * @param string $currency Zero-decimal currency code.
	 * @dataProvider zero_decimal_currency_provider
	 */
	#[DataProvider( 'zero_decimal_currency_provider' )]
	public function test_validate_accepts_whole_price_for_zero_decimal_currency( $currency ) {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'price'        => '1500',
				'currencyCode' => $currency,
			)
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test that a decimal option price is rejected in a currency PayPal prices whole.
	 *
	 * @param string $currency Zero-decimal currency code.
	 * @dataProvider zero_decimal_currency_provider
	 */
	#[DataProvider( 'zero_decimal_currency_provider' )]
	public function test_validate_rejects_decimal_option_price_for_zero_decimal_currency( $currency ) {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'currencyCode'    => $currency,
				'variantsEnabled' => true,
				'variants'        => $this->variants_with_prices( array( '1500', '1500.50' ) ),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_variant_price', $result->get_error_code() );
		$this->assertStringContainsString( 'whole numbers', $result->get_error_message() );
	}

	/**
	 * Test that whole-number option prices are accepted in a currency PayPal prices whole.
	 *
	 * @param string $currency Zero-decimal currency code.
	 * @dataProvider zero_decimal_currency_provider
	 */
	#[DataProvider( 'zero_decimal_currency_provider' )]
	public function test_validate_accepts_whole_option_prices_for_zero_decimal_currency( $currency ) {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'currencyCode'    => $currency,
				'variantsEnabled' => true,
				'variants'        => $this->variants_with_prices( array( '1500', '2000' ) ),
			)
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test that a two-decimal currency still takes decimals, on the product and on its options.
	 */
	public function test_validate_accepts_decimal_prices_for_two_decimal_currency() {
		$this->assertTrue(
			PayPal_Attribute_Mapper::validate_attributes(
				array(
					'productName'  => 'Widget',
					'price'        => '12.34',
					'currencyCode' => 'EUR',
				)
			)
		);

		$this->assertTrue(
			PayPal_Attribute_Mapper::validate_attributes(
				array(
					'productName'     => 'Widget',
					'currencyCode'    => 'EUR',
					'variantsEnabled' => true,
					'variants'        => $this->variants_with_prices( array( '12.34', '56.78' ) ),
				)
			)
		);
	}

	// --- validate_attributes: optional field length limits ---

	/**
	 * Test that description exceeding 2048 characters is rejected.
	 */
	public function test_validate_rejects_description_too_long() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'        => 'Widget',
				'price'              => '10.00',
				'currencyCode'       => 'USD',
				'productDescription' => str_repeat( 'D', 2049 ),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'description_too_long', $result->get_error_code() );
	}

	/**
	 * Test that a multi-line description exceeding 2048 characters is rejected.
	 *
	 * The count keeps the line breaks, since collapsing them makes a long description measure short.
	 */
	public function test_validate_rejects_multiline_description_too_long() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'        => 'Widget',
				'price'              => '10.00',
				'currencyCode'       => 'USD',
				// 2049 characters as written. sanitize_text_field() would collapse the two
				// newlines into one space and measure 2048.
				'productDescription' => str_repeat( 'D', 2046 ) . "\n\nD",
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'description_too_long', $result->get_error_code() );
	}

	/**
	 * Test that a description at PayPal's 2048 limit is accepted.
	 */
	public function test_validate_accepts_description_at_max_length() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'        => 'Widget',
				'price'              => '10.00',
				'currencyCode'       => 'USD',
				'productDescription' => str_repeat( 'D', 2048 ),
			)
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test that a product id exceeding 50 characters is rejected.
	 */
	public function test_validate_rejects_product_id_too_long() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'price'        => '10.00',
				'currencyCode' => 'USD',
				'productId'    => str_repeat( 'S', 51 ),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'product_id_too_long', $result->get_error_code() );
	}

	/**
	 * Test that a product id at the 50-character limit is accepted.
	 */
	public function test_validate_accepts_product_id_at_max_length() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'price'        => '10.00',
				'currencyCode' => 'USD',
				'productId'    => str_repeat( 'S', 50 ),
			)
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test that button text exceeding 50 characters is rejected.
	 */
	public function test_validate_rejects_button_text_too_long() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'price'        => '10.00',
				'currencyCode' => 'USD',
				'buttonText'   => str_repeat( 'B', 51 ),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'button_text_too_long', $result->get_error_code() );
	}

	// --- validate_attributes: URL validation ---

	/**
	 * Test that an invalid return URL is rejected.
	 */
	public function test_validate_rejects_invalid_return_url() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'price'        => '10.00',
				'currencyCode' => 'USD',
				'returnUrl'    => 'javascript:alert(1)',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_return_url', $result->get_error_code() );
	}

	/**
	 * PayPal's limit: a return URL of 127 characters passes, one more is rejected.
	 */
	public function test_validate_caps_the_return_url_at_127_characters() {
		$at_limit   = str_pad( 'https://example.com/', 127, 'a' );
		$attributes = array(
			'productName'  => 'Widget',
			'price'        => '10.00',
			'currencyCode' => 'USD',
			'returnUrl'    => $at_limit,
		);

		$this->assertTrue( PayPal_Attribute_Mapper::validate_attributes( $attributes ) );

		$attributes['returnUrl'] = $at_limit . 'a';
		$result                  = PayPal_Attribute_Mapper::validate_attributes( $attributes );

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'return_url_too_long', $result->get_error_code() );
	}

	// --- validate_attributes: valid complete ---

	/**
	 * Test that fully valid attributes pass validation.
	 */
	public function test_validate_accepts_valid_complete_attributes() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'        => 'Premium Widget',
				'price'              => '29.99',
				'currencyCode'       => 'USD',
				'productDescription' => 'A fine widget.',
				'buttonText'         => 'Buy Now',
				'returnUrl'          => 'https://example.com/thanks',
			)
		);

		$this->assertTrue( $result );
	}

	// --- attributes_to_api_request ---

	/**
	 * Test that attributes_to_api_request maps required fields correctly.
	 */
	public function test_attributes_to_api_request_maps_required_fields() {
		$request = PayPal_Attribute_Mapper::attributes_to_api_request(
			array(
				'productName'  => 'Widget',
				'price'        => '29.99',
				'currencyCode' => 'EUR',
			)
		);

		$this->assertEquals( 'BUY_NOW', $request['type'] );
		$this->assertEquals( 'LINK', $request['integration_mode'] );
		$this->assertEquals( 'MULTIPLE', $request['reusable'] );
		$this->assertCount( 1, $request['line_items'] );
		$this->assertEquals( 'Widget', $request['line_items'][0]['name'] );
		$this->assertEquals( 'EUR', $request['line_items'][0]['unit_amount']['currency_code'] );
		$this->assertSame( '29.99', $request['line_items'][0]['unit_amount']['value'] );
	}

	/**
	 * Test that attributes_to_api_request includes optional fields when present.
	 */
	public function test_attributes_to_api_request_includes_optional_fields() {
		$request = PayPal_Attribute_Mapper::attributes_to_api_request(
			array(
				'productName'        => 'Widget',
				'price'              => '29.99',
				'currencyCode'       => 'USD',
				'productDescription' => 'A great widget.',
				'returnUrl'          => 'https://example.com/thanks',
			)
		);

		$this->assertEquals( 'A great widget.', $request['line_items'][0]['description'] );
		$this->assertEquals( 'https://example.com/thanks', $request['return_url'] );
	}

	/**
	 * Test that attributes_to_api_request omits empty optional fields.
	 */
	public function test_attributes_to_api_request_omits_empty_optional_fields() {
		$request = PayPal_Attribute_Mapper::attributes_to_api_request(
			array(
				'productName'  => 'Widget',
				'price'        => '10.00',
				'currencyCode' => 'USD',
			)
		);

		$this->assertArrayNotHasKey( 'description', $request['line_items'][0] );
		$this->assertArrayNotHasKey( 'return_url', $request );
	}

	// --- api_response_to_attributes ---

	/**
	 * A payment's stacked snippets, as the live API returns them.
	 *
	 * @param string $head The HTML framework's head snippet.
	 * @return array
	 */
	private function code_snippets( $head ) {
		return array(
			'stacked' => array(
				array(
					'framework'        => 'HTML',
					'head'             => $head,
					'button_placement' => 'BODY',
				),
				array(
					'framework'        => 'REACT',
					'head'             => '<PayPalScriptProvider options={{ clientId: "abc" }}>',
					'button_placement' => 'BODY',
				),
			),
		);
	}

	public function test_api_response_to_attributes_reads_the_stacked_script_src() {
		// `&equals;` decodes only under ENT_HTML5. `&amp;` proves nothing on its own:
		// the URL sanitizer unescapes that one itself.
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'               => 'PLB-STACKED',
				'integration_mode' => 'BUTTON',
				'code_snippets'    => $this->code_snippets(
					// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- A fixture of PayPal's snippet, not an enqueue.
					'<script src="https://www.paypal.com/sdk/js?client-id=abc&amp;components=hosted-buttons&amp;currency&equals;USD"></script>'
				),
			)
		);

		$this->assertSame( 'BUTTON', $attributes['integrationMode'] );
		$this->assertSame(
			'https://www.paypal.com/sdk/js?client-id=abc&components=hosted-buttons&currency=USD',
			$attributes['scriptSrc']
		);
	}

	public function test_api_response_to_attributes_leaves_the_script_src_empty_for_link_mode() {
		// Only a BUTTON-mode payment has snippets, which is why nothing may
		// downgrade the mode.
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'               => 'PLB-LINK',
				'integration_mode' => 'LINK',
			)
		);

		$this->assertSame( 'LINK', $attributes['integrationMode'] );
		$this->assertSame( '', $attributes['scriptSrc'] );
	}

	public function test_api_response_to_attributes_ignores_a_snippet_for_another_framework() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'            => 'PLB-REACT',
				'code_snippets' => array(
					'stacked' => array(
						array(
							'framework' => 'REACT',
							// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- A fixture of PayPal's snippet, not an enqueue.
							'head'      => '<script src="https://www.paypal.com/sdk/js?client-id=abc"></script>',
						),
					),
				),
			)
		);

		$this->assertSame( '', $attributes['scriptSrc'] );
	}

	public function test_api_response_to_attributes_rejects_a_script_src_off_paypal() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'            => 'PLB-EVIL',
				'code_snippets' => $this->code_snippets(
					// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- A fixture of PayPal's snippet, not an enqueue.
					'<script src="https://evil.example.com/sdk.js"></script>'
				),
			)
		);

		$this->assertSame( '', $attributes['scriptSrc'] );
	}

	public function test_api_response_to_attributes_takes_the_src_from_the_script_tag() {
		// The snippet is PayPal's, so the first src= in it can belong to anything.
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'            => 'PLB-IMG',
				'code_snippets' => $this->code_snippets(
					'<img src="https://www.paypalobjects.com/pixel.gif" />' .
					// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- A fixture of PayPal's snippet, not an enqueue.
					'<script src="https://www.paypal.com/sdk/js?client-id=abc"></script>'
				),
			)
		);

		$this->assertSame( 'https://www.paypal.com/sdk/js?client-id=abc', $attributes['scriptSrc'] );
	}

	public function test_api_response_to_attributes_drops_an_integration_mode_outside_the_enum() {
		// The REST argument allows LINK or BUTTON only, so storing a third value
		// would 400 every later save with no way out from the editor.
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'               => 'PLB-WEIRD',
				'integration_mode' => 'SOMETHING_NEW',
			)
		);

		$this->assertSame( '', $attributes['integrationMode'] );
	}

	/**
	 * Test that api_response_to_attributes extracts id and payment_link.
	 */
	public function test_api_response_to_attributes_extracts_id_and_link() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'           => 'PLB-TEST123',
				'payment_link' => 'https://www.paypal.com/ncp/payment/TEST123',
				'line_items'   => array(
					array(
						'name'        => 'Widget',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '10.00',
						),
					),
				),
			)
		);

		$this->assertTrue( $attributes['isApiManaged'] );
		$this->assertEquals( 'PLB-TEST123', $attributes['resourceId'] );
		$this->assertEquals( 'https://www.paypal.com/ncp/payment/TEST123', $attributes['paymentLink'] );
	}

	/**
	 * Test that api_response_to_attributes extracts line item fields.
	 */
	public function test_api_response_to_attributes_extracts_line_item_fields() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'           => 'PLB-TEST123',
				'payment_link' => 'https://www.paypal.com/ncp/payment/TEST123',
				'line_items'   => array(
					array(
						'name'        => 'Fancy Widget',
						'description' => 'A very fancy widget.',
						'unit_amount' => array(
							'currency_code' => 'GBP',
							'value'         => '49.99',
						),
					),
				),
				'return_url'   => 'https://example.com/thanks',
			)
		);

		$this->assertEquals( 'Fancy Widget', $attributes['productName'] );
		$this->assertEquals( 'GBP', $attributes['currencyCode'] );
		$this->assertSame( '49.99', $attributes['price'] );
		$this->assertEquals( 'A very fancy widget.', $attributes['productDescription'] );
		$this->assertEquals( 'https://example.com/thanks', $attributes['returnUrl'] );
	}

	/**
	 * Test that a multi-line description keeps its line breaks on the way back.
	 */
	public function test_api_response_to_attributes_keeps_description_newlines() {
		$description = "Line one\n\nLine two\r\nLine three";

		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'        => 'Fancy Widget',
						'description' => $description,
					),
				),
			)
		);

		$this->assertSame( $description, $attributes['productDescription'] );
	}

	/**
	 * Test that a description keeps its inner line breaks and loses the outer blank lines.
	 */
	public function test_api_response_to_attributes_trims_the_outer_newlines() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'        => 'Fancy Widget',
						'description' => "\n\nLine one\n\nLine two\n\n",
					),
				),
			)
		);

		$this->assertSame( "Line one\n\nLine two", $attributes['productDescription'] );
	}

	/**
	 * The product image comes back from the payment, so the GET route can show it.
	 */
	public function test_api_response_to_attributes_reads_the_image_url() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'      => 'Widget',
						'image_url' => 'https://example.com/widget.png',
					),
				),
			)
		);

		$this->assertSame( 'https://example.com/widget.png', $attributes['imageUrl'] );
	}

	/**
	 * The product id comes back from the payment, so an edit keeps the SKU.
	 */
	public function test_api_response_to_attributes_reads_the_product_id() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'       => 'Widget',
						'product_id' => 'SKU-12345',
					),
				),
			)
		);

		$this->assertSame( 'SKU-12345', $attributes['productId'] );
	}

	/**
	 * The handling fee comes back from the payment, so an edit keeps one set in
	 * PayPal's own dashboard.
	 */
	public function test_api_response_to_attributes_reads_the_handling_fee() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'     => 'Widget',
						'handling' => array(
							array(
								'type'  => 'FLAT',
								'value' => '4.00',
							),
						),
					),
				),
			)
		);

		$this->assertTrue( $attributes['handlingEnabled'] );
		$this->assertSame( '4.00', $attributes['handlingValue'] );
	}

	/**
	 * A handling fee of "0" is a real fee, and empty() would drop it.
	 */
	public function test_api_response_to_attributes_reads_a_handling_fee_of_zero() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'     => 'Widget',
						'handling' => array(
							array(
								'type'  => 'FLAT',
								'value' => '0',
							),
						),
					),
				),
			)
		);

		$this->assertTrue( $attributes['handlingEnabled'] );
		$this->assertSame( '0', $attributes['handlingValue'] );
	}

	/**
	 * The discount comes back from the payment, so an edit keeps it.
	 *
	 * @dataProvider discount_type_provider
	 *
	 * @param string $type  The discount type PayPal stored.
	 * @param string $value The discount value PayPal stored.
	 */
	#[DataProvider( 'discount_type_provider' )]
	public function test_api_response_to_attributes_reads_the_discount( $type, $value ) {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'      => 'Widget',
						'discounts' => array(
							array(
								'type'  => $type,
								'value' => $value,
							),
						),
					),
				),
			)
		);

		$this->assertTrue( $attributes['discountEnabled'] );
		$this->assertSame( $type, $attributes['discountType'] );
		$this->assertSame( $value, $attributes['discountValue'] );
	}

	/**
	 * Data provider for the discount types PayPal takes, including a zero value.
	 *
	 * @return array[] Test cases.
	 */
	public static function discount_type_provider(): array {
		return array(
			'amount off' => array( 'FLAT', '2.00' ),
			'percentage' => array( 'PERCENTAGE', '15' ),
			'zero'       => array( 'FLAT', '0' ),
		);
	}

	/**
	 * A discount with an amount and no type reads back as an amount off.
	 *
	 * PayPal treats a missing type as FLAT, so reading it as a percentage would turn
	 * $2.00 off into 2% off on the next save.
	 */
	public function test_api_response_to_attributes_defaults_a_missing_discount_type_to_flat() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'      => 'Widget',
						'discounts' => array( array( 'value' => '2.00' ) ),
					),
				),
			)
		);

		$this->assertTrue( $attributes['discountEnabled'] );
		$this->assertSame( 'FLAT', $attributes['discountType'] );
		$this->assertSame( '2.00', $attributes['discountValue'] );
	}

	/**
	 * A discount type the block has no option for is kept as it came.
	 *
	 * Rewriting it to FLAT would ship 2.00 as an amount off on the next update.
	 */
	public function test_api_response_to_attributes_keeps_an_unknown_discount_type() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'      => 'Widget',
						'discounts' => array(
							array(
								'type'  => 'TIERED',
								'value' => '2.00',
							),
						),
					),
				),
			)
		);

		$this->assertTrue( $attributes['discountEnabled'] );
		$this->assertSame( 'TIERED', $attributes['discountType'] );
		$this->assertSame( '2.00', $attributes['discountValue'] );
	}

	/**
	 * PayPal takes one discount per item, so the block reads the first and leaves the rest.
	 */
	public function test_api_response_to_attributes_reads_only_the_first_discount() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'      => 'Widget',
						'discounts' => array(
							array(
								'type'  => 'FLAT',
								'value' => '2.00',
							),
							array(
								'type'  => 'PERCENTAGE',
								'value' => '15',
							),
						),
					),
				),
			)
		);

		$this->assertSame( 'FLAT', $attributes['discountType'] );
		$this->assertSame( '2.00', $attributes['discountValue'] );
	}

	/**
	 * A discount the block cannot read leaves the discount attributes unset.
	 *
	 * @dataProvider empty_discount_provider
	 *
	 * @param mixed $discounts The discounts value PayPal sent.
	 */
	#[DataProvider( 'empty_discount_provider' )]
	public function test_api_response_to_attributes_ignores_an_unusable_discount( $discounts ) {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'      => 'Widget',
						'discounts' => $discounts,
					),
				),
			)
		);

		$this->assertArrayNotHasKey( 'discountEnabled', $attributes );
		$this->assertArrayNotHasKey( 'discountType', $attributes );
		$this->assertArrayNotHasKey( 'discountValue', $attributes );
	}

	/**
	 * Data provider for discount values the block skips.
	 *
	 * @return array[] Test cases.
	 */
	public static function empty_discount_provider(): array {
		return array(
			'empty array'               => array( array() ),
			'a string'                  => array( 'FLAT' ),
			'null'                      => array( null ),
			// Only these last two clear the outer is_array() check, and the inner one
			// catches them.
			'a list of strings'         => array( array( 'FLAT' ) ),
			'a discount outside a list' => array(
				array(
					'type'  => 'FLAT',
					'value' => '2.00',
				),
			),
		);
	}

	/**
	 * The block keeps its own discount default when the payment has none.
	 */
	public function test_api_response_to_attributes_omits_a_missing_discount() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array( 'name' => 'Widget' ),
				),
			)
		);

		$this->assertArrayNotHasKey( 'discountEnabled', $attributes );
		$this->assertArrayNotHasKey( 'discountType', $attributes );
		$this->assertArrayNotHasKey( 'discountValue', $attributes );
	}

	/**
	 * The block keeps its handling defaults when the payment has none.
	 */
	public function test_api_response_to_attributes_omits_a_missing_handling_fee() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array( array( 'name' => 'Widget' ) ),
			)
		);

		$this->assertArrayNotHasKey( 'handlingEnabled', $attributes );
		$this->assertArrayNotHasKey( 'handlingValue', $attributes );
	}

	/**
	 * A product id of "0" is a real one, and empty() would drop it.
	 */
	public function test_api_response_to_attributes_reads_a_product_id_of_zero() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array(
					array(
						'name'       => 'Widget',
						'product_id' => '0',
					),
				),
			)
		);

		$this->assertSame( '0', $attributes['productId'] );
	}

	/**
	 * An empty product id leaves the attribute unset, so the block keeps its default.
	 */
	public function test_api_response_to_attributes_omits_an_empty_product_id() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array( array( 'product_id' => '' ) ),
			)
		);

		$this->assertArrayNotHasKey( 'productId', $attributes );
	}

	/**
	 * A payment that omits the product id leaves the attribute unset.
	 */
	public function test_api_response_to_attributes_omits_a_missing_product_id() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TEST123',
				'line_items' => array( array( 'name' => 'Widget' ) ),
			)
		);

		$this->assertArrayNotHasKey( 'productId', $attributes );
	}

	/**
	 * Test that api_response_to_attributes reads the shipping mode back.
	 *
	 * PayPal stores a type and a value, not a mode, and each pair of modes differs by
	 * one field, so collapsing a pair rewrites the merchant's choice on the next save.
	 *
	 * @dataProvider shipping_mode_provider
	 *
	 * @param array  $shipping The stored shipping entry.
	 * @param string $mode     The mode it has to read back as.
	 * @param string $value    The fee it has to read back as, '' for none.
	 * @param string $extra    The per-extra-item fee, '' for none.
	 */
	#[DataProvider( 'shipping_mode_provider' )]
	public function test_api_response_to_attributes_reads_the_shipping_mode( $shipping, $mode, $value, $extra ) {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-SHIP',
				'line_items' => array(
					array(
						'name'     => 'Widget',
						'shipping' => array( $shipping ),
					),
				),
			)
		);

		$this->assertTrue( $attributes['shippingEnabled'] );
		$this->assertSame( $mode, $attributes['shippingMode'] );
		// shippingValue is always set, and the per-unit fee only comes back for a quantity fee.
		$this->assertSame( $value, $attributes['shippingValue'] );
		$this->assertSame( $extra, $attributes['shippingAdditionalValue'] ?? '' );
	}

	/**
	 * Data provider for the shipping entries PayPal stores, and the mode each one means.
	 *
	 * @return array[] Test cases.
	 */
	public static function shipping_mode_provider(): array {
		return array(
			'profile settings'                       => array(
				array(
					'type'  => 'PREFERENCE',
					'value' => 'PROFILE',
				),
				'PROFILE',
				'',
				'',
			),
			'free shipping'                          => array(
				array(
					'type'  => 'PREFERENCE',
					'value' => 'FREE_SHIPPING',
				),
				'FREE',
				'',
				'',
			),
			'an unknown preference reads as profile' => array(
				array(
					'type'  => 'PREFERENCE',
					'value' => 'SOMETHING_NEW',
				),
				'PROFILE',
				'',
				'',
			),
			'specific fee'                           => array(
				array(
					'type'  => 'FLAT',
					'value' => '5.00',
				),
				'FLAT',
				'5.00',
				'',
			),
			'quantity-based fee'                     => array(
				array(
					'type'                  => 'FLAT',
					'value'                 => '5.00',
					'additional_unit_value' => '2.00',
				),
				'QUANTITY',
				'5.00',
				'2.00',
			),
			// Identical to a specific fee on the wire, so it reads back as one.
			'quantity fee with an empty extra reads as specific' => array(
				array(
					'type'                  => 'FLAT',
					'value'                 => '5.00',
					'additional_unit_value' => '',
				),
				'FLAT',
				'5.00',
				'',
			),
			// A zero fee is one PayPal stores, and empty() would throw it away.
			'a zero fee survives'                    => array(
				array(
					'type'                  => 'FLAT',
					'value'                 => '0',
					'additional_unit_value' => '0',
				),
				'QUANTITY',
				'0',
				'0',
			),
		);
	}

	/**
	 * Test that a payment without shipping leaves the shipping attributes unset.
	 *
	 * The block attribute defaults to off, so an absent key keeps the control off.
	 */
	public function test_api_response_to_attributes_omits_missing_shipping() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-NOSHIP',
				'line_items' => array( array( 'name' => 'Widget' ) ),
			)
		);

		$this->assertArrayNotHasKey( 'shippingEnabled', $attributes );
		$this->assertArrayNotHasKey( 'shippingMode', $attributes );
	}

	/**
	 * Test that api_response_to_attributes reports address collection both ways.
	 *
	 * The block attribute defaults to on, so an absent key has to come back as off.
	 * Otherwise a payment that skips address collection reads as one that asks for it.
	 */
	public function test_api_response_to_attributes_maps_address_collection_both_ways() {
		$on  = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-ON',
				'line_items' => array( array( 'collect_shipping_address' => true ) ),
			)
		);
		$off = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-OFF',
				'line_items' => array( array( 'name' => 'Widget' ) ),
			)
		);

		$this->assertTrue( $on['collectShippingAddress'] );
		$this->assertFalse( $off['collectShippingAddress'] );
	}

	/**
	 * Test that api_response_to_attributes reads back a tax without a name.
	 *
	 * The block leaves the tax name empty, so the mapper fills in the default label.
	 */
	public function test_api_response_to_attributes_reads_a_tax_without_a_name() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-TAX',
				'line_items' => array(
					array(
						'name'  => 'Widget',
						'taxes' => array(
							array(
								'type'  => 'PERCENTAGE',
								'value' => '8.25',
							),
						),
					),
				),
			)
		);

		$this->assertTrue( $attributes['taxEnabled'] );
		$this->assertSame( 'PERCENTAGE', $attributes['taxType'] );
		$this->assertSame( '8.25', $attributes['taxValue'] );
		$this->assertSame( 'Sales Tax', $attributes['taxName'] );
	}

	/**
	 * Test that api_response_to_attributes extracts payment link from HATEOAS links fallback.
	 */
	public function test_api_response_to_attributes_extracts_from_hateoas_links() {
		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-HATEOAS123',
				'line_items' => array(
					array(
						'name'        => 'Widget',
						'unit_amount' => array(
							'currency_code' => 'USD',
							'value'         => '10.00',
						),
					),
				),
				'links'      => array(
					array(
						'rel'  => 'self',
						'href' => 'https://api.paypal.com/v1/checkout/payment-resources/PLB-HATEOAS123',
					),
					array(
						'rel'  => 'payment_link',
						'href' => 'https://www.paypal.com/ncp/payment/HATEOAS123',
					),
				),
			)
		);

		$this->assertEquals( 'https://www.paypal.com/ncp/payment/HATEOAS123', $attributes['paymentLink'] );
	}

	// --- merge_response_attributes ---

	/**
	 * Test that merge_response_attributes preserves buttonText and buttonType.
	 */
	public function test_merge_preserves_frontend_only_fields() {
		$existing = array(
			'productName' => 'Old Name',
			'buttonText'  => 'Pay Now',
			'buttonType'  => 'primary',
			'price'       => '10.00',
		);

		$from_api = array(
			'productName' => 'New Name',
			'price'       => '20.00',
			'resourceId'  => 'PLB-MERGE123',
			'buttonText'  => 'Default',
			'buttonType'  => 'secondary',
		);

		$merged = PayPal_Attribute_Mapper::merge_response_attributes( $existing, $from_api );

		$this->assertEquals( 'Pay Now', $merged['buttonText'] );
		$this->assertEquals( 'primary', $merged['buttonType'] );
		$this->assertEquals( 'New Name', $merged['productName'] );
		$this->assertSame( '20.00', $merged['price'] );
		$this->assertEquals( 'PLB-MERGE123', $merged['resourceId'] );
	}

	/**
	 * Test that merge_response_attributes overwrites non-preserved fields.
	 */
	public function test_merge_overwrites_other_fields() {
		$existing = array(
			'productName' => 'Old Name',
			'price'       => '10.00',
		);

		$from_api = array(
			'productName'  => 'Updated Name',
			'price'        => '15.00',
			'isApiManaged' => true,
		);

		$merged = PayPal_Attribute_Mapper::merge_response_attributes( $existing, $from_api );

		$this->assertEquals( 'Updated Name', $merged['productName'] );
		$this->assertSame( '15.00', $merged['price'] );
		$this->assertTrue( $merged['isApiManaged'] );
	}

	// --- is_valid_resource_id ---

	/**
	 * Test that valid PLB-XXX format is accepted.
	 */
	public function test_is_valid_resource_id_accepts_valid_format() {
		$this->assertTrue( PayPal_Attribute_Mapper::is_valid_resource_id( 'PLB-ABC123DEF456' ) );
		$this->assertTrue( PayPal_Attribute_Mapper::is_valid_resource_id( 'PLB-abcdef' ) );
		$this->assertTrue( PayPal_Attribute_Mapper::is_valid_resource_id( 'PLB-A' ) );
	}

	/**
	 * Test that invalid resource ID formats are rejected.
	 *
	 * @param string $id The invalid ID to test.
	 * @dataProvider invalid_resource_id_provider
	 */
	#[DataProvider( 'invalid_resource_id_provider' )]
	public function test_is_valid_resource_id_rejects_invalid_format( $id ) {
		$this->assertFalse( PayPal_Attribute_Mapper::is_valid_resource_id( $id ) );
	}

	/**
	 * Data provider for invalid resource IDs.
	 *
	 * @return array[] Test cases.
	 */
	public static function invalid_resource_id_provider(): array {
		return array(
			'empty string'  => array( '' ),
			'no prefix'     => array( 'ABC123DEF456' ),
			'wrong prefix'  => array( 'XYZ-ABC123' ),
			'spaces'        => array( 'PLB-ABC 123' ),
			'special chars' => array( 'PLB-ABC!@#' ),
			'prefix only'   => array( 'PLB-' ),
			'sql injection' => array( "PLB-'; DROP TABLE--" ),
		);
	}

	// --- is_api_managed ---

	/**
	 * Test is_api_managed returns true when isApiManaged is true.
	 */
	public function test_is_api_managed_returns_true() {
		$this->assertTrue(
			PayPal_Attribute_Mapper::is_api_managed( array( 'isApiManaged' => true ) )
		);
	}

	/**
	 * Test is_api_managed returns false when isApiManaged is false or missing.
	 */
	public function test_is_api_managed_returns_false() {
		$this->assertFalse(
			PayPal_Attribute_Mapper::is_api_managed( array( 'isApiManaged' => false ) )
		);
		$this->assertFalse(
			PayPal_Attribute_Mapper::is_api_managed( array() )
		);
		$this->assertFalse(
			PayPal_Attribute_Mapper::is_api_managed( array( 'isApiManaged' => 'true' ) )
		);
	}

	// --- Per-option (variant) pricing ---

	/**
	 * Build a variants structure with a primary dimension.
	 *
	 * @param array $prices One price string per option; '' means "no price".
	 * @return array Variants structure in block-attribute shape.
	 */
	private function variants_with_prices( array $prices ) {
		$options = array();
		foreach ( $prices as $i => $price ) {
			$option = array( 'label' => 'Option ' . ( $i + 1 ) );
			if ( null !== $price ) {
				$option['unit_amount'] = array(
					'currency_code' => 'USD',
					'value'         => $price,
				);
			}
			$options[] = $option;
		}

		return array(
			'dimensions' => array(
				array(
					'name'    => 'Size',
					'primary' => true,
					'options' => $options,
				),
			),
		);
	}

	/**
	 * Test that variants_have_pricing detects a priced option.
	 */
	public function test_variants_have_pricing_detects_priced_options() {
		$this->assertTrue(
			PayPal_Attribute_Mapper::variants_have_pricing( $this->variants_with_prices( array( '10.00', '20.00' ) ) )
		);
	}

	/**
	 * Test that variants_have_pricing ignores empty and missing amounts.
	 */
	public function test_variants_have_pricing_ignores_unpriced_options() {
		$this->assertFalse(
			PayPal_Attribute_Mapper::variants_have_pricing( $this->variants_with_prices( array( '', null ) ) )
		);
		$this->assertFalse( PayPal_Attribute_Mapper::variants_have_pricing( null ) );
		$this->assertFalse( PayPal_Attribute_Mapper::variants_have_pricing( array() ) );
	}

	/**
	 * Test that a price on a non-primary dimension does not count.
	 */
	public function test_variants_have_pricing_ignores_non_primary_dimensions() {
		$variants                             = $this->variants_with_prices( array( '10.00' ) );
		$variants['dimensions'][0]['primary'] = false;

		$this->assertFalse( PayPal_Attribute_Mapper::variants_have_pricing( $variants ) );
	}

	/**
	 * Test that the product-level unit_amount is dropped when the options are priced.
	 *
	 * PayPal rejects a line item carrying unit_amount at both levels.
	 */
	public function test_attributes_to_api_request_drops_product_price_for_priced_variants() {
		$request = PayPal_Attribute_Mapper::attributes_to_api_request(
			array(
				'productName'     => 'Widget',
				'price'           => '29.99',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $this->variants_with_prices( array( '10.00', '20.00' ) ),
			)
		);

		$this->assertArrayNotHasKey( 'unit_amount', $request['line_items'][0] );
		$this->assertSame(
			'10.00',
			$request['line_items'][0]['variants']['dimensions'][0]['options'][0]['unit_amount']['value']
		);
	}

	/**
	 * Test that the product-level unit_amount is kept when the options are unpriced.
	 */
	public function test_attributes_to_api_request_keeps_product_price_for_unpriced_variants() {
		$request = PayPal_Attribute_Mapper::attributes_to_api_request(
			array(
				'productName'     => 'Widget',
				'price'           => '29.99',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $this->variants_with_prices( array( '', '' ) ),
			)
		);

		$this->assertSame( '29.99', $request['line_items'][0]['unit_amount']['value'] );
		$this->assertArrayNotHasKey(
			'unit_amount',
			$request['line_items'][0]['variants']['dimensions'][0]['options'][0]
		);
	}

	/**
	 * Test that the currency comes from the priced options when there is no product price.
	 */
	public function test_api_response_to_attributes_takes_currency_from_priced_options() {
		$variants = $this->variants_with_prices( array( '10.00', '20.00' ) );

		$variants['dimensions'][0]['options'][0]['unit_amount']['currency_code'] = 'EUR';
		$variants['dimensions'][0]['options'][1]['unit_amount']['currency_code'] = 'EUR';

		$attributes = PayPal_Attribute_Mapper::api_response_to_attributes(
			array(
				'id'         => 'PLB-VAR',
				'line_items' => array(
					array(
						'name'     => 'Widget',
						'variants' => $variants,
					),
				),
			)
		);

		$this->assertSame( 'EUR', $attributes['currencyCode'] );
		$this->assertArrayNotHasKey( 'price', $attributes );
		$this->assertTrue( $attributes['variantsEnabled'] );
	}

	/**
	 * Test that the product price is optional once the options carry their own.
	 */
	public function test_validate_allows_missing_price_with_variant_pricing() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $this->variants_with_prices( array( '10.00', '20.00' ) ),
			)
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test that the product price is still required without variant pricing.
	 */
	public function test_validate_still_requires_price_without_variant_pricing() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $this->variants_with_prices( array( '', '' ) ),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_price', $result->get_error_code() );
	}

	/**
	 * Test that per-option pricing is all-or-nothing.
	 */
	public function test_validate_rejects_partially_priced_variants() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $this->variants_with_prices( array( '10.00', '' ) ),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_variant_price', $result->get_error_code() );
	}

	/**
	 * Test that an invalid per-option price is rejected.
	 */
	public function test_validate_rejects_invalid_variant_price() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $this->variants_with_prices( array( '10.00', '0' ) ),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_variant_price', $result->get_error_code() );
	}

	/**
	 * Test that an option group without a name is rejected.
	 *
	 * The sanitizer drops such a group, so accepting it would validate prices
	 * PayPal never receives.
	 */
	public function test_validate_rejects_unnamed_option_group() {
		$variants                          = $this->variants_with_prices( array( '10.00', '20.00' ) );
		$variants['dimensions'][0]['name'] = ' ';

		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $variants,
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_variant_name', $result->get_error_code() );
	}

	/**
	 * Test that an option without a label is rejected.
	 */
	public function test_validate_rejects_unlabeled_option() {
		$variants = $this->variants_with_prices( array( '10.00', '20.00' ) );
		$variants['dimensions'][0]['options'][1]['label'] = '';

		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $variants,
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'missing_variant_label', $result->get_error_code() );
	}

	/**
	 * Test that more option groups than the sanitizer keeps are rejected.
	 */
	public function test_validate_rejects_too_many_option_groups() {
		$variants = array( 'dimensions' => array() );
		for ( $i = 0; $i <= PayPal_Attribute_Mapper::MAX_VARIANT_DIMENSIONS; $i++ ) {
			$variants['dimensions'][] = array(
				'name'    => 'Group ' . $i,
				'primary' => 0 === $i,
				'options' => array( array( 'label' => 'Option' ) ),
			);
		}

		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'price'           => '29.99',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $variants,
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'too_many_variant_dimensions', $result->get_error_code() );
	}

	/**
	 * Test that more options than the sanitizer keeps are rejected.
	 */
	public function test_validate_rejects_too_many_options() {
		$variants = $this->variants_with_prices( array_fill( 0, PayPal_Attribute_Mapper::MAX_VARIANT_OPTIONS + 1, '10.00' ) );

		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $variants,
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'too_many_variant_options', $result->get_error_code() );
	}

	/**
	 * Test that a well-formed non-primary option group is accepted.
	 */
	public function test_validate_accepts_named_and_labeled_option_groups() {
		$variants                 = $this->variants_with_prices( array( '10.00', '20.00' ) );
		$variants['dimensions'][] = array(
			'name'    => 'Color',
			'primary' => false,
			'options' => array( array( 'label' => 'Red' ) ),
		);

		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'     => 'Widget',
				'currencyCode'    => 'USD',
				'variantsEnabled' => true,
				'variants'        => $variants,
			)
		);

		$this->assertTrue( $result );
	}

	// --- Constants ---

	/**
	 * Test that length constant values are set correctly.
	 */
	public function test_length_constants() {
		$this->assertEquals( 127, PayPal_Attribute_Mapper::MAX_NAME_LENGTH );
		$this->assertEquals( 2048, PayPal_Attribute_Mapper::MAX_DESCRIPTION_LENGTH );
		$this->assertEquals( 50, PayPal_Attribute_Mapper::MAX_BUTTON_TEXT_LENGTH );
	}
}
