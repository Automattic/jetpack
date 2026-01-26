<?php
/**
 * Tests for the WC_Analytics_Ch_Event class.
 *
 * @package automattic/woocommerce-analytics
 */

namespace Automattic\Woocommerce_Analytics;

use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Tests for the WC_Analytics_Ch_Event class.
 */
class WC_Analytics_Ch_Event_Test extends BaseTestCase {

	/**
	 * Test that PIXEL constant is correct.
	 */
	public function test_pixel_constant(): void {
		$this->assertSame( 'https://pixel.wp.com/w.gif', WC_Analytics_Ch_Event::PIXEL );
	}

	/**
	 * Test constructor with valid properties sets them as object properties.
	 */
	public function test_constructor_with_valid_properties(): void {
		$properties = array(
			'_en' => 'woocommerceanalytics_test_event',
			'_ts' => '1234567890123',
		);

		$event = new WC_Analytics_Ch_Event( $properties );

		$this->assertNull( $event->error );
		$this->assertSame( 'woocommerceanalytics_test_event', $event->_en );
		$this->assertSame( '1234567890123', $event->_ts );
		$this->assertSame( 'php-agent', $event->browser_type );
	}

	/**
	 * Test constructor adds timestamp if not provided.
	 */
	public function test_constructor_adds_timestamp_if_missing(): void {
		$properties = array(
			'_en' => 'woocommerceanalytics_test_event',
		);

		$event = new WC_Analytics_Ch_Event( $properties );

		$this->assertNull( $event->error );
		$this->assertObjectHasProperty( '_ts', $event );
		$this->assertMatchesRegularExpression( '/^\d+$/', $event->_ts );
	}

	/**
	 * Test constructor with missing event name sets error.
	 */
	public function test_constructor_with_missing_event_name(): void {
		$properties = array(
			'_ts' => '1234567890123',
		);

		$event = new WC_Analytics_Ch_Event( $properties );

		$this->assertInstanceOf( WP_Error::class, $event->error );
		$this->assertSame( 'invalid_event', $event->error->get_error_code() );
	}

	/**
	 * Test constructor with invalid event name sets error.
	 */
	public function test_constructor_with_invalid_event_name(): void {
		$properties = array(
			'_en' => 'InvalidEventName',
		);

		$event = new WC_Analytics_Ch_Event( $properties );

		$this->assertInstanceOf( WP_Error::class, $event->error );
		$this->assertSame( 'invalid_event_name', $event->error->get_error_code() );
	}

	/**
	 * Test constructor with invalid property name sets error.
	 */
	public function test_constructor_with_invalid_property_name(): void {
		$properties = array(
			'_en'         => 'woocommerceanalytics_test_event',
			'InvalidProp' => 'value',
		);

		$event = new WC_Analytics_Ch_Event( $properties );

		$this->assertInstanceOf( WP_Error::class, $event->error );
		$this->assertSame( 'invalid_prop_name', $event->error->get_error_code() );
	}

	/**
	 * Test build_pixel_url returns correct URL with valid properties.
	 */
	public function test_build_pixel_url_with_valid_properties(): void {
		$properties = array(
			'_en' => 'woocommerceanalytics_test_event',
			'_ts' => '1234567890123',
		);

		$event     = new WC_Analytics_Ch_Event( $properties );
		$pixel_url = $event->build_pixel_url();

		$this->assertStringStartsWith( 'https://pixel.wp.com/w.gif?', $pixel_url );
		$this->assertStringContainsString( '_en=woocommerceanalytics_test_event', $pixel_url );
		$this->assertStringContainsString( '_ts=1234567890123', $pixel_url );
		$this->assertStringContainsString( 'browser_type=php-agent', $pixel_url );
	}

	/**
	 * Test build_pixel_url returns empty string when constructor had error.
	 */
	public function test_build_pixel_url_returns_empty_on_constructor_error(): void {
		$properties = array(
			'_ts' => '1234567890123',
		);

		$event     = new WC_Analytics_Ch_Event( $properties );
		$pixel_url = $event->build_pixel_url();

		$this->assertSame( '', $pixel_url );
	}

