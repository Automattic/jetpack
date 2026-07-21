<?php
/**
 * Tests for the Jetpack SEO Local_Business_Schema_Node decorator.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Local_Business_Schema_Node
 */
#[CoversClass( Local_Business_Schema_Node::class )]
class LocalBusinessSchemaNodeTest extends TestCase {

	/**
	 * Base Organization node fixture.
	 *
	 * @return array
	 */
	private function organization() {
		return array(
			'@type' => 'Organization',
			'@id'   => 'https://example.test/#organization',
			'name'  => 'Acme Co',
			'url'   => 'https://example.test/',
		);
	}

	/**
	 * Base LocalBusiness settings fixture.
	 *
	 * @return array
	 */
	private function settings() {
		return array(
			'enabled'      => true,
			'address'      => array(
				'streetAddress'   => '',
				'addressLocality' => '',
				'addressRegion'   => '',
				'postalCode'      => '',
				'addressCountry'  => '',
			),
			'telephone'    => '',
			'geo'          => array(
				'latitude'  => '',
				'longitude' => '',
			),
			'openingHours' => array(
				'Mo' => array(
					'opens'  => '',
					'closes' => '',
				),
				'Tu' => array(
					'opens'  => '',
					'closes' => '',
				),
				'We' => array(
					'opens'  => '',
					'closes' => '',
				),
				'Th' => array(
					'opens'  => '',
					'closes' => '',
				),
				'Fr' => array(
					'opens'  => '',
					'closes' => '',
				),
				'Sa' => array(
					'opens'  => '',
					'closes' => '',
				),
				'Su' => array(
					'opens'  => '',
					'closes' => '',
				),
			),
			'priceRange'   => '',
		);
	}

	/**
	 * Null Organization nodes pass through unchanged.
	 */
	public function test_null_organization_passes_through() {
		$this->assertNull( Local_Business_Schema_Node::extend( null, $this->settings() ) );
	}

	/**
	 * Disabled settings leave the Organization node unchanged.
	 */
	public function test_disabled_settings_pass_through() {
		$organization                         = $this->organization();
		$settings                             = $this->settings();
		$settings['enabled']                  = false;
		$settings['address']['streetAddress'] = '123 Main St';

		$this->assertSame( $organization, Local_Business_Schema_Node::extend( $organization, $settings ) );
	}

	/**
	 * Enabled but address-less settings leave the Organization node unchanged.
	 */
	public function test_enabled_with_empty_address_passes_through() {
		$organization = $this->organization();

		$extended = Local_Business_Schema_Node::extend( $organization, $this->settings() );

		$this->assertSame( $organization, $extended );
		$this->assertSame( 'Organization', $extended['@type'] );
	}

	/**
	 * A configured address decorates the existing Organization node as LocalBusiness.
	 */
	public function test_address_decorates_organization_node() {
		$settings                             = $this->settings();
		$settings['address']['streetAddress'] = '123 Main St';
		$settings['address']['postalCode']    = '10001';

		$extended = Local_Business_Schema_Node::extend( $this->organization(), $settings );

		$this->assertSame( array( 'Organization', 'LocalBusiness' ), $extended['@type'] );
		$this->assertSame(
			array(
				'@type'         => 'PostalAddress',
				'streetAddress' => '123 Main St',
				'postalCode'    => '10001',
			),
			$extended['address']
		);
		$this->assertSame( 'https://example.test/#organization', $extended['@id'] );
	}

	/**
	 * Optional string props are attached only when non-empty.
	 */
	public function test_telephone_and_price_range_attach_only_when_non_empty() {
		$settings                             = $this->settings();
		$settings['address']['streetAddress'] = '123 Main St';
		$settings['telephone']                = '+1 555 123 4567';
		$settings['priceRange']               = '$$';

		$extended = Local_Business_Schema_Node::extend( $this->organization(), $settings );

		$this->assertSame( '+1 555 123 4567', $extended['telephone'] );
		$this->assertSame( '$$', $extended['priceRange'] );

		$settings['telephone']  = '';
		$settings['priceRange'] = '';
		$extended               = Local_Business_Schema_Node::extend( $this->organization(), $settings );

		$this->assertArrayNotHasKey( 'telephone', $extended );
		$this->assertArrayNotHasKey( 'priceRange', $extended );
	}

	/**
	 * Geo coordinates require both numeric endpoints and emit as floats.
	 */
	public function test_geo_requires_both_coordinates() {
		$settings                             = $this->settings();
		$settings['address']['streetAddress'] = '123 Main St';
		$settings['geo']                      = array(
			'latitude'  => '40.7128',
			'longitude' => '-74.0060',
		);

		$extended = Local_Business_Schema_Node::extend( $this->organization(), $settings );

		$this->assertSame( 'GeoCoordinates', $extended['geo']['@type'] );
		$this->assertSame( 40.7128, $extended['geo']['latitude'] );
		$this->assertSame( -74.006, $extended['geo']['longitude'] );

		$settings['geo']['longitude'] = '';
		$extended                     = Local_Business_Schema_Node::extend( $this->organization(), $settings );
		$this->assertArrayNotHasKey( 'geo', $extended );
	}

	/**
	 * Opening hours emit only fully configured days, in canonical Mo-Su order.
	 */
	public function test_opening_hours_emit_full_days_in_order() {
		$settings                             = $this->settings();
		$settings['address']['streetAddress'] = '123 Main St';
		$settings['openingHours']['We']       = array(
			'opens'  => '10:00',
			'closes' => '16:00',
		);
		$settings['openingHours']['Mo']       = array(
			'opens'  => '09:00',
			'closes' => '17:00',
		);
		$settings['openingHours']['Tu']       = array(
			'opens'  => '09:00',
			'closes' => '',
		);
		$settings['openingHours']['Fr']       = array(
			'opens'  => '20:45',
			'closes' => '06:15',
		);

		$extended = Local_Business_Schema_Node::extend( $this->organization(), $settings );

		$this->assertSame(
			array(
				array(
					'@type'     => 'OpeningHoursSpecification',
					'dayOfWeek' => 'Monday',
					'opens'     => '09:00',
					'closes'    => '17:00',
				),
				array(
					'@type'     => 'OpeningHoursSpecification',
					'dayOfWeek' => 'Wednesday',
					'opens'     => '10:00',
					'closes'    => '16:00',
				),
				array(
					'@type'     => 'OpeningHoursSpecification',
					'dayOfWeek' => 'Friday',
					'opens'     => '20:45',
					'closes'    => '06:15',
				),
			),
			$extended['openingHoursSpecification']
		);
	}
}
