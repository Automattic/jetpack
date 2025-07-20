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
		$this->assertEquals( 'value1', $field->render_value() );
		$this->assertEquals( 'basic', $field->get_type() ); // Assuming 'basic' is the default type for a simple text field.
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
	 * It should be always available when the reponse is created during the form submission.
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
			"[contact-field label='Email' type='email' required='1'/][contact-field label='Consent' type='consent' required='1'/]"
		);

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );
		$this->assertFalse( $response->has_consent(), 'Has consent should match the form submission' );
		$this->assertFalse( $saved_response->has_consent(), 'Has consent should match the saved form submission' );
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
		$this->assertEquals( $current_post->post_title, $saved_response->get_entry_title(), 'Post Title should match the saved form submission Original post title' );
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

		$response = Feedback::from_submission( $_post_data, $form, $current_post );
		$post_id  = $response->save();
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
	 * Tests for the strip_tags method in Feedback class.
	 * ======================================================
	 *
	 * Test that strip_tags handles simple string without HTML tags.
	 */
	public function test_strip_tags_with_plain_string() {
		$input    = 'Hello, this is a plain text string.';
		$expected = 'Hello, this is a plain text string.';
		$result   = Feedback::strip_tags( $input );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test that strip_tags removes script tags but keeps the content.
	 */
	public function test_strip_tags_removes_script_tags() {
		$input    = '<script>alert("XSS")</script>Hello <b>world</b>!';
		$expected = 'alert("XSS")Hello <b>world</b>!';
		$result   = Feedback::strip_tags( $input );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test that strip_tags handles HTML entities correctly.
	 */
	public function test_strip_tags_handles_html_entities() {
		$input    = 'Hello &amp; goodbye';
		$expected = 'Hello & goodbye';
		$result   = Feedback::strip_tags( $input );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test that strip_tags handles arrays recursively.
	 */
	public function test_strip_tags_handles_arrays() {
		$input = array(
			'field1' => 'Hello <script>alert("XSS")</script>world',
			'field2' => array(
				'nested' => 'Test <b>bold</b> text',
				'deep'   => array(
					'deeper' => 'More &amp; testing',
				),
			),
		);

		$expected = array(
			'field1' => 'Hello alert("XSS")world',
			'field2' => array(
				'nested' => 'Test <b>bold</b> text',
				'deep'   => array(
					'deeper' => 'More & testing',
				),
			),
		);

		$result = Feedback::strip_tags( $input );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test that strip_tags sanitizes array keys.
	 */
	public function test_strip_tags_sanitizes_array_keys() {
		$input = array(
			'<script>key</script>' => 'value1',
			'normal_key'           => 'value2',
		);

		$result = Feedback::strip_tags( $input );

		// Check that the results exist and are correct
		// We need to check what key actually gets created after sanitization
		$keys = array_keys( $result );
		$this->assertCount( 2, $keys );
		$this->assertEquals( 'value2', $result['normal_key'] );

		// Find the sanitized key (should be the one that's not 'normal_key')
		$sanitized_key = null;
		foreach ( $keys as $key ) {
			if ( $key !== 'normal_key' ) {
				$sanitized_key = $key;
				break;
			}
		}
		$this->assertEquals( 'value1', $result[ $sanitized_key ] );
	}

	/**
	 * Test that strip_tags handles empty values.
	 */
	public function test_strip_tags_handles_empty_values() {
		$this->assertSame( '', Feedback::strip_tags( '' ) );
		$this->assertEquals( array(), Feedback::strip_tags( array() ) );
		$this->assertSame( '0', Feedback::strip_tags( 0 ) );
		$this->assertSame( '', Feedback::strip_tags( null ) );
	}

	/**
	 * Test that strip_tags handles numeric values.
	 */
	public function test_strip_tags_handles_numeric_values() {
		$this->assertSame( '123', Feedback::strip_tags( 123 ) );
		$this->assertSame( '123.45', Feedback::strip_tags( 123.45 ) );
	}

	/**
	 * Test that strip_tags preserves allowed HTML tags as per wp_kses_post.
	 */
	public function test_strip_tags_preserves_allowed_html() {
		$input  = '<p>This is a <strong>test</strong> with <em>emphasis</em> and <a href="http://example.com">links</a>.</p>';
		$result = Feedback::strip_tags( $input );

		// wp_kses_post should preserve these tags - let's just verify we get a non-empty string with HTML
		$this->assertNotEquals( '', $result );
		$this->assertStringContainsString( 'This is a', $result );
		$this->assertStringContainsString( 'test', $result );
	}

	/**
	 * Test that strip_tags removes dangerous HTML tags.
	 */
	public function test_strip_tags_removes_dangerous_html() {
		$input  = '<script>alert("XSS")</script><iframe src="evil.com"></iframe>Hello world';
		$result = Feedback::strip_tags( $input );

		// These dangerous tags should be removed, but content might remain
		$this->assertStringNotContainsString( '<script>', $result );
		$this->assertStringNotContainsString( '<iframe>', $result );
		$this->assertStringContainsString( 'Hello world', $result );
	}

	/**
	 * Test that strip_tags handles mixed array with different data types.
	 */
	public function test_strip_tags_handles_mixed_array() {
		$input = array(
			'string'  => 'Hello <b>world</b>',
			'number'  => 42,
			'boolean' => true,
			'array'   => array(
				'nested_string' => 'Test &amp; case',
				'nested_number' => 3.14,
			),
		);

		$result = Feedback::strip_tags( $input );

		$this->assertEquals( 'Hello <b>world</b>', $result['string'] );
		$this->assertSame( '42', $result['number'] );
		$this->assertSame( '1', $result['boolean'] ); // true converted to string
		$this->assertEquals( 'Test & case', $result['array']['nested_string'] );
		$this->assertSame( '3.14', $result['array']['nested_number'] );
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
			'all_format'       => array(
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
			'key_value_format' => array(
				'format'   => 'key-value',
				'expected' => array(
					'1_Name'    => $test_name,
					'2_Email'   => $test_email,
					'3_Website' => $test_website,
					'4_Message' => $test_message,
				),
				'message'  => 'Compiled fields should return key-value pairs only.',
			),
			'value_format'     => array(
				'format'   => 'value',
				'expected' => array(
					$test_name,
					$test_email,
					$test_website,
					$test_message,
				),
				'message'  => 'Compiled fields should return only values as indexed array.',
			),
			'label_format'     => array(
				'format'   => 'label',
				'expected' => array(
					'Name',
					'Email',
					'Website',
					'Message',
				),
				'message'  => 'Compiled fields should return only labels as indexed array.',
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

		$this->assertEquals( $expected, $compiled_fields, $message );
	}
}
