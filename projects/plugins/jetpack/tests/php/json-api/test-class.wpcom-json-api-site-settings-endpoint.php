<?php
/**
 * Jetpack `sites/%s/settings` endpoint unit tests.
 *
 * @package automattic/jetpack
 */

/**
 * Jetpack `sites/%s/settings` endpoint unit tests.
 */
class WP_Test_WPCOM_JSON_API_Site_Settings_Endpoint extends WP_UnitTestCase {
	/**
	 * Tests the get_woocommerce_address() method. If the setting requests is not set, it should return ''.
	 *
	 * @dataProvider woocommerce_setting_key_names
	 *
	 * @param string $setting_name The setting lookup key.
	 */
	public function test_get_woocommerce_address_no_settings_or_domain_set( $setting_name ) {
		$mock_class = new Expose_WPCOM_JSON_API_Site_Settings_Endpoint( array( 'stat' => null ) );

		$result = $mock_class->exposed_get_woocommerce_address( $setting_name );

		$this->assertSame( '', $result );
	}

	/**
	 * Tests the get_woocommerce_address() method. It should return the value of the requested key.
	 *
	 * @dataProvider woocommerce_setting_value_pairs
	 *
	 * @param string $setting_name The setting lookup key.
	 * @param string $setting_value The setting value that is stored.
	 */
	public function test_get_woocommerce_address_settings_set( $setting_name, $setting_value ) {
		update_option( $setting_name, $setting_value );

		$mock_class = new Expose_WPCOM_JSON_API_Site_Settings_Endpoint( array( 'stat' => null ) );

		$result = $mock_class->exposed_get_woocommerce_address( $setting_name );

		$this->assertEquals( $setting_value, $result );
	}

	/**
	 * Data provider that contains just the WooCommerce setting key names.
	 *
	 * @return array[]
	 */
	public function woocommerce_setting_key_names() {
		return array(
			'woocommerce_store_address'   => array( 'woocommerce_store_address' ),
			'woocommerce_store_address_2' => array( 'woocommerce_store_address_2' ),
			'woocommerce_store_city'      => array( 'woocommerce_store_city' ),
			'woocommerce_default_country' => array( 'woocommerce_default_country' ),
			'woocommerce_store_postcode'  => array( 'woocommerce_store_postcode' ),
		);
	}

	/**
	 * Data provider to test setting value pairs.
	 *
	 * @return array[$setting_name, $setting_value]
	 */
	public function woocommerce_setting_value_pairs() {
		return array(
			'woocommerce_store_address'   => array( 'woocommerce_store_address', 'Street 34th 1/2' ),
			'woocommerce_store_address_2' => array( 'woocommerce_store_address_2', 'Apt #1' ),
			'woocommerce_store_city'      => array( 'woocommerce_store_city', 'City' ),
			'woocommerce_default_country' => array( 'woocommerce_default_country', 'US:NY' ),
			'woocommerce_store_postcode'  => array( 'woocommerce_store_postcode', '98738' ),
		);
	}
}

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
/**
 * This class makes protected methods public for testing.
 */
class Expose_WPCOM_JSON_API_Site_Settings_Endpoint extends WPCOM_JSON_API_Site_Settings_Endpoint {
	/**
	 * Expose the protected get_woocommerce_address() method.
	 *
	 * @param string $key The setting lookup key.
	 */
	public function exposed_get_woocommerce_address( $key ) {
		return $this->get_woocommerce_address( $key );
	}
}
