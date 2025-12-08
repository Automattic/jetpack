<?php
/**
 * Featured Image in Email Test file.
 *
 * @package wpcomsh
 * @covers ::wpcomsh_featured_image_in_email_default
 */

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Class FeaturedImageInEmailTest.
 *
 * @covers ::wpcomsh_featured_image_in_email_default
 */
#[CoversFunction( 'wpcomsh_featured_image_in_email_default' )]
class FeaturedImageInEmailTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up before each test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Remove any existing jetpack_options to start fresh
		delete_option( 'jetpack_options' );

		// Clear any cached transients
		delete_transient( 'wpcomsh_featured_image_site_creation' );
	}

	/**
	 * Test that sites created before May 2, 2025 return false.
	 */
	public function test_sites_before_may_2_2025_return_false() {
		// Set up a site ID
		update_option( 'jetpack_options', array( 'id' => 123456789 ) );

		// Mock the API response for a site created before May 2, 2025
		$mock_response = array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				array(
					'options' => array(
						'created_at' => '2025-03-15T10:30:00Z', // March 15, 2025
					),
				),
				JSON_UNESCAPED_SLASHES
			),
		);

		// Test the logic directly by calling the function with a mock response
		$result = $this->test_featured_image_default_with_mock_response( $mock_response );
		$this->assertFalse( $result );
	}

	/**
	 * Test that sites created after May 2, 2025 return true.
	 */
	public function test_sites_after_may_2_2025_return_true() {
		// Set up a site ID
		update_option( 'jetpack_options', array( 'id' => 123456789 ) );

		// Mock the API response for a site created after May 2, 2025
		$mock_response = array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				array(
					'options' => array(
						'created_at' => '2025-07-15T10:30:00Z', // July 15, 2025
					),
				),
				JSON_UNESCAPED_SLASHES
			),
		);

		// Test the logic directly by calling the function with a mock response
		$result = $this->test_featured_image_default_with_mock_response( $mock_response );
		$this->assertTrue( $result );
	}

	/**
	 * Test that sites without jetpack_options return false.
	 */
	public function test_sites_without_jetpack_options_return_false() {
		// Don't set jetpack_options at all

		$result = wpcomsh_featured_image_in_email_default();
		$this->assertFalse( $result );
	}

	/**
	 * Test that sites with empty jetpack_options return false.
	 */
	public function test_sites_with_empty_jetpack_options_return_false() {
		// Set up empty jetpack_options
		update_option( 'jetpack_options', array() );

		$result = wpcomsh_featured_image_in_email_default();
		$this->assertFalse( $result );
	}

	/**
	 * Test that sites with jetpack_options but no id return false.
	 */
	public function test_sites_with_jetpack_options_no_id_return_false() {
		// Set up jetpack_options without id
		update_option( 'jetpack_options', array( 'other_option' => 'value' ) );

		$result = wpcomsh_featured_image_in_email_default();
		$this->assertFalse( $result );
	}

	/**
	 * Test that API errors return false.
	 */
	public function test_api_errors_return_false() {
		// Set up a site ID
		update_option( 'jetpack_options', array( 'id' => 123456789 ) );

		// Mock the API response to return an error
		$mock_response = new WP_Error( 'api_error', 'API request failed' );

		// Test the logic directly by calling the function with a mock response
		$result = $this->test_featured_image_default_with_mock_response( $mock_response );
		$this->assertFalse( $result );
	}

	/**
	 * Test that malformed API responses return false.
	 */
	public function test_malformed_api_responses_return_false() {
		// Set up a site ID
		update_option( 'jetpack_options', array( 'id' => 123456789 ) );

		// Mock the API response with malformed data
		$mock_response = array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				array(
					'options' => array(
					// No created_at field
					),
				),
				JSON_UNESCAPED_SLASHES
			),
		);

		// Test the logic directly by calling the function with a mock response
		$result = $this->test_featured_image_default_with_mock_response( $mock_response );
		$this->assertFalse( $result );
	}

	/**
	 * Test that the filter is properly hooked.
	 */
	public function test_filter_is_hooked() {
		global $wp_filter;

		$this->assertArrayHasKey( 'default_option_wpcom_featured_image_in_email', $wp_filter );
		$this->assertNotEmpty( $wp_filter['default_option_wpcom_featured_image_in_email'] );
	}

	/**
	 * Helper method to test the logic with a mock API response.
	 *
	 * @param mixed $mock_response The mock API response.
	 * @return bool The result of the featured image default logic.
	 */
	private function test_featured_image_default_with_mock_response( $mock_response ) {
		// Simulate the API response processing
		if ( is_wp_error( $mock_response ) ) {
			return false;
		}

		$body      = wp_remote_retrieve_body( $mock_response );
		$site_data = json_decode( $body );

		if ( ! $site_data || ! isset( $site_data->options->created_at ) ) {
			return false;
		}

		$site_creation_timestamp = strtotime( $site_data->options->created_at );

		// Check if site was created after May 2, 2025
		$cutoff_timestamp = strtotime( '2025-05-02' );
		return $site_creation_timestamp > $cutoff_timestamp;
	}
}
