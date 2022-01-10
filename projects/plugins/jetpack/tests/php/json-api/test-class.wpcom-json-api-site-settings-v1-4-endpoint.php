<?php
/**
 * Jetpack `sites/%s/settings` endpoint unit tests.
 *
 * @package automattic/jetpack
 */

require_jetpack_file( 'class.json-api-endpoints.php' );

/**
 * Jetpack `sites/%s/settings` endpoint unit tests.
 */
class WP_Test_WPCOM_JSON_API_Site_Settings_V1_4_Endpoint extends WP_UnitTestCase {
	/**
	 * Prepare the environment for the test.
	 */
	public function set_up() {
		global $blog_id;

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1.4' );
		}

		parent::set_up();

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );
	}

	/**
	 * Test GET `sites/%s/settings` returns correct keys and key default values when no value is set.
	 *
	 * @dataProvider setting_default_key_values
	 *
	 * @param string $setting_name The setting lookup key.
	 * @param string $expected_default_value The default value we expect when no value is explicitly set.
	 */
	public function test_get_settings_contains_key_defaults( $setting_name, $expected_default_value ) {
		$response = $this->make_get_request();
		$settings = (array) $response['settings'];
		$this->assertSame( $expected_default_value, $settings[ $setting_name ] );
	}

	/**
	 * Test GET `sites/%s/settings` returns correct set value.
	 *
	 * @dataProvider setting_value_pairs_response
	 *
	 * @param string $setting_name The setting lookup key.
	 * @param string $setting_value The setting value to test.
	 */
	public function test_get_settings_contains_keys_values( $setting_name, $setting_value ) {
		update_option( $setting_name, $setting_value );

		$response = $this->make_get_request();
		$settings = (array) $response['settings'];
		$this->assertSame( $setting_value, $settings[ $setting_name ] );
	}

	/**
	 * Returns the response of a successful GET request to `sites/%s/settings`.
	 */
	public function make_get_request() {
		global $blog_id;

		$admin = $this->factory->user->create_and_get(
			array(
				'role' => 'administrator',
			)
		);

		wp_set_current_user( $admin->ID );

		$endpoint = new WPCOM_JSON_API_Site_Settings_V1_4_Endpoint(
			array(
				'description'      => 'Get detailed settings information about a site.',
				'group'            => '__do_not_document',
				'stat'             => 'sites:X',
				'min_version'      => '1.4',
				'method'           => 'GET',
				'path'             => '/sites/%s/settings',
				'path_labels'      => array(
					'$site' => '(int|string) Site ID or domain',
				),

				'query_parameters' => array(
					'context' => false,
				),

				'response_format'  => WPCOM_JSON_API_Site_Settings_Endpoint::$site_format,

				'example_request'  => 'https://public-api.wordpress.com/rest/v1.4/sites/en.blog.wordpress.com/settings?pretty=1',
			)
		);

		return $endpoint->callback( '/sites/%s/settings', $blog_id );
	}

	/**
	 * Data provider that contains keys we expect to see returned by the settings endpoint and their default value.
	 *
	 * @return array[ $setting_name, $expected_default_value ]
	 */
	public function setting_default_key_values() {
		return array(
			'woocommerce_store_address'   => array( 'woocommerce_store_address', '' ),
			'woocommerce_store_address_2' => array( 'woocommerce_store_address_2', '' ),
			'woocommerce_store_city'      => array( 'woocommerce_store_city', '' ),
			'woocommerce_default_country' => array( 'woocommerce_default_country', '' ),
			'woocommerce_store_postcode'  => array( 'woocommerce_store_postcode', '' ),
		);
	}

	/**
	 * Data provider to test setting value pairs.
	 *
	 * @return array[ $setting_name, $setting_value ]
	 */
	public function setting_value_pairs_response() {
		return array(
			'woocommerce_store_address'   => array( 'woocommerce_store_address', 'Street 34th 1/2' ),
			'woocommerce_store_address_2' => array( 'woocommerce_store_address_2', 'Apt #1' ),
			'woocommerce_store_city'      => array( 'woocommerce_store_city', 'City' ),
			'woocommerce_default_country' => array( 'woocommerce_default_country', 'US:NY' ),
			'woocommerce_store_postcode'  => array( 'woocommerce_store_postcode', '98738' ),
		);
	}
}
