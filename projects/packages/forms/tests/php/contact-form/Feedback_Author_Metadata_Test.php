<?php
/**
 * Unit Tests for Feedback Author Metadata (Name, Email, URL).
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

require_once __DIR__ . '/class-utility.php';

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Test class for Feedback Author Metadata
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Author_Metadata_Test extends BaseTestCase {

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
		$avatar_url = $saved_response->get_author_avatar();
		$this->assertStringContainsString( 'gravatar.com/avatar/', $avatar_url, 'Author avatar should be a Gravatar URL' );
		$this->assertStringContainsString( 'd=initials', $avatar_url, 'Author avatar should use initials default with email prefix when no name is set' );
		$this->assertStringContainsString( 'name=', $avatar_url, 'Author avatar should include name parameter derived from email prefix' );
	}

	public function test_computed_email() {

		$email   = 'email@email.com';
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
		$avatar_url = $saved_response->get_author_avatar();
		$this->assertStringContainsString( 'gravatar.com/avatar/', $avatar_url, 'Author avatar should be a Gravatar URL' );
		$this->assertStringContainsString( 'd=initials', $avatar_url, 'Author avatar should use initials default' );
		$this->assertStringContainsString( 'name=author', $avatar_url, 'Author avatar should include name parameter' );
		$this->assertEquals( $email, $saved_response->get_author_email(), 'Author email should match the saved form submission' );
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

	/**
	 * Test that form_fill_duration is included in serialized response and persists after save/load.
	 */
	public function test_form_fill_duration_persists_after_save() {

		$form_id = Utility::get_form_id();
		// Create a form submission with form_fill_duration
		$_post_data = Utility::get_post_request(
			array(
				'name'               => 'John Doe',
				'email'              => 'john@example.com',
				'message'            => 'Test message',
				'form_fill_duration' => '45', // 45 seconds
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

		// Create a contact form response
		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// The form_fill_duration should be present and match the test value.
		$this->assertNotEmpty( $response->get_form_fill_duration(), 'Form fill duration should not be empty' );
		$this->assertNotEmpty( $saved_response->get_form_fill_duration(), 'Form fill duration should not be empty after save/load' );
		$this->assertEquals( $response->get_form_fill_duration(), $saved_response->get_form_fill_duration(), 'Form fill duration should match after save/load' );
		$this->assertEquals( 45, $saved_response->get_form_fill_duration(), 'Form fill duration should be 45 seconds' );
		$this->assertIsInt( $saved_response->get_form_fill_duration(), 'Form fill duration should be an integer' );
	}

	/**
	 * An empty form_fill_duration means the duration is unknown, and must be stored as null
	 * rather than as 0 so it stays distinct from a form that really was filled out instantly.
	 *
	 * @dataProvider provide_unknown_form_fill_durations
	 *
	 * @param array  $extra_post_data Submission data to merge in.
	 * @param string $message         Assertion message.
	 */
	#[DataProvider( 'provide_unknown_form_fill_durations' )]
	public function test_form_fill_duration_is_null_when_unknown( $extra_post_data, $message ) {
		$form_id = Utility::get_form_id();

		$_post_data = Utility::get_post_request(
			array_merge(
				array(
					'name'    => 'John Doe',
					'email'   => 'john@example.com',
					'message' => 'Test message',
				),
				$extra_post_data
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

		$response       = Feedback::from_submission( $_post_data, $form );
		$saved_response = Feedback::get( $response->save() );

		$this->assertNull( $response->get_form_fill_duration(), $message );
		$this->assertNull( $saved_response->get_form_fill_duration(), $message . ' (after save/load)' );
	}

	/**
	 * Data provider for test_form_fill_duration_is_null_when_unknown.
	 *
	 * @return array
	 */
	public static function provide_unknown_form_fill_durations() {
		return array(
			'empty value (no interaction recorded)' => array(
				array( 'form_fill_duration' => '' ),
				'An empty duration should be stored as null, not 0',
			),
			'field absent entirely'                 => array(
				array(),
				'A missing duration should be stored as null',
			),
		);
	}

	/**
	 * A real, sub-second fill still records 0 — that is a known duration, not an unknown one.
	 */
	public function test_form_fill_duration_zero_is_preserved() {
		$form_id = Utility::get_form_id();

		$_post_data = Utility::get_post_request(
			array(
				'name'               => 'John Doe',
				'email'              => 'john@example.com',
				'message'            => 'Test message',
				'form_fill_duration' => '0',
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

		$response       = Feedback::from_submission( $_post_data, $form );
		$saved_response = Feedback::get( $response->save() );

		$this->assertSame( 0, $saved_response->get_form_fill_duration(), 'An explicit 0 duration should be preserved as 0, not converted to null' );
	}
}
