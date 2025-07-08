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
use WorDBless\BaseTestCase;

/**
 * Test class for Contact_Form
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Form_Response
 */
#[CoversClass( Form_Response::class )]
class Form_Response_Test extends BaseTestCase {

	public function test_from_post_id_returns_null_for_invalid_post() {
		$response = Form_Response::get( 999999 );
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
		$response = Form_Response::get( $post_id );
		$this->assertInstanceOf( Form_Response::class, $response );
	}

	public function test_from_submission_sets_fields_and_post_data() {
		$form      = new Contact_Form( array() );
		$post_data = array(
			'name'    => 'John Doe',
			'email'   => 'john@example.com',
			'message' => 'Hello!',
			'ignore'  => 'should not be included',
		);
		$response  = Form_Response::from_submission( $post_data, $form );
		$this->assertInstanceOf( Form_Response::class, $response );
	}

	public function test_form_response_is_matches_empty_data() {
		$form      = new Contact_Form( array() );
		$post_data = array();
		$response  = Form_Response::from_submission( $post_data, $form );
		$post_id   = $response->save();

		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $response->serialize(), $post_response->serialize() );
		$this->assertEquals( $response->get_fields(), $post_response->get_fields() );
	}

	public function test_form_response_is_matches_submission_data() {
		$name    = 'John Doe';
		$email   = 'john@example.com';
		$message = 'Test message';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response = Form_Response::from_submission( $post_data, $form );
		$post_id  = $response->save();

		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $response->serialize(), $post_response->serialize() );
		$this->assertEquals( $response->get_fields(), $post_response->get_fields() );

		foreach ( $response->get_fields() as $field ) {
			$this->assertInstanceOf( Response_Field::class, $field );
		}

		foreach ( $post_response->get_fields() as $field ) {
			$this->assertInstanceOf( Response_Field::class, $field );
		}

		foreach ( $post_response->get_fields() as $field_key => $field ) {
			$this->assertEquals( $response->get_fields()[ $field_key ]->serialize(), $post_response->get_fields()[ $field_key ]->serialize(), 'Serialized response field should match' );
		}

		$this->assertEquals( $name, $response->get_fields()['1_Name']->get_value(), 'Response field value should match' );
		$this->assertEquals( $name, $post_response->get_fields()['1_Name']->get_value(), 'Saved response field value should match' );

		$this->assertEquals( 'Name', $response->get_fields()['1_Name']->get_label(), 'Name response field label should match' );
		$this->assertEquals( 'Name', $post_response->get_fields()['1_Name']->get_label(), 'Saved response field label should match' );
		$this->assertEquals( 'name', $response->get_fields()['1_Name']->get_type(), 'Response field type should match' );
		$this->assertEquals( 'name', $post_response->get_fields()['1_Name']->get_type(), 'Saved response type value should match' );

		$this->assertEquals( $email, $response->get_fields()['2_Email']->get_value(), 'Response field value should match' );
		$this->assertEquals( $email, $post_response->get_fields()['2_Email']->get_value(), 'Saved response field value should match' );

		$this->assertEquals( $message, $response->get_fields()['3_Message']->get_value(), 'Response field value should match' );
		$this->assertEquals( $message, $post_response->get_fields()['3_Message']->get_value(), 'Saved Name response field value should match ' );
	}

	/**
	 * Test that a previously saved response can be handled correctly.
	 *
	 * This test checks if the Form_Response class can retrieve and handle
	 * a response that was saved in the legacy format.
	 */
	public function test_handle_previously_saved_response() {

		$post_id = Utility::create_legacy_feedback(
			array(
				'1_field' => 'value1',
				'2_field' => 'value2',
			)
		);

		$response = Form_Response::get( $post_id );

		$this->assertInstanceOf( Form_Response::class, $response );

		$field = $response->get_fields()['1_field'];

		$this->assertInstanceOf( Response_Field::class, $field );
		$this->assertEquals( '1_field', $field->get_key() );
		$this->assertEquals( 'value1', $field->render_value() );
		$this->assertEquals( 'value1', $field->render_value() );
		$this->assertEquals( 'basic', $field->get_type() ); // Assuming 'basic' is the default type for a simple text field.
	}
	/**
	 * Tests that the feedback ID is computed correctly when saving a from response.
	 *
	 * It should be non empty and match the post slug.
	 */
	public function test_form_response_computed_feedback_id() {
		$name    = 'John Doe';
		$email   = 'john@example.com';
		$message = 'Test message';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response = Form_Response::from_submission( $post_data, $form );
		$post_id  = $response->save();
		$post     = get_post( $post_id );

		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $response->get_feedback_id(), $post_response->get_feedback_id(), 'Feedback ID should match' );
		$this->assertEquals( $post->post_name, $post_response->get_feedback_id(), 'Feedback ID should match post slug' );
		$this->assertNotEmpty( $post_response->get_feedback_id(), 'Feedback ID should not be empty' );
	}

	/**
	 * Test the IP address is included in the serialized response.
	 * It should be always available when the reponse is created during the form submission.
	 *
	 * It should only be empty if the response that has the filter applied to it.
	 */
	public function test_ip_address_included_in_serialized_response() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		// The IP address should be present.
		$this->assertNotEmpty( $response->get_ip_address(), 'IP address should not be empty' );
		$this->assertNotEmpty( $post_response->get_ip_address(), 'IP address should not be empty' );
		$this->assertEquals( $response->get_ip_address(), $post_response->get_ip_address(), 'IP address should match' );

		add_filter( 'jetpack_contact_form_forget_ip_address', '__return_true' );
		$new_post_id = $response->save();
		remove_filter( 'jetpack_contact_form_forget_ip_address', '__return_true' );

		// The IP address should NOT be present.
		$post_response = Form_Response::get( $new_post_id );
		$this->assertEmpty( $post_response->get_ip_address(), 'IP address should BE empty' );
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

		$post_response = Form_Response::get( $post_id );
		$this->assertEquals( $ip, $post_response->get_ip_address(), 'IP should match the legacy feedback  IP' );
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

		$post_response = Form_Response::get( $post_id );
		$this->assertEquals( $subject, $post_response->get_subject(), 'Subject should match the legacy feedback post subject' );
	}

	/**
	 * Test the subject line is computed correctly.
	 */
	public function test_computed_form_subject() {
		$subject = 'Test Subject';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $subject, $response->get_subject(), 'Subject should match the form submission' );
		$this->assertEquals( $subject, $post_response->get_subject(), 'Subject should match the saved form submission' );
	}

	/**
	 * Test the subject line is computed via field
	 */
	public function test_computed_form_subject_field() {
		$subject = 'Test Subject';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $subject, $response->get_subject(), 'Subject should match the form submission' );
		$this->assertEquals( $subject, $post_response->get_subject(), 'Subject should match the saved form submission' );
	}

	/**
	 * Test the subject line is computed correctly when both a subject attribute and a field is present.
	 */
	public function test_computed_form_subject_field_overwrites() {
		$subject = 'Test Subject';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $subject, $response->get_subject(), 'Subject should match the form submission' );
		$this->assertEquals( $subject, $post_response->get_subject(), 'Subject should match the saved form submission' );
	}

	/**
	 * Test the subject line is computed correctly and the filter is applied correctly.
	 */
	public function test_computed_form_subject_field_overwrites_filter() {
		$subject = 'Test Subject';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response = Form_Response::from_submission( $post_data, $form );
		$post_id  = $response->save();
		remove_filter( 'contact_form_subject', array( $this, 'subject_from_filter' ), 10, 2 );
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( 'Overwritten Subject (from filter)', $response->get_subject(), 'Subject should match the form submission' );
		$this->assertEquals( 'Overwritten Subject (from filter)', $post_response->get_subject(), 'Subject should match the saved form submission' );
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

		$post_response = Form_Response::get( $post_id );
		$this->assertEquals( $author, $post_response->get_author(), 'Author should match the legacy feedback post author' );
	}

	public function test_computed_name() {
		$author = 'Mikey Mouse';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $author, $response->get_author(), 'Author should match the form submission' );
		$this->assertEquals( $author, $post_response->get_author(), 'Author should match the saved form submission' );
	}

	public function test_computed_name_as_email() {
		$author = ''; // author is empty
		$email  = 'email@email.com';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $email, $response->get_author(), 'Author should match the form submission' );
		$this->assertEquals( $email, $post_response->get_author(), 'Author should match the saved form submission' );
	}

	public function test_computed_name_filter() {
		$author = 'Mikey Mouse';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response = Form_Response::from_submission( $post_data, $form );
		remove_filter( 'pre_comment_author_name', array( $this, 'set_filter_as_string' ) );

		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( 'STRING', $response->get_author(), 'Author should match the form submission' );
		$this->assertEquals( 'STRING', $post_response->get_author(), 'Author should match the saved form submission' );
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

		$post_response = Form_Response::get( $post_id );
		$this->assertEquals( $email, $post_response->get_author_email(), 'Author email should match the legacy feedback post author email' );
	}

	public function test_computed_email() {

		$email   = 'email@email.com';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $email, $response->get_author_email(), 'Author email should match the form submission' );
		$this->assertEquals( $email, $post_response->get_author_email(), 'Author email should match the saved form submission' );
	}

	public function test_computed_email_filter() {
		$email = 'email@email.com';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response = Form_Response::from_submission( $post_data, $form );
		remove_filter( 'pre_comment_author_email', array( $this, 'set_filter_as_string' ) );

		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( 'STRING', $response->get_author_email(), 'Author email should match the form submission' );
		$this->assertEquals( 'STRING', $post_response->get_author_email(), 'Author email should match the saved form submission' );
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

		$post_response = Form_Response::get( $post_id );
		$this->assertEquals( $url, $post_response->get_author_url(), 'Author url should match the legacy feedback post author url' );
	}

	public function test_computed_url() {
		$url = 'https://wordpress.com';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $url, $response->get_author_url(), 'Author url should match the form submission' );
		$this->assertEquals( $url, $post_response->get_author_url(), 'Author url should match the saved form submission' );
	}

	public function test_computed_url_filter() {
		$url     = 'https://wordpress.com';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response = Form_Response::from_submission( $post_data, $form );
		remove_filter( 'pre_comment_author_url', array( $this, 'set_filter_as_string' ) );

		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( 'STRING', $response->get_author_url(), 'Author url should match the form submission' );
		$this->assertEquals( 'STRING', $post_response->get_author_url(), 'Author url should match the saved form submission' );
	}

	public function test_computed_comment_content_for_legacy() {
		$content = 'Some comment content!';
		$post_id = Utility::create_legacy_feedback(
			array(),
			$content
		);

		$post_response = Form_Response::get( $post_id );
		$this->assertEquals( $content, $post_response->get_comment_content(), 'Comment content should match the legacy feedback post author url' );
	}

	public function test_computed_comment_content() {
		$content = 'Some comment content!';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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
		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $content, $response->get_comment_content(), 'Comment content should match the form submission' );
		$this->assertEquals( $content, $post_response->get_comment_content(), 'Comment content should match the saved form submission' );
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

		$post_response = Form_Response::get( $post_id );
		$this->assertEquals( $status, $post_response->get_status(), 'Status should match the legacy feedback status' );
	}

	public function test_computed_status() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( 'publish', $response->get_status(), 'Status should match the form submission' );
		$this->assertEquals( 'publish', $post_response->get_status(), 'Status should match the saved form submission' );
	}

	public function test_set_status() {
		$status  = 'trash';
		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response = Form_Response::from_submission( $post_data, $form );
		$response->set_status( $status );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );

		$this->assertEquals( $status, $response->get_status(), 'Status should match the form submission' );
		$this->assertEquals( $status, $post_response->get_status(), 'Status should match the saved form submission' );
	}

	public function test_consent() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );
		$this->assertTrue( $response->has_consent(), 'Has consent should match the form submission' );
		$this->assertTrue( $post_response->has_consent(), 'Has consent should match the saved form submission' );
	}

	public function test_empty_consent() {

		$form_id = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response      = Form_Response::from_submission( $post_data, $form );
		$post_id       = $response->save();
		$post_response = Form_Response::get( $post_id );
		$this->assertFalse( $response->has_consent(), 'Has consent should match the form submission' );
		$this->assertFalse( $post_response->has_consent(), 'Has consent should match the saved form submission' );
	}

	/**
	 * Helper function for creating the post context.
	 * This is helpful for testing the post context.
	 **/
	private function create_post_context() {
		$author_id = wp_insert_user(
			array(
				'user_email' => 'john@example.com',
				'user_login' => 'test_user',
				'user_pass'  => 'abc123',
			)
		);

		$post_id = wp_insert_post(
			array(
				'post_title'   => 'POST TITLE ' . microtime(),
				'post_content' => 'POST CONTENT',
				'post_status'  => 'publish',
				'post_author'  => $author_id,
			),
			true
		);

		global $post;
		$post = get_post( $post_id );
		return $post;
	}

	/**
	 * Helper function for destroying the post context.
	 * This is helpful cleaning up the post context after the test.
	 **/
	private function destroy_post_context() {
		global $post;
		if ( $post ) {
			wp_delete_user( $post->post_author, true );
			wp_delete_post( $post->ID, true );
			$post = null;
		}
	}

	public function test_compute_entry_ID_legacy() {
		$current_post = $this->create_post_context();
		$post_id      = Utility::create_legacy_feedback();
		$this->destroy_post_context();

		$post_response = Form_Response::get( $post_id );
		$this->assertEquals( $current_post->ID, $post_response->get_entry_id(), 'Entry_ID should match the saved form submission' );
	}

	public function test_compute_entry_ID() {
		$current_post = $this->create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response = Form_Response::from_submission( $post_data, $form, $current_post );
		$post_id  = $response->save();
		$this->destroy_post_context();

		$post_response = Form_Response::get( $post_id );
		$this->assertEquals( $current_post->ID, $response->get_entry_id(), 'Entry_ID should match the form submission' );
		$this->assertEquals( $current_post->ID, $post_response->get_entry_id(), 'Entry_ID should match the saved form submission' );
	}

	public function test_compute_entry_title() {
		$current_post = $this->create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response = Form_Response::from_submission( $post_data, $form, $current_post );
		$post_id  = $response->save();

		$post_response = Form_Response::get( $post_id );
		$this->destroy_post_context();

		$this->assertEquals( $current_post->post_title, $response->get_entry_title(), 'Post title should match the form submission' );
		$this->assertEquals( $current_post->post_title, $post_response->get_entry_title(), 'Post title should match the saved form submission' );
	}

	public function test_compute_entry_title_updated() {
		$current_post = $this->create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response = Form_Response::from_submission( $post_data, $form, $current_post );
		$post_id  = $response->save();

		// Update the post title to simulate an update.
		$update_title = 'Updated Title';
		wp_update_post(
			array(
				'ID'         => $current_post->ID,
				'post_title' => $update_title,
			)
		);

		$post_response = Form_Response::get( $post_id );
		$this->destroy_post_context();

		$this->assertEquals( $update_title, $post_response->get_entry_title(), 'Post Title should match the new updated title saved form submission' );
	}

	public function test_compute_entry_title_deleted() {
		$current_post = $this->create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response = Form_Response::from_submission( $post_data, $form, $current_post );
		$post_id  = $response->save();
		$this->destroy_post_context();

		$this->assertSame( '', get_the_title( $current_post->ID ), 'Post title should not be available after the post is deleted' );
		// At this point we should have a deleted post.
		$post_response = Form_Response::get( $post_id );

		$this->assertNotEmpty( $post_response->get_entry_title(), 'Post Title should NOT be empty after the post is deleted' );
		$this->assertEquals( $current_post->post_title, $post_response->get_entry_title(), 'Post Title should match the saved form submission Original post title' );
	}

	public function test_compute_entry_permalink() {
		$current_post = $this->create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response = Form_Response::from_submission( $post_data, $form, $current_post );
		$post_id  = $response->save();

		$post_response = Form_Response::get( $post_id );
		$this->destroy_post_context();
		$current_permalink = get_the_permalink( $current_post );
		$this->assertEquals( $current_permalink, $response->get_entry_permalink(), 'Post permalink should match the form submission' );

		$this->assertEquals( $current_permalink, $post_response->get_entry_permalink(), 'Post permalink should match the saved form submission' );
	}

	public function test_compute_entry_permalink_deleted_post() {
		$current_post = $this->create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response = Form_Response::from_submission( $post_data, $form, $current_post );
		$post_id  = $response->save();
		$this->destroy_post_context(); // Destroy the post context to simulate a deleted post.
		$post_response = Form_Response::get( $post_id );
		$this->assertEmpty( $post_response->get_entry_permalink(), 'Post permalink should match the form submission' );
	}

	public function test_compute_entry_permalink_with_page_number() {
		$current_post = $this->create_post_context();
		$form_id      = Utility::get_form_id();
		// Create a form submission
		$post_data = Utility::get_post_request(
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

		$response = Form_Response::from_submission( $post_data, $form, $current_post, 999 );
		$post_id  = $response->save();

		$post_response = Form_Response::get( $post_id );
		$this->destroy_post_context();

		$this->assertStringContainsString( 'page=999', $response->get_entry_permalink(), 'Post permalink should match the form submission' );
		$this->assertStringContainsString( 'page=999', $post_response->get_entry_permalink(), 'Post permalink should match the saved form submission' );
	}
}
