<?php
/**
 * Newsletter Category Helper unit tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-newsletter-category-helper.php';

/**
 * Class for testing the Jetpack_Newsletter_Category_Helper class.
 *
 * @covers \Jetpack_Newsletter_Category_Helper
 */
#[CoversClass( Jetpack_Newsletter_Category_Helper::class )]
class Jetpack_Newsletter_Category_Helper_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		delete_option( 'wpcom_newsletter_categories' );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		delete_option( 'wpcom_newsletter_categories' );
		parent::tear_down();
	}

	/**
	 * Test get_category_ids() returns empty array when option doesn't exist.
	 */
	public function test_get_category_ids_no_option() {
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( array(), $result );
	}

	/**
	 * Test get_category_ids() returns empty array when option is empty.
	 */
	public function test_get_category_ids_empty_option() {
		update_option( 'wpcom_newsletter_categories', array() );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( array(), $result );
	}

	/**
	 * Test get_category_ids() returns empty array when option is not an array.
	 */
	public function test_get_category_ids_invalid_option() {
		update_option( 'wpcom_newsletter_categories', 'not-an-array' );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( array(), $result );
	}

	/**
	 * Test get_category_ids() handles array of integers format.
	 */
	public function test_get_category_ids_integer_array() {
		$categories = array( 123, 456, 789 );
		update_option( 'wpcom_newsletter_categories', $categories );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( $categories, $result );
	}

	/**
	 * Test get_category_ids() handles array of arrays with term_id format.
	 */
	public function test_get_category_ids_term_id_array() {
		$categories = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
			array( 'term_id' => 789 ),
		);
		update_option( 'wpcom_newsletter_categories', $categories );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( array( 123, 456, 789 ), $result );
	}

	/**
	 * Test get_category_ids() filters out non-numeric term_ids.
	 */
	public function test_get_category_ids_filters_invalid_term_ids() {
		$categories = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 'not-a-number' ),
			array( 'term_id' => 456 ),
		);
		update_option( 'wpcom_newsletter_categories', $categories );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( array( 123, 456 ), $result );
	}

	/**
	 * Test get_category_ids() handles serialized data.
	 */
	public function test_get_category_ids_serialized_data() {
		$categories = array( 123, 456 );
		update_option( 'wpcom_newsletter_categories', serialize( $categories ) );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( $categories, $result );
	}

	/**
	 * Test save_category_ids() returns false for non-array input.
	 */
	public function test_save_category_ids_non_array() {
		$result = Jetpack_Newsletter_Category_Helper::save_category_ids( 'not-an-array' );
		$this->assertFalse( $result );
	}

	/**
	 * Test save_category_ids() returns false for empty array.
	 */
	public function test_save_category_ids_empty_array() {
		$result = Jetpack_Newsletter_Category_Helper::save_category_ids( array() );
		$this->assertFalse( $result );
	}

	/**
	 * Test save_category_ids() formats array of integers correctly.
	 */
	public function test_save_category_ids_integer_array() {
		$input    = array( 123, 456, 789 );
		$expected = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
			array( 'term_id' => 789 ),
		);
		$result   = Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$this->assertEquals( $expected, $result );

		$saved_option = get_option( 'wpcom_newsletter_categories' );
		$this->assertEquals( $expected, $saved_option );
	}

	/**
	 * Test save_category_ids() handles string numeric values.
	 */
	public function test_save_category_ids_string_numeric() {
		$input    = array( '123', '456', '789' );
		$expected = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
			array( 'term_id' => 789 ),
		);
		$result   = Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test save_category_ids() filters out non-numeric values.
	 */
	public function test_save_category_ids_filters_non_numeric() {
		$input    = array( 123, 'not-a-number', 456 );
		$expected = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
		);
		$result   = Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test save_category_ids() handles array of arrays with term_id.
	 */
	public function test_save_category_ids_term_id_array() {
		$input    = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
			array( 'term_id' => 789 ),
		);
		$expected = array(
			array( 'term_id' => 123 ),
			array( 'term_id' => 456 ),
			array( 'term_id' => 789 ),
		);
		$result   = Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test save_category_ids() returns false when no valid categories.
	 */
	public function test_save_category_ids_no_valid_categories() {
		$input  = array( 'not-a-number', 'also-not-a-number' );
		$result = Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$this->assertFalse( $result );
	}

	/**
	 * Test integration between save and get methods.
	 */
	public function test_save_and_get_integration() {
		$input = array( 123, 456, 789 );
		Jetpack_Newsletter_Category_Helper::save_category_ids( $input );
		$result = Jetpack_Newsletter_Category_Helper::get_category_ids();
		$this->assertEquals( $input, $result );
	}

	/**
	 * Test that Jetpack_Core_API_Data, WPCOM_JSON_API_Site_Settings_Endpoint,
	 * and the helper class all return the same newsletter categories.
	 */
	public function test_api_endpoints_return_same_newsletter_categories() {
		global $blog_id;

		// Set up test data.
		$test_categories = array( 101, 202, 303 );
		Jetpack_Newsletter_Category_Helper::save_category_ids( $test_categories );

		// Get categories using the helper directly.
		$helper_result = Jetpack_Newsletter_Category_Helper::get_category_ids();

		// Get categories using Jetpack_Core_API_Data.
		if ( ! class_exists( 'Jetpack_Core_API_Data' ) ) {
			require_once JETPACK__PLUGIN_DIR . '/_inc/lib/core-api/class.jetpack-core-api-module-endpoints.php';
		}
		$core_api_data       = new Jetpack_Core_API_Data();
		$core_api_response   = $core_api_data->get_all_options();
		$core_api_categories = isset( $core_api_response->data['wpcom_newsletter_categories'] )
			? $core_api_response->data['wpcom_newsletter_categories']
			: array();

		// Get categories using WPCOM_JSON_API_Site_Settings_V1_4_Endpoint via a mocked request.
		// Set up JSON API requirements.
		require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1.4' );
		}

		// Set up to test site settings API response.
		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );
		$admin                                = self::factory()->user->create_and_get(
			array(
				'role' => 'administrator',
			)
		);

		wp_set_current_user( $admin->ID );

		if ( ! class_exists( 'WPCOM_JSON_API_Site_Settings_V1_4_Endpoint' ) ) {
			require_once JETPACK__PLUGIN_DIR . '/json-endpoints/class.wpcom-json-api-site-settings-v1-4-endpoint.php';
		}
		if ( ! class_exists( 'WPCOM_JSON_API_Site_Settings_Endpoint' ) ) {
			require_once JETPACK__PLUGIN_DIR . '/json-endpoints/class.wpcom-json-api-site-settings-endpoint.php';
		}

		// Initialize the endpoint with proper configuration.
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
			)
		);

		// Make the request using the endpoint's callback method.
		$json_api_response   = $endpoint->callback( '/sites/%s/settings', $blog_id );
		$json_api_categories = isset( $json_api_response['settings']['wpcom_newsletter_categories'] )
			? $json_api_response['settings']['wpcom_newsletter_categories']
			: array();

		// All three should return the same data.
		$this->assertEquals( $test_categories, $helper_result, 'Helper should return correct categories' );
		$this->assertEquals( $test_categories, $core_api_categories, 'Core API should return same categories as helper' );
		$this->assertEquals( $test_categories, $json_api_categories, 'JSON API V1.4 should return same categories as helper' );
	}
}
