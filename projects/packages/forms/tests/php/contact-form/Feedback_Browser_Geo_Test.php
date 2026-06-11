<?php
/**
 * Unit Tests for Feedback Browser and Geographic Metadata.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

require_once __DIR__ . '/class-utility.php';

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Feedback Browser and Geographic Metadata
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Browser_Geo_Test extends BaseTestCase {

	public function test_ip_address_included_in_serialized_response() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'John Doe',
				'email'   => 'john@example.com',
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Create a contact form
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// The IP address should be present.
		$this->assertNotEmpty( $response->get_ip_address(), 'IP address should not be empty' );
		$this->assertNotEmpty( $saved_response->get_ip_address(), 'IP address should not be empty' );
		$this->assertEquals( $response->get_ip_address(), $saved_response->get_ip_address(), 'IP address should match' );

		add_filter( 'jetpack_contact_form_forget_ip_address', '__return_true' );
		$new_post_id = $response->save();
		remove_filter( 'jetpack_contact_form_forget_ip_address', '__return_true' );

		// The IP address should NOT be present.
		$saved_response = Feedback::get( $new_post_id );
		$this->assertEmpty( $saved_response->get_ip_address(), 'IP address should BE empty' );
	}

	/**
	 * Test the IP address is included in the serialized response.
	 * It should be always available when the response is created during the form submission.
	 *
	 * It should only be empty if the response that has the filter applied to it.
	 */
	public function test_ip_address_in_legacy() {
		$ip = 'http://123.123.123.122';

		$post_id = Utility::create_legacy_feedback(
			array(),
			null,
			null,
			null,
			null,
			$ip
		);

		$saved_response = Feedback::get( $post_id );
		$this->assertEquals( $ip, $saved_response->get_ip_address(), 'IP should match the legacy feedback  IP' );
	}

	/**
	 * Test the user agent is included in the serialized response.
	 * It should be available when the response is created during the form submission.
	 */
	public function test_user_agent_included_in_serialized_response() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'John Doe',
				'email'   => 'john@example.com',
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Set a test user agent
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

		// Create a contact form
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// The user agent should be present.
		$this->assertNotEmpty( $response->get_user_agent(), 'User agent should not be empty' );
		$this->assertNotEmpty( $saved_response->get_user_agent(), 'User agent should not be empty' );
		$this->assertEquals( $response->get_user_agent(), $saved_response->get_user_agent(), 'User agent should match' );
		$this->assertEquals( $_SERVER['HTTP_USER_AGENT'], $saved_response->get_user_agent(), 'User agent should match server value' );

		// Clean up
		unset( $_SERVER['HTTP_USER_AGENT'] );
	}

	/**
	 * Test that country code is included in serialized response and persists after save/load.
	 */
	public function test_country_code_included_in_serialized_response() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'Jane Doe',
				'email'   => 'jane@example.com',
				'message' => 'Test message from Canada',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Set up filter to return a test country code
		$test_country_code = 'CA';
		$filter_callback   = function () use ( $test_country_code ) {
			return $test_country_code;
		};
		add_filter( 'jetpack_get_country_from_ip', $filter_callback, 10 );

		// Create a contact form response
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// The country code should be present and match the test value.
		$this->assertNotEmpty( $response->get_country_code(), 'Country code should not be empty' );
		$this->assertNotEmpty( $saved_response->get_country_code(), 'Country code should not be empty after save/load' );
		$this->assertEquals( $response->get_country_code(), $saved_response->get_country_code(), 'Country code should match after save/load' );
		$this->assertEquals( $test_country_code, $saved_response->get_country_code(), 'Country code should match the filter value' );

		add_filter( 'jetpack_contact_form_forget_ip_address', '__return_true' );
		$new_post_id = $response->save();
		remove_filter( 'jetpack_contact_form_forget_ip_address', '__return_true' );

		$saved_response = Feedback::get( $new_post_id );
		$this->assertEmpty( $saved_response->get_country_code(), 'Country code should be empty when IP is forgotten' );
		// Clean up
		remove_filter( 'jetpack_get_country_from_ip', $filter_callback, 10 );
	}

	/**
	 * Test the browser information is parsed correctly from user agent.
	 */
	public function test_browser_parsing_from_user_agent() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'John Doe',
				'email'   => 'john@example.com',
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Test Chrome Desktop
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36';
		$response                   = Feedback::from_submission( $_post_data, $form );
		$browser                    = $response->get_browser();
		$this->assertStringContainsString( 'Chrome', $browser, 'Browser should be Chrome' );
		$this->assertStringContainsString( 'Desktop', $browser, 'Platform should be Desktop' );

		// Test Safari Mobile (iPhone)
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
		$response                   = Feedback::from_submission( $_post_data, $form );
		$browser                    = $response->get_browser();
		$this->assertStringContainsString( 'Safari', $browser, 'Browser should be Safari' );
		$this->assertStringContainsString( 'Mobile', $browser, 'Platform should be Mobile' );

		// Test Firefox Desktop
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
		$response                   = Feedback::from_submission( $_post_data, $form );
		$browser                    = $response->get_browser();
		$this->assertStringContainsString( 'Firefox', $browser, 'Browser should be Firefox' );
		$this->assertStringContainsString( 'Desktop', $browser, 'Platform should be Desktop' );

		// Test no user agent
		unset( $_SERVER['HTTP_USER_AGENT'] );
		$response = Feedback::from_submission( $_post_data, $form );
		$browser  = $response->get_browser();
		$this->assertNull( $browser, 'Browser should be null when no user agent' );
	}

	public function test_get_country_flag() {
		$form_id = Utility::get_form_id();

		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'John Doe',
				'email'   => 'john@example.com',
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Test valid country codes
		$test_cases = array(
			'US' => '🇺🇸',
			'GB' => '🇬🇧',
			'DE' => '🇩🇪',
			'CA' => '🇨🇦',
			'JP' => '🇯🇵',
			'us' => '🇺🇸', // Test lowercase (should be converted to uppercase internally)
		);

		foreach ( $test_cases as $country_code => $expected_flag ) {
			$filter_callback = function () use ( $country_code ) {
				return $country_code;
			};
			add_filter( 'jetpack_get_country_from_ip', $filter_callback, 10 );

			$response = Feedback::from_submission( $_post_data, $form );

			$this->assertEquals( $expected_flag, $response->get_country_flag(), "Country code {$country_code} should convert to flag emoji {$expected_flag}" );

			remove_filter( 'jetpack_get_country_from_ip', $filter_callback, 10 );
		}

		// Test when no country code is available
		$filter_callback = function () {
			return null;
		};
		add_filter( 'jetpack_get_country_from_ip', $filter_callback, 10 );

		$response = Feedback::from_submission( $_post_data, $form );
		$this->assertSame( '', $response->get_country_flag(), 'Should return empty string when no country code is available' );

		remove_filter( 'jetpack_get_country_from_ip', $filter_callback, 10 );
	}
}
