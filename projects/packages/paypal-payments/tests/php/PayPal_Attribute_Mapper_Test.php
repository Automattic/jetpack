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
	 * Test that all 26 supported currencies are accepted.
	 */
	public function test_validate_accepts_all_supported_currencies() {
		foreach ( PayPal_Attribute_Mapper::SUPPORTED_CURRENCIES as $currency ) {
			$result = PayPal_Attribute_Mapper::validate_attributes(
				array(
					'productName'  => 'Widget',
					'price'        => '10.00',
					'currencyCode' => $currency,
				)
			);

			$this->assertTrue( $result, "Currency $currency should be accepted" );
		}

		$this->assertCount( 26, PayPal_Attribute_Mapper::SUPPORTED_CURRENCIES );
	}

	// --- validate_attributes: optional field length limits ---

	/**
	 * Test that description exceeding 256 characters is rejected.
	 */
	public function test_validate_rejects_description_too_long() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'        => 'Widget',
				'price'              => '10.00',
				'currencyCode'       => 'USD',
				'productDescription' => str_repeat( 'D', 257 ),
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'description_too_long', $result->get_error_code() );
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
	 * Test that an invalid image URL is rejected.
	 */
	public function test_validate_rejects_invalid_image_url() {
		$result = PayPal_Attribute_Mapper::validate_attributes(
			array(
				'productName'  => 'Widget',
				'price'        => '10.00',
				'currencyCode' => 'USD',
				'imageUrl'     => 'not-a-url',
			)
		);

		$this->assertInstanceOf( \WP_Error::class, $result );
		$this->assertEquals( 'invalid_image_url', $result->get_error_code() );
	}

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
				'imageUrl'           => 'https://example.com/widget.png',
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
				'imageUrl'           => 'https://example.com/widget.jpg',
				'returnUrl'          => 'https://example.com/thanks',
			)
		);

		$this->assertEquals( 'A great widget.', $request['line_items'][0]['description'] );
		$this->assertEquals( 'https://example.com/widget.jpg', $request['line_items'][0]['image_url'] );
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
		$this->assertArrayNotHasKey( 'image_url', $request['line_items'][0] );
		$this->assertArrayNotHasKey( 'return_url', $request );
	}

	// --- api_response_to_attributes ---

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
						'image_url'   => 'https://example.com/fancy.png',
					),
				),
				'return_url'   => 'https://example.com/thanks',
			)
		);

		$this->assertEquals( 'Fancy Widget', $attributes['productName'] );
		$this->assertEquals( 'GBP', $attributes['currencyCode'] );
		$this->assertSame( '49.99', $attributes['price'] );
		$this->assertEquals( 'A very fancy widget.', $attributes['productDescription'] );
		$this->assertEquals( 'https://example.com/fancy.png', $attributes['imageUrl'] );
		$this->assertEquals( 'https://example.com/thanks', $attributes['returnUrl'] );
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

	// --- Constants ---

	/**
	 * Test that length constant values are set correctly.
	 */
	public function test_length_constants() {
		$this->assertEquals( 127, PayPal_Attribute_Mapper::MAX_NAME_LENGTH );
		$this->assertEquals( 256, PayPal_Attribute_Mapper::MAX_DESCRIPTION_LENGTH );
		$this->assertEquals( 50, PayPal_Attribute_Mapper::MAX_BUTTON_TEXT_LENGTH );
	}
}
