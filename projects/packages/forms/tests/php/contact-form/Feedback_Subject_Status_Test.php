<?php
/**
 * Unit Tests for Feedback Subject, Status, and Consent.
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
 * Test class for Feedback Subject, Status, and Consent
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Subject_Status_Test extends BaseTestCase {

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
}
