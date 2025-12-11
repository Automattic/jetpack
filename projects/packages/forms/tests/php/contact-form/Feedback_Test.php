<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Contact_Form.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

require_once __DIR__ . '/class-utility.php'; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for Contact_Form
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Test extends BaseTestCase {

	public function test_from_post_id_returns_null_for_invalid_post() {
		$response = Feedback::get( 999999 );
		$this->assertNull( $response );
	}

	public function test_from_post_id_returns_instance_for_valid_feedback_post() {
		$post_id  = \wp_insert_post(
			array(
				'post_type'     => 'feedback',
				'post_status'   => 'publish',
				'post_title'    => 'Test Feedback',
				'post_content'  => '{}',
				'page_template' => 'v2',
			)
		);
		$response = Feedback::get( $post_id );
		$this->assertInstanceOf( Feedback::class, $response );
	}

	public function test_from_submission_sets_fields_and_post_data() {
		$form       = new Contact_Form( array() );
		$_post_data = array(
			'name'    => 'John Doe',
			'email'   => 'john@example.com',
			'message' => 'Hello!',
			'ignore'  => 'should not be included',
		);
		$response   = Feedback::from_submission( $_post_data, $form );
		$this->assertInstanceOf( Feedback::class, $response );
	}

	public function test_feedback_is_matches_empty_data() {
		$form             = new Contact_Form( array() );
		$_post_data       = array();
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();

		$saved_response = Feedback::get( $feedback_post_id );

		$this->assertEquals( $response->serialize(), $saved_response->serialize(), 'Serialized data does not match' );
		$this->assertEquals( $response->get_fields(), $saved_response->get_fields(), 'Fields data does not match' );
	}

	public function test_feedback_is_matches_submission_data() {
		$name    = 'John Doe';
		$email   = 'john@example.com';
		$message = 'Test message';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $name,
				'email'   => $email,
				'message' => $message,
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
		$response = Feedback::from_submission( $_post_data, $form );
		$post_id  = $response->save();

		$saved_response = Feedback::get( $post_id );

		$this->assertEquals( $response->serialize(), $saved_response->serialize() );
		$this->assertEquals( $response->get_fields(), $saved_response->get_fields() );

		foreach ( $response->get_fields() as $field ) {
			$this->assertInstanceOf( Feedback_Field::class, $field );
		}

		foreach ( $saved_response->get_fields() as $field ) {
			$this->assertInstanceOf( Feedback_Field::class, $field );
		}

		foreach ( $saved_response->get_fields() as $field_key => $field ) {
			$this->assertEquals( $response->get_fields()[ $field_key ]->serialize(), $saved_response->get_fields()[ $field_key ]->serialize(), 'Serialized response field should match' );
		}

		$this->assertEquals( $name, $response->get_fields()['1_Name']->get_value(), 'Response field value should match' );
		$this->assertEquals( $name, $saved_response->get_fields()['1_Name']->get_value(), 'Saved response field value should match' );

		$this->assertEquals( $name, $response->get_field_value_by_label( 'Name' ), 'Response field value should match' );
		$this->assertEquals( $name, $saved_response->get_field_value_by_label( 'Name' ), 'Saved response field value should match' );

		$this->assertEquals( 'Name', $response->get_fields()['1_Name']->get_label(), 'Name response field label should match' );
		$this->assertEquals( 'Name', $saved_response->get_fields()['1_Name']->get_label(), 'Saved response field label should match' );
		$this->assertEquals( 'name', $response->get_fields()['1_Name']->get_type(), 'Response field type should match' );
		$this->assertEquals( 'name', $saved_response->get_fields()['1_Name']->get_type(), 'Saved response type value should match' );

		$this->assertEquals( $email, $response->get_fields()['2_Email']->get_value(), 'Response field value should match' );
		$this->assertEquals( $email, $saved_response->get_fields()['2_Email']->get_value(), 'Saved response field value should match' );

		$this->assertEquals( $message, $response->get_fields()['3_Message']->get_value(), 'Response field value should match' );
		$this->assertEquals( $message, $saved_response->get_fields()['3_Message']->get_value(), 'Saved Name response field value should match ' );
	}

	/**
	 * Test that a previously saved response can be handled correctly.
	 *
	 * This test checks if the Feedback class can retrieve and handle
	 * a response that was saved in the legacy format.
	 */
	public function test_handle_previously_saved_response() {

		$post_id = Utility::create_legacy_feedback(
			array(
				'1_field' => 'value1',
				'2_field' => 'value2',
			)
		);

		$response = Feedback::get( $post_id );

		$this->assertInstanceOf( Feedback::class, $response );

		$field = $response->get_fields()['1_field'];

		$this->assertInstanceOf( Feedback_Field::class, $field );
		$this->assertEquals( '1_field', $field->get_key() );
		$this->assertEquals( 'field', $field->get_label() );
		$this->assertEquals( 'value1', $field->get_value() );

		$this->assertEquals( 'basic', $field->get_type() ); // Assuming 'basic' is the default type for a simple text field.
		$this->assertEquals( 'value1', $field->get_render_value() );
	}
	/**
	 * Tests that the feedback ID is computed correctly when saving a from response.
	 *
	 * It should be non empty and match the post slug.
	 */
	public function test_feedback_computed_feedback_id() {
		$name    = 'John Doe';
		$email   = 'john@example.com';
		$message = 'Test message';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $name,
				'email'   => $email,
				'message' => $message,
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
		$response = Feedback::from_submission( $_post_data, $form );
		$post_id  = $response->save();
		$post     = get_post( $post_id );

		$saved_response = Feedback::get( $post_id );

		$this->assertEquals( $response->get_feedback_id(), $saved_response->get_feedback_id(), 'Feedback ID should match' );
		$this->assertEquals( $post->post_name, $saved_response->get_feedback_id(), 'Feedback ID should match post slug' );
		$this->assertNotEmpty( $saved_response->get_feedback_id(), 'Feedback ID should not be empty' );
	}

	/**
	 * Test the IP address is included in the serialized response.
	 * It should be always available when the response is created during the form submission.
	 *
	 * It should only be empty if the response that has the filter applied to it.
	 */
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
	 * It should be always available when the reponse is created during the form submission.
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

	/**
	 * Test the subject line is computed for legacy correctly.
	 */
	public function test_computed_subject_legacy() {
		$subject = 'Test Subject';
		$post_id = Utility::create_legacy_feedback(
			array(),
			null,
			null,
			null,
			null,
			null,
			$subject
		);

		$saved_response = Feedback::get( $post_id );
		$this->assertEquals( $subject, $saved_response->get_subject(), 'Subject should match the legacy feedback post subject' );
	}

	/**
	 * Test the subject line is computed correctly.
	 */
	public function test_computed_form_subject() {
		$subject = 'Test Subject';
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
				'subject'     => $subject,
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Create a contact form
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertEquals( $subject, $response->get_subject(), 'Subject should match the form submission' );
		$this->assertEquals( $subject, $saved_response->get_subject(), 'Subject should match the saved form submission' );
	}

	/**
	 * Test the subject line is computed via field
	 */
	public function test_computed_form_subject_field() {
		$subject = 'Test Subject';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'John Doe',
				'subject' => $subject,
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Subject' type='subject' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Create a contact form
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertEquals( $subject, $response->get_subject(), 'Subject should match the form submission' );
		$this->assertEquals( $subject, $saved_response->get_subject(), 'Subject should match the saved form submission' );
	}

	/**
	 * Test the subject line is computed correctly when both a subject attribute and a field is present.
	 */
	public function test_computed_form_subject_field_overwrites() {
		$subject = 'Test Subject';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'John Doe',
				'subject' => $subject,
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
				'subject'     => $subject . ' (from form attributes)',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Subject' type='subject' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Create a contact form
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertEquals( $subject, $response->get_subject(), 'Subject should match the form submission' );
		$this->assertEquals( $subject, $saved_response->get_subject(), 'Subject should match the saved form submission' );
	}

	/**
	 * Test the subject line is computed correctly and the filter is applied correctly.
	 */
	public function test_computed_form_subject_field_overwrites_filter() {
		$subject = 'Test Subject';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'John Doe',
				'subject' => $subject,
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
				'subject'     => $subject . ' (from form attributes)',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Subject' type='subject' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		add_filter( 'contact_form_subject', array( $this, 'subject_from_filter' ), 10, 2 );

		// Create a contact form
		$response       = Feedback::from_submission( $_post_data, $form );
		$post_id        = $response->save();
		$saved_response = Feedback::get( $post_id );
		remove_filter( 'contact_form_subject', array( $this, 'subject_from_filter' ) );

		$this->assertEquals( 'Overwritten Subject (from filter)', $response->get_subject(), 'Subject should match the form submission' );
		$this->assertEquals( 'Overwritten Subject (from filter)', $saved_response->get_subject(), 'Subject should match the saved form submission' );
	}
	/**
	 * Callback for the contact_form_subject filter.
	 *
	 * This function is used to overwrite the subject line when the filter is applied.
	 *
	 * @return string The overwritten subject line.
	 */
	public function subject_from_filter() {
		// Overwrite the subject with a different value.
		return 'Overwritten Subject (from filter)';
	}

	public function test_computed_name_for_legacy() {
		$author  = 'Mikey Mouse';
		$post_id = Utility::create_legacy_feedback(
			array(),
			null,
			$author
		);

		$saved_response = Feedback::get( $post_id );
		$this->assertEquals( $author, $saved_response->get_author(), 'Author should match the legacy feedback post author' );
	}

	public function test_author_name() {
		$author  = 'Mikey Mouse';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $author,
				'email'   => 'email@email.com',
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

		$this->assertEquals( $author, $response->get_author_name(), 'Author name should match the form submission' );
		$this->assertEquals( $author, $saved_response->get_author_name(), 'Author name should match the saved form submission' );
	}

	public function test_author_name_with_email() {
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email'   => 'email@email.com',
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Create a contact form
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertSame( '', $response->get_author_name(), 'Author name should match the form submission' );
		$this->assertSame( '', $saved_response->get_author_name(), 'Author name should match the saved form submission' );
	}

	public function test_computed_name() {
		$author = 'Mikey Mouse';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $author,
				'email'   => 'email@email.com',
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

		$this->assertEquals( $author, $response->get_author(), 'Author should match the form submission' );
		$this->assertEquals( $author, $saved_response->get_author(), 'Author should match the saved form submission' );
	}

	public function test_computed_name_as_email() {
		$author = ''; // author is empty
		$email  = 'email@email.com';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $author,
				'email'   => $email,
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

		$this->assertEquals( $email, $response->get_author(), 'Author should match the form submission' );
		$this->assertEquals( $email, $saved_response->get_author(), 'Author should match the saved form submission' );
	}

	public function test_computed_name_filter() {
		$author = 'Mikey Mouse';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $author,
				'email'   => 'email@email.com',
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

		add_filter( 'pre_comment_author_name', array( $this, 'set_filter_as_string' ) );
		$response = Feedback::from_submission( $_post_data, $form );

		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );
		remove_filter( 'pre_comment_author_name', array( $this, 'set_filter_as_string' ) );

		$this->assertEquals( 'STRING', $response->get_author(), 'Author should match the form submission' );
		$this->assertEquals( 'STRING', $saved_response->get_author(), 'Author should match the saved form submission' );
	}
	/**
	 * A helper function that sets the filter to return string 'STRING'.
	 *
	 * @return string
	 */
	public function set_filter_as_string() {
		return 'STRING';
	}

	public function test_computed_email_for_legacy() {
		$email   = 'email@email.com';
		$post_id = Utility::create_legacy_feedback(
			array(),
			null,
			null,
			$email
		);

		$saved_response = Feedback::get( $post_id );
		$this->assertEquals( $email, $saved_response->get_author_email(), 'Author email should match the legacy feedback post author email' );
		$this->assertEquals( get_avatar_url( $email ), $saved_response->get_author_avatar(), 'Author email should match the legacy feedback post author email' );
	}

	public function test_computed_email() {

		$email   = 'email@email.com';
		$avatar  = get_avatar_url( $email );
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'author ',
				'email'   => $email,
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

		$this->assertEquals( $email, $response->get_author_email(), 'Author email should match the form submission' );
		$this->assertEquals( $avatar, $saved_response->get_author_avatar(), 'Author avatar should match the legacy feedback post author email' );
		$this->assertEquals( $email, $saved_response->get_author_email(), 'Author email should match the saved form submission' );
		$this->assertEquals( $avatar, $saved_response->get_author_avatar(), 'Author email should match the legacy feedback post author email' );
	}

	public function test_computed_email_filter() {
		$email = 'email@email.com';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'joe',
				'email'   => $email,
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

		add_filter( 'pre_comment_author_email', array( $this, 'set_filter_as_string' ) );
		$response = Feedback::from_submission( $_post_data, $form );

		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );
		remove_filter( 'pre_comment_author_email', array( $this, 'set_filter_as_string' ) );
		$this->assertEquals( 'STRING', $response->get_author_email(), 'Author email should match the form submission' );
		$this->assertEquals( 'STRING', $saved_response->get_author_email(), 'Author email should match the saved form submission' );
	}

	public function test_computed_url_for_legacy() {
		$url     = 'https://wordpress.com';
		$post_id = Utility::create_legacy_feedback(
			array(),
			null,
			null,
			null,
			$url
		);

		$saved_response = Feedback::get( $post_id );
		$this->assertEquals( $url, $saved_response->get_author_url(), 'Author url should match the legacy feedback post author url' );
	}

	public function test_computed_url() {
		$url = 'https://wordpress.com';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'url'     => $url,
				'email'   => 'email@email.com',
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Url' type='url' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Create a contact form
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertEquals( $url, $response->get_author_url(), 'Author url should match the form submission' );
		$this->assertEquals( $url, $saved_response->get_author_url(), 'Author url should match the saved form submission' );
	}

	public function test_computed_url_filter() {
		$url     = 'https://wordpress.com';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'url'     => $url,
				'email'   => 'email@email.com',
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Url' type='url' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		add_filter( 'pre_comment_author_url', array( $this, 'set_filter_as_string' ) );
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		remove_filter( 'pre_comment_author_url', array( $this, 'set_filter_as_string' ) );

		$this->assertEquals( 'STRING', $response->get_author_url(), 'Author url should match the form submission' );
		$this->assertEquals( 'STRING', $saved_response->get_author_url(), 'Author url should match the saved form submission' );
	}

	public function test_computed_comment_content_for_legacy() {
		$content = 'Some comment content!';
		$post_id = Utility::create_legacy_feedback(
			array(),
			$content
		);

		$saved_response = Feedback::get( $post_id );
		$this->assertEquals( $content, $saved_response->get_comment_content(), 'Comment content should match the legacy feedback post author url' );
	}

	public function test_computed_comment_content() {
		$content = 'Some comment content!';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'url'     => 'https://howdy.com',
				'email'   => 'email@email.com',
				'message' => $content,
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Url' type='url' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Create a contact form
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertEquals( $content, $response->get_comment_content(), 'Comment content should match the form submission' );
		$this->assertEquals( $content, $saved_response->get_comment_content(), 'Comment content should match the saved form submission' );
	}

	public function test_status_from_legacy() {
		$status  = 'spam';
		$post_id = Utility::create_legacy_feedback(
			array(),
			null,
			null,
			null,
			null,
			null,
			null,
			'spam'
		);

		$saved_response = Feedback::get( $post_id );
		$this->assertEquals( $status, $saved_response->get_status(), 'Status should match the legacy feedback status' );
	}

	public function test_computed_status() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email'   => 'email@email.com',
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertEquals( 'publish', $response->get_status(), 'Status should match the form submission' );
		$this->assertEquals( 'publish', $saved_response->get_status(), 'Status should match the saved form submission' );
	}

	public function test_set_status() {
		$status  = 'trash';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email'   => 'email@email.com',
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form );
		$response->set_status( $status );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertEquals( $status, $response->get_status(), 'Status should match the form submission' );
		$this->assertEquals( $status, $saved_response->get_status(), 'Status should match the saved form submission' );
	}

	public function test_consent() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email'   => 'email@email.com',
				'consent' => 'Yes',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/][contact-field label='Consent' type='consent' required='1'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );
		$this->assertTrue( $response->has_consent(), 'Has consent should match the form submission' );
		$this->assertTrue( $saved_response->has_consent(), 'Has consent should match the saved form submission' );
	}

	public function test_empty_consent() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email'   => 'email@email.com',
				'consent' => '',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/][contact-field label='Consent' type='consent' consenttype='explicit' required='1'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );
		$this->assertFalse( $response->has_consent(), 'Has consent should match the form submission' );
		$this->assertFalse( $saved_response->has_consent(), 'Has consent should match the saved form submission' );
	}

	public function test_implicit_consent_submits_yes() {
		$form_id = Utility::get_form_id();

		// Create a form submission with implicit consent field
		// Since implicit consent renders as hidden input with value="Yes",
		// a real form submission would always post "Yes"
		$_post_data = Utility::get_post_request(
			array(
				'email'   => 'email@example.com',
				'consent' => 'Yes', // This is what the hidden input would submit
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/][contact-field label='Consent' type='consent' consenttype='implicit' required='1'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// Implicit consent should be granted when "Yes" is posted
		$this->assertTrue( $response->has_consent(), 'Implicit consent should be granted' );
		$this->assertTrue( $saved_response->has_consent(), 'Saved implicit consent should be granted' );

		// Check that the field value is 'Yes'
		$this->assertEquals( 'Yes', $response->get_field_value_by_label( 'Consent' ), 'Implicit consent field value should be Yes' );
		$this->assertEquals( 'Yes', $saved_response->get_field_value_by_label( 'Consent' ), 'Saved implicit consent field value should be Yes' );
	}

	public function test_explicit_consent_respects_posted_value() {
		$form_id = Utility::get_form_id();

		// Create a form submission with explicit consent field, posting empty value
		$_post_data = Utility::get_post_request(
			array(
				'email'   => 'email@example.com',
				'consent' => '', // Empty value should result in no consent for explicit consent
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/][contact-field label='Consent' type='consent' consenttype='explicit' required='1'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// With explicit consent, should respect the posted value
		$this->assertFalse( $response->has_consent(), 'Explicit consent should not be granted when empty value is posted' );
		$this->assertFalse( $saved_response->has_consent(), 'Saved explicit consent should not be granted when empty value is posted' );
	}

	public function test_compute_entry_ID_legacy() {
		$current_post = Utility::create_post_context();
		$post_id      = Utility::create_legacy_feedback();
		Utility::destroy_post_context( $current_post );
		$saved_response = Feedback::get( $post_id );

		$this->assertSame( $current_post->ID, $saved_response->get_entry_id(), 'Entry_ID should match the saved form submission' );
	}

	public function test_compute_entry_ID() {
		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email'   => 'email@email.com',
				'consent' => '',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/][contact-field label='Consent' type='consent' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form, $current_post );
		$post_id  = $response->save();
		Utility::destroy_post_context( $current_post );

		$saved_response = Feedback::get( $post_id );
		$this->assertEquals( $current_post->ID, $response->get_entry_id(), 'Entry_ID should match the form submission' );
		$this->assertEquals( $current_post->ID, $saved_response->get_entry_id(), 'Entry_ID should match the saved form submission' );
	}

	public function test_compute_entry_title() {
		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form, $current_post );
		$post_id  = $response->save();

		$saved_response = Feedback::get( $post_id );
		Utility::destroy_post_context( $current_post );

		$this->assertEquals( $current_post->post_title, $response->get_entry_title(), 'Post title should match the form submission' );
		$this->assertEquals( $current_post->post_title, $saved_response->get_entry_title(), 'Post title should match the saved form submission' );
	}

	public function test_compute_entry_title_updated() {
		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form, $current_post );
		$post_id  = $response->save();

		// Update the post title to simulate an update.
		$update_title = 'Updated Title';
		wp_update_post(
			array(
				'ID'         => $current_post->ID,
				'post_title' => $update_title,
			)
		);

		$saved_response = Feedback::get( $post_id );
		Utility::destroy_post_context( $current_post );

		$this->assertEquals( $update_title, $saved_response->get_entry_title(), 'Post Title should match the new updated title saved form submission' );
	}

	public function test_compute_entry_title_deleted() {
		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form, $current_post );
		$post_id  = $response->save();
		Utility::destroy_post_context( $current_post );

		$this->assertSame( '', get_the_title( $current_post->ID ), 'Post title should not be available after the post is deleted' );
		// At this point we should have a deleted post.
		$saved_response = Feedback::get( $post_id );

		$this->assertNotEmpty( $saved_response->get_entry_title(), 'Post Title should NOT be empty after the post is deleted' );
		$this->assertEquals( '(deleted) ' . $current_post->post_title, $saved_response->get_entry_title(), 'Post Title should match the saved form submission Original post title' );
	}

	public function test_get_all_values() {
		// Test that the get_all_values method returns all values from the form submission.

		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
		);

		$response            = Feedback::from_submission( $_post_data, $form, $current_post );
		$post_id             = $response->save();
		$response_all_values = $response->get_all_values();
		$saved_response      = Feedback::get( $post_id );
		Utility::destroy_post_context( $current_post );
		$saved_all_values = $saved_response->get_all_values();

		$this->assertEquals(
			$response_all_values,
			$saved_all_values,
			'All values from the form submission should match the saved form submission'
		);

		$keys = array(
			'1_Email',
			'email_marketing_consent',
			'entry_title',
			'entry_permalink',
			'feedback_id',
		);

		foreach ( $keys as $key ) {
			$this->assertArrayHasKey( $key, $response_all_values, "Key '$key' should be present in the all values array" );
			$this->assertArrayHasKey( $key, $saved_all_values, "Key '$key' should be present in the saved all values array" );
		}
		$this->assertArrayNotHasKey( 'entry_page', $response_all_values, 'Key entry_page should not be present in the all values array' );
	}

	public function test_get_all_values_with_page_number() {
		// Test that the get_all_values method returns all values from the form submission.

		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
		);

		$response            = Feedback::from_submission( $_post_data, $form, $current_post, 888 );
		$post_id             = $response->save();
		$response_all_values = $response->get_all_values();
		$saved_response      = Feedback::get( $post_id );
		Utility::destroy_post_context( $current_post );
		$saved_all_values = $saved_response->get_all_values();

		$this->assertEquals(
			$response_all_values,
			$saved_all_values,
			'All values from the form submission should match the saved form submission'
		);

		$keys = array(
			'1_Email',
			'email_marketing_consent',
			'entry_title',
			'entry_permalink',
			'feedback_id',
			'entry_page',
		);

		foreach ( $keys as $key ) {
			$this->assertArrayHasKey( $key, $response_all_values, "Key '$key' should be present in the all values array" );
			$this->assertArrayHasKey( $key, $saved_all_values, "Key '$key' should be present in the saved all values array" );
		}
		$this->assertEquals( 888, $response_all_values['entry_page'], 'Key entry_page should be present in the all values array' );
		$this->assertEquals( 888, $saved_all_values['entry_page'], 'Key entry_page should be present in the saved all values array' );

		$this->assertStringContainsString(
			'page=888',
			$response_all_values['entry_permalink'],
			'Entry permalink should contain the page number'
		);
	}

	public function test_get_all_values_with_image_select() {
		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();

		// Create a form submission with two selected image choices
		$_post_data = Utility::get_post_request(
			array(
				'images' => array(
					'{"perceived":"B","selected":"B","label":"Choice B","showLabels":true,"image":{"id":null,"src":"https://www.example.com/choice-b.png"}}',
					'{"perceived":"C","selected":"C","label":"Choice C","showLabels":true,"image":{"id":12346,"src":"https://www.example.com/choice-c.png"}}',
				),
			),
			'g' . $form_id
		);

		// Helper function to create image block data for optionsdata
		$create_image_block = function ( $url, $alt ) {
			return array(
				'blockName'    => 'core/image',
				'attrs'        => array(
					'url'         => $url,
					'alt'         => $alt,
					'scale'       => 'cover',
					'aspectRatio' => '1',
				),
				'innerHTML'    => "<img src=\"{$url}\" alt=\"{$alt}\" />",
				'innerContent' => array( "<img src=\"{$url}\" alt=\"{$alt}\" />" ),
			);
		};

		$optionsdata = Contact_Form::esc_shortcode_val(
			wp_json_encode(
				array(
					array(
						'letter' => 'A',
						'label'  => 'Choice A',
						'image'  => $create_image_block( 'https://www.example.com/choice-a.png', 'Choice A' ),
					),
					array(
						'letter' => 'B',
						'label'  => 'Choice B',
						'image'  => $create_image_block( 'https://www.example.com/choice-b.png', 'Choice B' ),
					),
					array(
						'letter' => 'C',
						'label'  => 'Choice C',
						'image'  => $create_image_block( 'https://www.example.com/choice-c.png', 'Choice C' ),
					),
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			)
		);

		$shortcode = "[contact-field type=\"image-select\" label=\"Images\" isMultiple=\"1\" options=\"A,B,C\" showLabels=\"1\" optionsdata=\"{$optionsdata}\" /]";

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			$shortcode
		);

		$expected_images = array(
			'type'    => 'image-select',
			'choices' => array(
				array(
					'perceived'  => 'B',
					'selected'   => 'B',
					'label'      => 'Choice B',
					'showLabels' => true,
					'image'      => array(
						'id'  => null,
						'src' => 'https://www.example.com/choice-b.png',
					),
				),
				array(
					'perceived'  => 'C',
					'selected'   => 'C',
					'label'      => 'Choice C',
					'showLabels' => true,
					'image'      => array(
						'id'  => 12346,
						'src' => 'https://www.example.com/choice-c.png',
					),
				),
			),
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );
		Utility::destroy_post_context( $current_post );

		$this->assertEquals( $expected_images, $response->get_all_values( 'submit' )['1_Images'], 'Response all values should match the expected values' );
		$this->assertEquals( $expected_images, $saved_response->get_all_values( 'submit' )['1_Images'], 'Saved response all values should match the expected values' );
	}

	public function test_get_all_values_with_file_upload() {

		add_filter( 'jetpack_forms_is_file_field_renderable', '__return_true' );

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'uploadafile' => array( '{"file_id":54321,"name":"Screenshot.png","size":19914,"type":"image/png"}', '{}' ),
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			'[contact-field type="file" label="Upload a file" /]'
		);

		$expected_file = array(
			'field_id' => 'g' . $form_id . '-uploadafile',
			'files'    => array(
				array(
					'file_id' => 54321,
					'name'    => 'Screenshot.png',
					'size'    => 19914,
					'type'    => 'image/png',
				),
				array(
					'file_id' => 0,
					'name'    => '',
					'size'    => 0,
					'type'    => '',
				),
			),
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );
		$this->assertTrue( $response->has_file(), 'Response should have file uploaded' );
		$this->assertTrue( $saved_response->has_file(), 'Saved response should have file uploaded' );

		$this->assertEquals( $expected_file, $response->get_all_values( 'submit' )['1_Upload a file'], 'Response all values should match the expected values' );
		$this->assertEquals( $expected_file, $saved_response->get_all_values( 'submit' )['1_Upload a file'], 'Saved response all values should match the expected values' );

		$this->assertEquals( $expected_file, $response->get_legacy_extra_values( 'submit' )['2_Upload a file'], 'Response all values should match the expected values' );
		$this->assertEquals( $expected_file, $saved_response->get_legacy_extra_values( 'submit' )['2_Upload a file'], 'Saved response all values should match the expected values' );

		remove_filter( 'jetpack_forms_is_file_field_renderable', '__return_true' );
	}

	public function test_get_akismet_vars() {
		// Test that the get_akismet_vars method returns the correct variables for Akismet.

		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
				'name'  => 'Test User',
				'text'  => 'This is a test message.',
				'url'   => 'https://www.example.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Url' type='url' required='1'/][contact-field label='Text' type='text' required='1'/][contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form, $current_post );
		$post_id  = $response->save();

		$saved_response = Feedback::get( $post_id );
		Utility::destroy_post_context( $current_post );

		$this->assertNotEmpty( $response->get_akismet_vars(), 'Akismet vars should not be empty for the form submission' );
		$this->assertEquals( $saved_response->get_akismet_vars(), $response->get_akismet_vars(), 'Post ID should match the form submission' );
		$assert_keys = array(
			'comment_author',
			'comment_author_email',
			'comment_author_url',
			'contact_form_subject',
			'comment_author_ip',
			'comment_content',
			'contact_form_field_text',
		);

		foreach ( $assert_keys as $key ) {
			$this->assertArrayHasKey( $key, $response->get_akismet_vars(), "Akismet vars should contain '$key'" );
			$this->assertArrayHasKey( $key, $saved_response->get_akismet_vars(), "Akismet vars should contain '$key'" );
		}
	}

	public function test_compute_entry_permalink() {
		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form, $current_post );
		$post_id  = $response->save();

		$saved_response = Feedback::get( $post_id );
		Utility::destroy_post_context( $current_post );
		$current_permalink = get_the_permalink( $current_post );
		$this->assertEquals( $current_permalink, $response->get_entry_permalink(), 'Post permalink should match the form submission' );

		$this->assertEquals( $current_permalink, $saved_response->get_entry_permalink(), 'Post permalink should match the saved form submission' );
	}

	public function test_compute_entry_permalink_deleted_post() {
		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form );
		$response->set_source( new Feedback_Source( $current_post->ID, $current_post->post_title, 1, 'single', home_url( '?p=' . $current_post->ID ) ) );

		$post_id = $response->save();
		Utility::destroy_post_context( $current_post ); // Destroy the post context to simulate a deleted post.
		$saved_response = Feedback::get( $post_id );
		$this->assertEmpty( $saved_response->get_entry_permalink(), 'Post permalink should match the form submission' );
	}

	public function test_compute_entry_permalink_with_page_number() {
		$current_post = Utility::create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form, $current_post, 999 );
		$post_id  = $response->save();

		$saved_response = Feedback::get( $post_id );
		Utility::destroy_post_context( $current_post );

		$this->assertStringContainsString( 'page=999', $response->get_entry_permalink(), 'Post permalink should match the form submission' );
		$this->assertStringContainsString( 'page=999', $saved_response->get_entry_permalink(), 'Post permalink should match the saved form submission' );
		$this->assertStringContainsString( 'page=999', $saved_response->get_entry_short_permalink(), 'Post short relative path permalink should match the saved form submission' );
	}

	public function test_feedback_title() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'  => 'Test User',
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form );
		$post_id  = $response->save();

		$post           = get_post( $post_id );
		$saved_response = Feedback::get( $post_id );

		$this->assertStringContainsString( $post->post_title, $response->get_title(), 'Feedback title should match the form submission' );
		$this->assertStringContainsString( $post->post_title, $saved_response->get_title(), 'Feedback title should match the saved form submission' );
	}

	public function test_feedback_title_time() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'  => 'Test User',
				'email' => 'email@email.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form );
		$post_id  = $response->save();

		$post           = get_post( $post_id );
		$saved_response = Feedback::get( $post_id );

		$this->assertStringContainsString( $post->post_date, $response->get_time(), 'Feedback submitted time should match the form submission' );
		$this->assertStringContainsString( $post->post_date, $saved_response->get_time(), 'Feedback submitted time should match the saved form submission' );
	}

	/**
	 * ======================================================
	 * Tests for the get_compiled_fields method in Feedback class.
	 * ======================================================
	 *
	 * Test that get_compiled_fields returns empty array for feedback without fields.
	 */
	public function test_get_compiled_fields_returns_default_fields_for_empty_form() {
		// default form will have email, name, url, message fields
		$form       = new Contact_Form( array() );
		$_post_data = array();
		$response   = Feedback::from_submission( $_post_data, $form );

		$compiled_fields = $response->get_compiled_fields();

		$default_form = array(
			'1_Name'    => array(
				'label' => 'Name',
				'value' => '',
			),
			'2_Email'   => array(
				'label' => 'Email',
				'value' => '',
			),
			'3_Website' => array(
				'label' => 'Website',
				'value' => '',
			),
			'4_Message' => array(
				'label' => 'Message',
				'value' => '',
			),
		);

		$this->assertEquals( $default_form, $compiled_fields );
	}

	/**
	 * Data provider for get_compiled_fields test cases.
	 *
	 * @return array Test data with different field format expectations.
	 */
	public static function get_compiled_fields_data_provider() {
		$test_name    = 'John Smith';
		$test_email   = 'john.smith@example.com';
		$test_website = 'https://johnsmith.dev';
		$test_message = 'Hello, this is a test message from our contact form.';

		return array(
			'all_format'         => array(
				'format'   => 'all',
				'expected' => array(
					'1_Name'    => array(
						'label' => 'Name',
						'value' => $test_name,
					),
					'2_Email'   => array(
						'label' => 'Email',
						'value' => $test_email,
					),
					'3_Website' => array(
						'label' => 'Website',
						'value' => $test_website,
					),
					'4_Message' => array(
						'label' => 'Message',
						'value' => $test_message,
					),
				),
				'message'  => 'Compiled fields should match the default form structure with all field data.',
			),
			'key_value_format'   => array(
				'format'   => 'key-value',
				'expected' => array(
					'1_Name'    => $test_name,
					'2_Email'   => $test_email,
					'3_Website' => $test_website,
					'4_Message' => $test_message,
				),
				'message'  => 'Compiled fields should return key-value pairs only.',
			),
			'label|value_format' => array(
				'format'   => 'label|value',
				'expected' => array(
					array(
						'label' => 'Name',
						'value' => $test_name,
					),
					array(
						'label' => 'Email',
						'value' => $test_email,
					),
					array(
						'label' => 'Website',
						'value' => $test_website,
					),
					array(
						'label' => 'Message',
						'value' => $test_message,
					),
				),
				'message'  => 'Compiled fields should return label|value pairs only.',
			),
			'value_format'       => array(
				'format'   => 'value',
				'expected' => array(
					$test_name,
					$test_email,
					$test_website,
					$test_message,
				),
				'message'  => 'Compiled fields should return only values as indexed array.',
			),
			'label-value_format' => array(
				'format'   => 'label-value',
				'expected' => array(
					'Name'    => $test_name,
					'Email'   => $test_email,
					'Website' => $test_website,
					'Message' => $test_message,
				),
				'message'  => 'Compiled fields should return only labels as indexed array.',
			),
			'label_format'       => array(
				'format'   => 'label',
				'expected' => array(
					'Name',
					'Email',
					'Website',
					'Message',
				),
				'message'  => 'Compiled fields should return only labels as indexed array.',
			),
			'id-value_format'    => array(
				'format'   => 'id-value',
				'expected' => array(), // Rebuilt dynamically in the test with actual form_id
				'message'  => 'Compiled fields should return field IDs mapped to values.',
			),
		);
	}

	/**
	 * Test get_compiled_fields with different output formats.
	 *
	 * @dataProvider get_compiled_fields_data_provider
	 *
	 * @param string $format   The format parameter for get_compiled_fields.
	 * @param array  $expected The expected output.
	 * @param string $message  The assertion message.
	 */
	#[DataProvider( 'get_compiled_fields_data_provider' )]
	public function test_get_compiled_fields_shapes( $format, $expected, $message ) {
		// Test data
		$test_name    = 'John Smith';
		$test_email   = 'john.smith@example.com';
		$test_website = 'https://johnsmith.dev';
		$test_message = 'Hello, this is a test message from our contact form.';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $test_name,
				'email'   => $test_email,
				'website' => $test_website,
				'message' => $test_message,
			),
			'g' . $form_id
		);

		// Test that get_compiled_fields returns the correct structure for a default form
		$form     = new Contact_Form( array() );
		$response = Feedback::from_submission( $_post_data, $form );

		// Test the specified format
		$compiled_fields = $response->get_compiled_fields( 'default', $format );

		// For id-value format, rebuild expected with actual form_id, there
		// was no way of passing the form_id to the data provider.
		if ( 'id-value' === $format ) {
			$expected = array(
				'g' . $form_id . '-name'    => $test_name,
				'g' . $form_id . '-email'   => $test_email,
				'g' . $form_id . '-website' => $test_website,
				'g' . $form_id . '-message' => $test_message,
			);
		}

		$this->assertEquals( $expected, $compiled_fields, $message );
	}

	public function test_get_compiled_fields_hidden_field() {
		// Test data
		$test_email = 'john.smith@example.com';
		$form_id    = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'hidden' => 'hidden_value',
				'email'  => $test_email,
			),
			'g' . $form_id
		);

		// Test that get_compiled_fields returns the correct structure for a default form
		$form     = new Contact_Form( array(), '[contact-field label="Hidden" type="hidden" default="hidden_value"][contact-field label="Email" type="email" ]' );
		$response = Feedback::from_submission( $_post_data, $form );

		// Test the specified format
		$web     = $response->get_compiled_fields( 'web' );
		$ajax    = $response->get_compiled_fields( 'ajax' );
		$default = $response->get_compiled_fields( 'default' );

		$empty = array(
			'2_Email' => array(
				'label' => 'Email',
				'value' => 'john.smith@example.com',
			),
		);

		$default_expected = array_merge(
			array(
				'1_Hidden' => array(
					'label' => 'Hidden',
					'value' => 'hidden_value',
				),
			),
			$empty
		);

		$this->assertEquals( $empty, $web );
		$this->assertEquals( $empty, $ajax );
		$this->assertEquals( $default_expected, $default );
	}

	/**
	 *
	 * Test file uploads in feedback
	 */
	public function test_file_uploads() {

		$file = array(
			'file_id' => 1234,
			'name'    => 'test-file.txt',
			'size'    => 1234,
			'type'    => 'text/plain',
		);

		$url     = 'https://wordpress.com';
		$post_id = Utility::create_legacy_feedback(
			array(
				'1_file upload' => array(
					'field_id' => 'file_upload',
					'files'    => array( $file ),
				),
			),
			null,
			null,
			null,
			$url
		);

		$saved_response = Feedback::get( $post_id );
		$this->assertEquals( 'test-file.txt (1 KB)', $saved_response->get_field_value_by_label( 'file upload' ) );

		foreach ( $saved_response->get_fields() as $field ) {
			if ( $field->get_label() === 'file upload' ) {
				$this->assertEquals( 'file', $field->get_type() );
			}
		}

		$this->assertSame( '', $saved_response->get_field_value_by_label( 'non existing field' ) );
	}

	public function test_legacy_get_all_legacy_values() {
		// Setup the post context.
		$holding_post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_title'  => 'Cool Post Title',
				'post_status' => 'publish',
			)
		);
		global $post;
		$post = get_post( $holding_post_id );

		$post_id = Utility::create_legacy_feedback(
			array(
				'1_field' => 'value1',
				'2_field' => 'value2',
			)
		);

		$response = Feedback::get( $post_id );

		$expected_legacy_values = array(
			'_feedback_author'       => 'Test User',
			'_feedback_author_email' => 'test@email.com',
			'_feedback_author_url'   => 'http://example.com',
			'_feedback_subject'      => 'Test Subject',
			'_feedback_ip'           => 'https://127.0.0.1',
			'_feedback_all_fields'   => array(
				'1_field'                 => 'value1',
				'2_field'                 => 'value2',
				'email_marketing_consent' => 'no',
				'entry_title'             => 'Cool Post Title',
				'entry_permalink'         => 'http://example.org/?p=' . $holding_post_id,
				'feedback_id'             => 'skip',
			),
		);

		$response_legacy = $response->get_all_legacy_values();

		$this->assertNotEmpty( $response_legacy, 'Legacy values should not be empty for the legacy feedback' );

		foreach ( $expected_legacy_values as $key => $value ) {
			$this->assertArrayHasKey( $key, $response_legacy, 'Extra values should contain the expected key: ' . $key );

			if ( is_array( $value ) ) {
				foreach ( $value as $sub_key => $sub_value ) {
					$this->assertArrayHasKey( $sub_key, $response_legacy[ $key ], 'Extra values should contain the expected sub-key: ' . $sub_key );
					if ( $sub_value !== 'skip' ) {
						$this->assertEquals( $sub_value, $response_legacy[ $key ][ $sub_key ], 'Extra values should match the expected sub-value for key: ' . $sub_key );
					}
				}
			} else {
				$this->assertEquals( $value, $response_legacy[ $key ], 'Extra values should match the expected value for key: ' . $key );
			}
		}
	}

	public function test_get_all_legacy_values() {
		$form_id = Utility::get_form_id( array( 'widget' => 'widget' ) );
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'text'    => 'Test text',
				'email'   => 'john.smith@example.com',
				'email_2' => 'john.smith@example2.com',
				'website' => 'https://johnsmith.dev',
				'message' => 'Hello, this is a test message from our contact form.',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
				'widget'      => 'widget',
			),
			"[contact-field label='Text' type='text' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Email_2' type='email' required='1'/][contact-field label='Website' type='url' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		$response               = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id       = $response->save();
		$saved_response         = Feedback::get( $feedback_post_id );
		$expected_legacy_values = array(
			'_feedback_author'       => 'john.smith@example.com',
			'_feedback_author_email' => 'john.smith@example.com',
			'_feedback_author_url'   => 'https://johnsmith.dev',
			'_feedback_subject'      => 'skip',
			'_feedback_ip'           => '127.0.0.1',
			'_feedback_all_fields'   => array(
				'1_Text'                  => 'Test text',
				'2_Email'                 => 'john.smith@example.com',
				'3_Email_2'               => 'john.smith@example2.com',
				'4_Website'               => 'https://johnsmith.dev',
				'5_Message'               => 'Hello, this is a test message from our contact form.',
				'email_marketing_consent' => 'no',
				'entry_title'             => '',
				'entry_permalink'         => home_url(),
				'feedback_id'             => 'skip',
			),
		);

		$this->assertNotEmpty( $response->get_all_legacy_values(), 'Extra values should not be empty for the form submission' );
		$this->assertEquals( $response->get_all_legacy_values(), $saved_response->get_all_legacy_values(), 'Extra values should match the saved form submission' );
		$response_legacy = $response->get_all_legacy_values();
		$saved_legacy    = $saved_response->get_all_legacy_values();
		foreach ( $expected_legacy_values as $key => $value ) {
			$this->assertArrayHasKey( $key, $response_legacy, 'Extra values should contain the expected key: ' . $key );
			$this->assertArrayHasKey( $key, $saved_legacy, 'Saved extra values should contain the expected key: ' . $key );

			if ( is_array( $value ) ) {
				foreach ( $value as $sub_key => $sub_value ) {
					$this->assertArrayHasKey( $sub_key, $response_legacy[ $key ], 'Extra values should contain the expected sub-key: ' . $sub_key );
					$this->assertArrayHasKey( $sub_key, $saved_legacy[ $key ], 'Saved extra values should contain the expected sub-key: ' . $sub_key );
					if ( $sub_value !== 'skip' ) {
						$this->assertEquals( $sub_value, $response_legacy[ $key ][ $sub_key ], 'Extra values should match the expected sub-value for key: ' . $sub_key );
						$this->assertEquals( $sub_value, $saved_legacy[ $key ][ $sub_key ], 'Saved extra values should match the expected sub-value for key: ' . $sub_key );
					}
				}
			} elseif ( $value !== 'skip' ) {
				$this->assertEquals( $value, $response_legacy[ $key ], 'Extra values should match the expected value for key: ' . $key );
				$this->assertEquals( $value, $saved_legacy[ $key ], 'Saved extra values should match the expected value for key: ' . $key );
			}
		}
	}

	public function test_get_legacy_extra_values() {
		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'text'    => 'Test text',
				'email'   => 'john.smith@example.com',
				'email_2' => 'john.smith@example2.com',
				'website' => 'https://johnsmith.dev',
				'message' => 'Hello, this is a test message from our contact form.',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Text' type='text' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Email_2' type='email' required='1'/][contact-field label='Website' type='url' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		$response              = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id      = $response->save();
		$saved_response        = Feedback::get( $feedback_post_id );
		$expected_extra_values = array(
			'6_Text'    => 'Test text',
			'7_Email_2' => 'john.smith@example2.com',
		);

		$this->assertNotEmpty( $response->get_legacy_extra_values(), 'Extra values should not be empty for the form submission' );
		$this->assertEquals( $response->get_legacy_extra_values(), $saved_response->get_legacy_extra_values(), 'Extra values should match the saved form submission' );
		$response_extra = $response->get_legacy_extra_values();
		$saved_extra    = $saved_response->get_legacy_extra_values();
		$this->assertEquals( $expected_extra_values, $response_extra, 'Extra values should match the expected extra values' );
		$this->assertEquals( $expected_extra_values, $saved_extra, 'Saved extra values should match the expected extra values' );
	}

	public function test_legacy_get_legacy_extra_values() {
		$post_id                = Utility::create_legacy_feedback(
			array(
				'1_field' => 'value1',
				'2_field' => 'test@email.com',
				'3_field' => 'value2',
			)
		);
		$expected_legacy_values = array(
			'4_field' => 'value1',
			'5_field' => 'value2',
		);
		$response               = Feedback::get( $post_id );
		$response_legacy        = $response->get_legacy_extra_values();
		$this->assertNotEmpty( $response_legacy, 'Legacy values should not be empty for the legacy feedback' );
		$this->assertEquals( $expected_legacy_values, $response_legacy, 'Legacy extra values should match the expected extra values' );
	}

	public function test_has_field_type_with_consent_explicit_checked() {
		$form_id = Utility::get_form_id();

		$_post_data = Utility::get_post_request(
			array(
				'email'   => 'email@example.com',
				'consent' => 'Yes',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
			. "[contact-field label='Consent' type='consent' required='1'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// Check both the in-memory response and the saved one return the same values.
		$this->assertTrue( $response->has_field_type( 'consent' ), 'Feedback (response) should report consent field exists' );
		$this->assertTrue( $response->has_consent(), 'Consent (response) should be granted when posted as Yes' );

		$this->assertTrue( $saved_response->has_field_type( 'consent' ), 'Feedback (saved) should report consent field exists' );
		$this->assertTrue( $saved_response->has_consent(), 'Consent (saved) should be granted when posted as Yes' );
	}

	public function test_has_field_type_without_consent_field() {
		$form_id = Utility::get_form_id();

		$_post_data = Utility::get_post_request(
			array(
				'email' => 'email@example.com',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Email' type='email' required='1'/]"
			. "[contact-field label='Message' type='textarea'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// Check both the in-memory response and the saved one return the same values.
		$this->assertFalse( $response->has_field_type( 'consent' ), 'Feedback (response) should report no consent field' );
		$this->assertFalse( $response->has_consent(), 'Consent (response) should be false when no consent field was present' );

		$this->assertFalse( $saved_response->has_field_type( 'consent' ), 'Feedback (saved) should report no consent field' );
		$this->assertFalse( $saved_response->has_consent(), 'Consent (saved) should be false when no consent field was present' );
	}

	public function test_get_files_legacy() {
		$file1 = array(
			'file_id' => 1234,
			'name'    => 'test-file.txt',
			'size'    => 1234,
			'type'    => 'text/plain',
		);

		$file2 = array(
			'file_id' => 5678,
			'name'    => 'test-file.png',
			'size'    => 4567,
			'type'    => 'image/png',
		);

		$empty_file = array(
			'file_id' => null,
			'name'    => '',
			'size'    => null,
			'type'    => '',
		);

		$empty_file_2 = array(
			'file_id' => 123,
			'name'    => '',
			'size'    => null,
			'type'    => '',
		);
		$empty_file_3 = array(
			'file_id' => 123,
			'name'    => 'name',
			'size'    => null,
			'type'    => '',
		);

		$empty_file_4 = array(
			'file_id' => 123,
			'name'    => 'name',
			'size'    => 12345,
			'type'    => '',
		);

		$post_id = Utility::create_legacy_feedback(
			array(
				'1_file upload' => array(
					'field_id' => 'file_upload',
					'files'    => array( $file1, $empty_file, $empty_file_2, $empty_file_3, $empty_file_4, $file2 ),
				),
				'2_images'      => array(
					'field_id' => 'file_upload2',
					'files'    => array( $file2, $file1 ),
				),
				'3_docs'        => array(
					'field_id' => 'file_upload3',
					'files'    => array(),
				),
			)
		);

		$expected_legacy_values = array(
			$file1,
			$file2,
			$file2,
			$file1,
		);

		$response = Feedback::get( $post_id );
		$this->assertNotEmpty( $response->get_files(), 'Legacy file values should not be empty for the legacy feedback' );
		$this->assertEquals( $expected_legacy_values, $response->get_files(), 'Legacy extra values should match the expected extra values' );
	}

	public function test_get_files_empty() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'text'    => 'Test text',
				'email'   => 'john.smith@example.com',
				'email_2' => 'john.smith@example2.com',
				'website' => 'https://johnsmith.dev',
				'message' => 'Hello, this is a test message from our contact form.',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Text' type='text' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Email_2' type='email' required='1'/][contact-field label='Website' type='url' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertEmpty( $response->get_files(), 'Files should be empty for the form submission without file uploads' );
		$this->assertEmpty( $saved_response->get_files(), 'Files should be empty for the saved response without file uploads' );
	}

	public function test_get_files_valid() {
		// This is needed for the test to run correctly.
		add_filter( 'jetpack_forms_is_file_field_renderable', '__return_true' );

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'uploadafile' => array( '{"file_id":54321,"name":"Screenshot.png","size":19914,"type":"image/png"}', '{}' ),
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			'[contact-field type="file" label="Upload a file" /]'
		);

		$expected         = array(
			array(
				'file_id' => 54321,
				'name'    => 'Screenshot.png',
				'size'    => 19914,
				'type'    => 'image/png',
			),
		);
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertNotEmpty( $response->get_files(), 'Files should not be empty for the form submission with file uploads' );
		$this->assertNotEmpty( $saved_response->get_files(), 'Files should not be empty for the saved response with file uploads' );
		$this->assertEquals( $response->get_files(), $saved_response->get_files(), 'Files should match between the response and the saved response' );
		$this->assertEquals( $expected, $response->get_files(), 'Response files should match the expected files' );

		remove_filter( 'jetpack_forms_is_file_field_renderable', '__return_true' );
	}

	public function test_get_files_invalid() {
		// This is needed for the test to run correctly.
		add_filter( 'jetpack_forms_is_file_field_renderable', '__return_true' );

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'uploadafile'       => null,
				'uploadanotherfile' => array(),
				'uploademptyfile'   => array( '{}' ),
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			'[contact-field type="file" label="Upload a file" /][contact-field type="file" label="Upload another file" /][contact-field type="file" label="Upload empty file" /]'
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertEmpty( $response->get_files(), 'Files should not be empty for the form submission with file uploads' );
		$this->assertEmpty( $saved_response->get_files(), 'Files should not be empty for the saved response with file uploads' );

		remove_filter( 'jetpack_forms_is_file_field_renderable', '__return_true' );
	}

	public function test_validate_radio_form() {
		$name    = '';
		$email   = '';
		$form_id = Utility::get_form_id();

		// Create a form submission
		$_POST = Utility::get_post_request(
			array(
				'name'                 => $name,
				'email'                => $email,
				'choose'               => 'truth',
				'chooseoptions'        => 'hello  there',
				'chooseseveraloptions' => 'hello, there',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			'[contact-field label="Name" type="name" /][contact-field label="Email" type="email" /][contact-field label="Choose" type="radio" options="truth,dare" /][contact-field type="radio" label="Choose options" labelclasses="wp-block-jetpack-label" optionsclasses="wp-block-jetpack-options" options="hello  there,option 1,option 2" optionsdata="&#091;{&quot;label&quot;:&quot;hello  there&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 1&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 2&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#093;" stylevariationattributes="" stylevariationclasses="" stylevariationstyles="" fieldwrapperclasses="wp-block-jetpack-field-checkbox-multiple"]&lt;div&gt;


&lt;ul class=&quot;wp-block-jetpack-options&quot;&gt;



&lt;/ul&gt;
&lt;/div&gt;[/contact-field][contact-field type="radio" label="Choose several options" labelclasses="wp-block-jetpack-label" optionsclasses="wp-block-jetpack-options" options="hello, there,option 1,option 2" optionsdata="&#091;{&quot;label&quot;:&quot;hello&#044; there&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 1&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 2&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#093;" stylevariationattributes="" stylevariationclasses="" stylevariationstyles="" fieldwrapperclasses="wp-block-jetpack-field-checkbox-multiple"]&lt;div&gt;


&lt;ul class=&quot;wp-block-jetpack-options&quot;&gt;



&lt;/ul&gt;
&lt;/div&gt;[/contact-field]'
		);
		$form->validate();
		unset( $_POST ); // Clean up the global $_POST variable after the test.

		// message should be not empty.
		$this->assertFalse( $form->has_errors(), 'Form should not have errors after validation.' );

		Contact_Form::reset_errors();
	}

	public function test_get_field_by_id_and_value_by_id_new_submission() {
		$form_id    = Utility::get_form_id();
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'John Doe',
				'email'   => 'john@example.com',
				'message' => 'Hello!',
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

		$response  = Feedback::from_submission( $_post_data, $form );
		$field_ids = $form->get_field_ids();
		$email_id  = $field_ids['email'];

		$this->assertNotEmpty( $email_id );
		$this->assertEquals( 'john@example.com', $response->get_field_value_by_form_field_id( $email_id ) );

		$field = $response->get_field_by_form_field_id( $email_id );
		$this->assertInstanceOf( Feedback_Field::class, $field );
		$this->assertEquals( $email_id, $field->get_form_field_id() );

		// Save and reload; ensure the field id and value persist correctly
		$saved_post_id  = $response->save();
		$saved_response = Feedback::get( $saved_post_id );
		$this->assertEquals( 'john@example.com', $saved_response->get_field_value_by_form_field_id( $email_id ) );
		$saved_field = $saved_response->get_field_by_form_field_id( $email_id );
		$this->assertInstanceOf( Feedback_Field::class, $saved_field );
		$this->assertEquals( $email_id, $saved_field->get_form_field_id() );
	}

	public function test_get_field_by_id_and_value_by_id_legacy() {
		$post_id  = Utility::create_legacy_feedback( array() );
		$response = Feedback::get( $post_id );

		$this->assertSame( '', $response->get_field_value_by_form_field_id( 'email' ) );
		$this->assertNull( $response->get_field_by_form_field_id( 'email' ) );
	}

	public function test_edgecase_feedback_v2_missing_field_value() {
		// Post data with missing field value.
		$post_id = wp_insert_post(
			array(
				'post_type'      => Feedback::POST_TYPE,
				'post_title'     => 'Edgecase Feedback',
				'post_content'   => '{"subject":"[WR8DAR] Contact us!","entry_title":"Contact us!","entry_page":1,"fields":[{"key":"1_key label","label":"key label","value":"abcd","type":"name","meta":[],"form_field_id":"g124-keylabel"},{"key":"2_Awesome","label":"Awesome","type":"email","meta":[],"form_field_id":"g124-awesome"}]}',
				'post_status'    => 'publish',
				'post_mime_type' => 'v2',
			)
		);

		$response = Feedback::get( $post_id );
		$this->assertInstanceOf( Feedback::class, $response );
	}

	public function test_fix_malformed_json() {
		$test_cases_data = array(
			array(
				'key' => 'va"lu"e',
			),
			array(
				'key' => 'va"lu"e',
			),
			array(
				'key'  => array( 'hello', 'there ' ),
				'key1' => array( 'h "ell"o', "th'er'e " ),
			),
			array(
				'key'  => array( 'hello', 'there ' ),
				'key1' => array( 'h "ell"o', "th'er'e " ),
			),
			array(
				'key'  => array(),
				'key1' => array( 'h "ell"o', "th'er'e " ),
				'key5' => '',
				'key6' => 0,
				'key7' => null,
				'key8' => false,
				'key9' => true,
			),
			array(
				'key'  => array(),
				'key1' => array( 'h "ell"o', "th'er'e " ),
			),
			array(
				'key1' => array( 'simplevalue' => 'si "mplev " alue' ),
				'key2' => array( 'simplevalue' => 'simpl" eval ": ue' ),
			),
			array(
				'key1' => array(
					1,
					'asdasd',
					" asd'sad",
				),
				'key2' => array(
					'key2.1' => array( 'h "ell"o', "th'er'e " ),
					'key2.2' => array( 'h "ell"o', "th'er'e ", "hell'o", 123, null, true, false, array( 'how " dy' ), array( 'key' => 'va"lu"e' ) ),
				),
			),
		);
		foreach ( $test_cases_data as $case ) {
			$this->assertEquals( wp_json_encode( $case, JSON_UNESCAPED_SLASHES ), Feedback::fix_malformed_json( stripslashes( wp_json_encode( $case, JSON_UNESCAPED_SLASHES ) ) ) );
		}
	}

	public function test_edgecase_feedback_v2_missing_field_value_bad_json() {
		// Post data with missing field value.
		$post_id = wp_insert_post(
			array(
				'post_type'      => Feedback::POST_TYPE,
				'post_title'     => 'Edgecase Feedback',
				'post_content'   => '{"subject":"[WR8DAR] "Contact" us!","entry_title":"Contact us!","entry_page":1,"fields":[{"key":"1_key label","label":"key label","value":["Nov 25", "2pm "Save Our Stories" with Sandy Simmelink"],"type":"checkbox-multiple","meta":[],"form_field_id":"g124-keylabel"},{"key":"2_Awesome","label":"Awesome","type":"email","meta":[],"form_field_id":"g124-awesome"}]}',
				'post_status'    => 'publish',
				'post_mime_type' => 'v2',
			)
		);

		$response = Feedback::get( $post_id );
		$this->assertInstanceOf( Feedback::class, $response );
		$this->assertSame( '[WR8DAR] "Contact" us!', $response->get_subject() );
		$this->assertSame( 'Nov 25, 2pm "Save Our Stories" with Sandy Simmelink', $response->get_field_value_by_label( 'key label' ) );
	}

	/**
	 * Test that new lines are not stripped from the field value.
	 */
	public function test_new_lines_dont_get_stripped() {
		$form_id          = Utility::get_form_id();
		$content          = 'Hello, this is a' . PHP_EOL . ' test message from our contact form.';
		$expected_content = $content;

		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'message' => $content,
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Message' type='textarea' required='1'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertTrue( str_contains( get_post( $feedback_post_id )->post_content, '\\n' ) ); // Double escaped PHP_EOL
		$this->assertEquals( $expected_content, $response->get_field_value_by_label( 'Message' ), 'Field value should match the original content for the form submission when new lines are present' );
		$this->assertEquals( $expected_content, $saved_response->get_field_value_by_label( 'Message' ), 'Field value should match the original content for the saved response when new lines are present' );
	}

	/**
	 * Test that new lines are not stripped from the field value.
	 */
	public function test_new_lines_dont_get_stripped_when_addslashes() {
		$form_id          = Utility::get_form_id();
		$content          = addslashes( 'Hello, this is a' . PHP_EOL . ' test message from our contact form.' );
		$expected_content = stripslashes( $content );

		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'message' => $content,
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Message' type='textarea' required='1'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertTrue( str_contains( get_post( $feedback_post_id )->post_content, '\\n' ) ); // Double escaped PHP_EOL
		$this->assertEquals( $expected_content, $response->get_field_value_by_label( 'Message' ), 'Field value should match the original content for the form submission when new lines are present' );
		$this->assertEquals( $expected_content, $saved_response->get_field_value_by_label( 'Message' ), 'Field value should match the original content for the saved response when new lines are present' );
	}

	public function test_escape_legacy_special_characters_handeling() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'special' => 'こんにちは世界',
				'message' => '🙈',
			)
		);

		$response = Feedback::get( $post_id );

		$this->assertEquals( 'こんにちは世界', $response->get_field_value_by_label( 'special' ), 'Special field value should match' );
		$this->assertEquals( '🙈', $response->get_field_value_by_label( 'message' ), 'Message field value should match' );
	}

	public function test_escape_legacy_special_characters_handeling_strip_new_lines() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'special' => 'こんにちは世界',
				'message' => '🙈',
			),
			null,
			null,
			null,
			null,
			null,
			null,
			'publish',
			true // strip new lines.
		);

		$response = Feedback::get( $post_id );

		$this->assertStringNotContainsString( "\nJSON_DATA", get_post( $post_id )->post_content );

		$this->assertEquals( 'こんにちは世界', $response->get_field_value_by_label( 'special' ), 'Special field value should match' );
		$this->assertEquals( '🙈', $response->get_field_value_by_label( 'message' ), 'Message field value should match' );
	}

	public function test_bad_feedback_data_does_not_produce_warnings() {
		$post_id  = wp_insert_post(
			array(
				'post_type'    => Feedback::POST_TYPE,
				'post_title'   => 'Bad Feedback',
				'post_content' => 'junk data',
				'post_status'  => 'publish',
			)
		);
		$response = Feedback::get( $post_id );
		$this->assertInstanceOf( Feedback::class, $response );
	}

	public function test_bad_feedback_data_does_not_produce_warnings_bad_data() {
		$post_id  = wp_insert_post(
			array(
				'post_type'    => Feedback::POST_TYPE,
				'post_title'   => 'Bad Feedback JSON_DATA Bad Feedback',
				'post_content' => 'junk data',
				'post_status'  => 'publish',
			)
		);
		$response = Feedback::get( $post_id );
		$this->assertInstanceOf( Feedback::class, $response );
	}

	public function test_escape_legacy_v2_special_characters_handeling() {
		$post_id = Utility::create_legacy_feedback_v2(
			array(
				'Special こんにちは世界' => 'こんにちは世界',
				'Message'         => '🙈',
			)
		);

		$post_object = get_post( $post_id );
		$this->assertTrue( str_contains( $post_object->post_content, 'ud83dude48' ) ); // ud83dude48 => 🙈 withouth the /

		$response = Feedback::get( $post_id );

		$this->assertEquals( 'こんにちは世界', $response->get_field_value_by_label( 'Special こんにちは世界' ), 'Special field value should match' );
		$this->assertEquals( '🙈', $response->get_field_value_by_label( 'Message' ), 'Message field value should match' );
	}

	public function test_special_characters_handling() {
		$form_id = Utility::get_form_id();

		$_post_data = Utility::get_post_request(
			array(
				'special' => 'こんにちは世界',
				'message' => '🙈',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Special' type='text' required='1'/]"
			. "[contact-field label='Message' type='textarea'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		$this->assertEquals( 'こんにちは世界', $response->get_field_value_by_label( 'Special' ), 'Special field value should match' );
		$this->assertEquals( '🙈', $response->get_field_value_by_label( 'Message' ), 'Message field value should match' );

		$this->assertEquals( 'こんにちは世界', $saved_response->get_field_value_by_label( 'Special' ), 'Special field value should match saved value' );
		$this->assertEquals( '🙈', $saved_response->get_field_value_by_label( 'Message' ), 'Message field value should match saved value' );
	}

	public function test_mark_as_read() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'Test User',
				'email' => 'test@example.com',
			),
			'Test message',
			'Test User',
			'test@example.com',
			'',
			'',
			'Test Subject',
			'spam',
			null,
			true // is_unread
		);

		$feedback = Feedback::get( $post_id );
		$this->assertTrue( $feedback->is_unread(), 'Feedback should start as unread' );

		$result = $feedback->mark_as_read();
		$this->assertTrue( $result, 'mark_as_read should return true on success' );
		$this->assertFalse( $feedback->is_unread(), 'Feedback should be marked as read' );

		// Then mark as unread
		$result = $feedback->mark_as_unread();
		$this->assertTrue( $result, 'mark_as_unread should return true on success' );
		$this->assertTrue( $feedback->is_unread(), 'Feedback should be marked as unread' );
	}

	public function test_mark_as_read_without_post_id() {
		$form     = new Contact_Form( array() );
		$response = Feedback::from_submission( array(), $form );
		$response->save();

		// Should return false if not saved yet (no post_id)
		$result = $response->mark_as_read();
		$this->assertFalse( $result, 'mark_as_read should return false when post_id is not set' );
	}

	public function test_mark_as_unread_without_post_id() {
		$form     = new Contact_Form( array() );
		$response = Feedback::from_submission( array(), $form );

		// Should return false if not saved yet (no post_id)
		$result = $response->mark_as_unread();
		$this->assertFalse( $result, 'mark_as_unread should return false when post_id is not set' );
	}

	public function test_unread_status_uses_constants() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'Test User',
				'email' => 'test@example.com',
			),
			'Test message',
			'Test User',
			'test@example.com',
			'',
			'',
			'Test Subject',
			'spam',
			null,
			true // unread
		);

		$feedback = Feedback::get( $post_id );

		// Check the comment_status field directly
		$post = get_post( $post_id );
		$this->assertEquals( 'open', $post->comment_status, 'Unread feedback should have comment_status = open' );

		$feedback->mark_as_read();
		$post = get_post( $post_id );
		$this->assertEquals( 'closed', $post->comment_status, 'Read feedback should have comment_status = closed' );

		$feedback->mark_as_unread();
		$post = get_post( $post_id );
		$this->assertEquals( 'open', $post->comment_status, 'Unread feedback should have comment_status = open' );
	}

	public function test_mark_as_read_db_failure() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'Test User',
				'email' => 'test@example.com',
			),
			'Test message',
			'Test User',
			'test@example.com',
			'',
			'',
			'Test Subject',
			'spam',
			null,
			true // unread
		);

		$feedback = Feedback::get( $post_id );

		// Simulate DB error
		add_filter( 'wp_checkdate', '__return_false' );
		$result = $feedback->mark_as_read();
		remove_filter( 'wp_checkdate', '__return_false' );

		$this->assertFalse( $result, 'mark_as_read should return false on DB failure' );
		$this->assertTrue( $feedback->is_unread(), 'Feedback should remain unread' );
	}

	public function test_mark_as_unread_db_failure() {
		$post_id = Utility::create_legacy_feedback(
			array(
				'name'  => 'Test User',
				'email' => 'test@example.com',
			),
			'Test message',
			'Test User',
			'test@example.com',
			'',
			'',
			'Test Subject',
			'spam',
			null,
			false // unread
		);

		$feedback = Feedback::get( $post_id );

		// Simulate DB error
		add_filter( 'wp_checkdate', '__return_false' );
		$result = $feedback->mark_as_unread();
		remove_filter( 'wp_checkdate', '__return_false' );

		$this->assertFalse( $result, 'mark_as_unread should return false on DB failure' );
		$this->assertFalse( $feedback->is_unread(), 'Feedback should remain read' );
	}

	/**
	 * Test that notification recipients are stored and retrieved correctly.
	 *
	 * @since 6.10.0
	 */
	public function test_notification_recipients_handling() {
		// Create valid users with edit capabilities
		$user_id_1 = wp_insert_user(
			array(
				'user_login' => 'test_user_1',
				'user_email' => 'user1@example.com',
				'user_pass'  => 'password123',
				'role'       => 'editor',
			)
		);

		$user_id_2 = wp_insert_user(
			array(
				'user_login' => 'test_user_2',
				'user_email' => 'user2@example.com',
				'user_pass'  => 'password123',
				'role'       => 'editor',
			)
		);

		$form_id    = Utility::get_form_id();
		$_post_data = Utility::get_post_request(
			array(
				'message' => '🙈',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'                  => 'Test Form',
				'description'            => 'This is a test form.',
				'notificationRecipients' => array( (string) $user_id_1, (string) $user_id_2 ),
			),
			"[contact-field label='Message' type='textarea'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form );
		$this->assertEquals( array( (string) $user_id_1, (string) $user_id_2 ), $response->get_notification_recipients(), 'Notification recipients should match for form submission' );
		$feedback_post_id = $response->save();

		// Check that the saved response returns the same thing.
		$saved_response = Feedback::get( $feedback_post_id );
		$this->assertEquals( array( (string) $user_id_1, (string) $user_id_2 ), $saved_response->get_notification_recipients(), 'Notification recipients should match for saved response' );

		// Clean up
		wp_delete_user( $user_id_1 );
		wp_delete_user( $user_id_2 );
	}

	/**
	 * Test that notification recipients default to empty array when not set.
	 *
	 * @since 6.10.0
	 */
	public function test_notification_recipients_default_empty() {
		$form_id    = Utility::get_form_id();
		$_post_data = Utility::get_post_request(
			array(
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"[contact-field label='Message' type='textarea'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form );
		$this->assertEquals( array(), $response->get_notification_recipients(), 'Notification recipients should default to empty array' );
		$feedback_post_id = $response->save();

		// Check that the saved response returns the same thing.
		$saved_response = Feedback::get( $feedback_post_id );
		$this->assertEquals( array(), $saved_response->get_notification_recipients(), 'Saved notification recipients should default to empty array' );
	}

	/**
	 * Test that notification recipients validates user capabilities.
	 *
	 * @since 6.10.0
	 */
	public function test_notification_recipients_validates_capabilities() {
		// Create users with different capabilities
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'admin_user',
				'user_email' => 'admin@example.com',
				'user_pass'  => 'password123',
				'role'       => 'administrator',
			)
		);

		$editor_id = wp_insert_user(
			array(
				'user_login' => 'editor_user',
				'user_email' => 'editor@example.com',
				'user_pass'  => 'password123',
				'role'       => 'editor',
			)
		);

		$author_id = wp_insert_user(
			array(
				'user_login' => 'author_user',
				'user_email' => 'author@example.com',
				'user_pass'  => 'password123',
				'role'       => 'author',
			)
		);

		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'subscriber_user',
				'user_email' => 'subscriber@example.com',
				'user_pass'  => 'password123',
				'role'       => 'subscriber',
			)
		);

		$form_id    = Utility::get_form_id();
		$_post_data = Utility::get_post_request(
			array(
				'message' => 'Test message',
			),
			'g' . $form_id
		);

		// Include admin, editor, author, subscriber, and a non-existent user ID
		$form = new Contact_Form(
			array(
				'title'                  => 'Test Form',
				'description'            => 'This is a test form.',
				'notificationRecipients' => array(
					(string) $admin_id,
					(string) $editor_id,
					(string) $author_id,
					(string) $subscriber_id,
					'999999', // Non-existent user
				),
			),
			"[contact-field label='Message' type='textarea'/]"
		);

		$response = Feedback::from_submission( $_post_data, $form );

		// Only admin, editor, and author should be included (they have edit_posts capability)
		// Subscriber and non-existent user should be filtered out
		$expected_recipients = array(
			(string) $admin_id,
			(string) $editor_id,
			(string) $author_id,
		);

		$this->assertEquals( $expected_recipients, $response->get_notification_recipients(), 'Only users with edit capabilities should be included' );

		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );
		$this->assertEquals( $expected_recipients, $saved_response->get_notification_recipients(), 'Saved response should maintain validated recipients' );

		// Clean up
		wp_delete_user( $admin_id );
		wp_delete_user( $editor_id );
		wp_delete_user( $author_id );
		wp_delete_user( $subscriber_id );
	}

	/**
	 * Test that country flags are returned correctly.
	 */
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

	/**
	 * Minimal: submission with first-name/last-name sets author name and first/last getters.
	 */
	public function test_author_first_last_on_submission() {
		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"
			[contact-field label='First name' type='name' id='first-name'/]
			[contact-field label='Last name' type='name' id='last-name'/]
			[contact-field label='Email' type='email' id='email'/]
			"
		);

		$post_data = array(
			'first-name' => 'Jane',
			'last-name'  => 'Doe',
			'email'      => 'jane@example.com',
		);

		$response = Feedback::from_submission( $post_data, $form );

		$this->assertEquals( 'Jane Doe', $response->get_author_name(), 'Author name should combine first and last' );
		$this->assertSame( 'Jane', $response->get_author_first_name(), 'First name getter should return raw first name' );
		$this->assertSame( 'Doe', $response->get_author_last_name(), 'Last name getter should return raw last name' );
	}
}