	/**
	 * Test build_pixel_url returns empty string with invalid event name.
	 */
	public function test_build_pixel_url_returns_empty_with_invalid_event(): void {
		$properties = array(
			'_en' => 'InvalidEvent',
		);

		$event     = new WC_Analytics_Ch_Event( $properties );
		$pixel_url = $event->build_pixel_url();

		$this->assertSame( '', $pixel_url );
	}

	/**
	 * Test constructor with custom properties preserves them.
	 */
	public function test_constructor_preserves_custom_properties(): void {
		$properties = array(
			'_en'        => 'woocommerceanalytics_checkout_started',
			'_ts'        => '1234567890123',
			'product_id' => '12345',
			'quantity'   => '2',
		);

		$event = new WC_Analytics_Ch_Event( $properties );

		$this->assertNull( $event->error );
		$this->assertSame( '12345', $event->product_id );
		$this->assertSame( '2', $event->quantity );
	}

	/**
	 * Test constructor removes private IP addresses.
	 */
	public function test_constructor_removes_private_ip(): void {
		$properties = array(
			'_en'     => 'woocommerceanalytics_test_event',
			'_via_ip' => '192.168.1.1',
		);

		$event = new WC_Analytics_Ch_Event( $properties );

		$this->assertNull( $event->error );
		$this->assertObjectNotHasProperty( '_via_ip', $event );
	}

	/**
	 * Test constructor keeps public IP addresses.
	 */
	public function test_constructor_keeps_public_ip(): void {
		$properties = array(
			'_en'     => 'woocommerceanalytics_test_event',
			'_via_ip' => '203.0.113.195',
		);

		$event = new WC_Analytics_Ch_Event( $properties );

		$this->assertNull( $event->error );
		$this->assertSame( '203.0.113.195', $event->_via_ip );
	}

	/**
	 * Test build_pixel_url matches Pixel_Builder CH_PIXEL_URL.
	 */
	public function test_build_pixel_url_uses_ch_pixel_url(): void {
		$properties = array(
			'_en' => 'woocommerceanalytics_test_event',
		);

		$event     = new WC_Analytics_Ch_Event( $properties );
		$pixel_url = $event->build_pixel_url();

		$this->assertStringStartsWith( Pixel_Builder::CH_PIXEL_URL . '?', $pixel_url );
	}

	/**
	 * Test PIXEL constant matches Pixel_Builder CH_PIXEL_URL.
	 */
	public function test_pixel_constant_matches_pixel_builder(): void {
		$this->assertSame( Pixel_Builder::CH_PIXEL_URL, WC_Analytics_Ch_Event::PIXEL );
	}

	/**
	 * Test constructor with empty properties sets error.
	 */
	public function test_constructor_with_empty_properties(): void {
		$event = new WC_Analytics_Ch_Event( array() );

		$this->assertInstanceOf( WP_Error::class, $event->error );
		$this->assertSame( 'invalid_event', $event->error->get_error_code() );
	}

	/**
	 * Test constructor handles array property values.
	 */
	public function test_constructor_handles_array_property_values(): void {
		$properties = array(
			'_en'   => 'woocommerceanalytics_test_event',
			'items' => array( 'item1', 'item2', 'item3' ),
		);

		$event = new WC_Analytics_Ch_Event( $properties );

		$this->assertNull( $event->error );
		$this->assertSame( 'item1,item2,item3', $event->items );
	}

	/**
	 * Test build_pixel_url encodes array values correctly.
	 */
	public function test_build_pixel_url_encodes_array_values(): void {
		$properties = array(
			'_en'   => 'woocommerceanalytics_test_event',
			'items' => array( 'item1', 'item2' ),
		);

		$event     = new WC_Analytics_Ch_Event( $properties );
		$pixel_url = $event->build_pixel_url();

		$this->assertStringContainsString( 'items=item1%2Citem2', $pixel_url );
	}
}
