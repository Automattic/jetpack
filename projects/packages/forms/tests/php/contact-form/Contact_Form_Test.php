<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Contact_Form.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use Automattic\Jetpack\Constants;
use DOMDocument;
use DOMElement;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\BeforeClass;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\Posts;
use WP_Block;

/**
 * Test class for Contact_Form
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Contact_Form
 * @covers \Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field
 * @covers \Automattic\Jetpack\Forms\ContactForm\Contact_Form_Plugin
 * @covers \Automattic\Jetpack\Forms\ContactForm\Util
 */
#[CoversClass( Contact_Form::class )]
#[CoversClass( Contact_Form_Field::class )]
#[CoversClass( Contact_Form_Plugin::class )]
#[CoversClass( Util::class )]
class Contact_Form_Test extends BaseTestCase {

	private $post;

	private $track_feedback_inserted;

	private $plugin;

	/**
	 * Test that form submissions are stored in database when saveResponses is 'yes' (default)
	 */
	public function test_process_submission_stores_feedback_when_save_responses_yes() {
		// Fill field values
		$this->add_field_values(
			array(
				'name'    => 'John Doe',
				'email'   => 'john@example.com',
				'message' => 'Test message',
			)
		);

		// Create form with saveResponses explicitly set to 'yes'
		$form = new Contact_Form(
			array(
				'saveResponses' => 'yes',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Get initial post count
		$initial_posts = Posts::init()->posts;
		$initial_count = count( $initial_posts );

		// Process the submission
		$result = $form->process_submission();

		// Processing should be successful
		$this->assertTrue( is_string( $result ), 'Form submission should be successful' );

		// Check that a new feedback post was created
		$final_posts = Posts::init()->posts;
		$final_count = count( $final_posts );
		$this->assertEquals( $initial_count + 1, $final_count, 'A new feedback post should be created when saveResponses is yes' );

		// Verify the feedback post was created with correct type
		$feedback_id = end( $final_posts )->ID;
		$submission  = get_post( $feedback_id );
		$this->assertEquals( 'feedback', $submission->post_type, 'Post type should be feedback' );

		// Verify the form attribute is correctly set
		$this->assertEquals( 'yes', $form->get_attribute( 'saveResponses' ), 'Form should have saveResponses set to yes' );
	}

	/**
	 * Test that form submissions are stored with 'jp-temp-feedback' status when saveResponses is 'no'
	 */
	public function test_process_submission_does_not_store_feedback_when_save_responses_no() {
		// Fill field values
		$this->add_field_values(
			array(
				'name'    => 'Jane Doe',
				'email'   => 'jane@example.com',
				'message' => 'Test message for no save',
			)
		);

		// Create form with saveResponses set to 'no'
		$form = new Contact_Form(
			array(
				'saveResponses' => 'no',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Get initial post count
		$initial_posts = Posts::init()->posts;
		$initial_count = count( $initial_posts );

		// Process the submission
		$result = $form->process_submission();

		// Processing should still be successful (email should still be sent)
		$this->assertTrue( is_string( $result ), 'Form submission should be successful even when not saving responses' );

		// Check that a new feedback post was created
		$final_posts = Posts::init()->posts;
		$final_count = count( $final_posts );
		$this->assertEquals( $initial_count + 1, $final_count, 'A new feedback post should be created when saveResponses is no' );

		// Get the newly created post
		$new_post = end( $final_posts );
		$this->assertInstanceOf( 'stdClass', $new_post, 'The new post should be a stdClass instance' );
		$this->assertEquals( 'feedback', $new_post->post_type, 'The new post should be of type feedback' );
		$this->assertEquals( 'jp-temp-feedback', $new_post->post_status, 'The new post should have jp-temp-feedback status when saveResponses is no' );

		// Verify the form attribute is correctly set
		$this->assertEquals( 'no', $form->get_attribute( 'saveResponses' ), 'Form should have saveResponses set to no' );
	}

	/**
	 * Preview (test) submissions mark the feedback as a test response, skip
	 * Akismet, and still keep the post_status as 'publish' so the owner can
	 * find it in the normal inbox alongside real responses.
	 */
	public function test_process_submission_marks_preview_submission_as_test_feedback() {
		$this->add_field_values(
			array(
				'name'    => 'Preview Tester',
				'email'   => 'preview@example.com',
				'message' => 'This should be stored as test feedback',
			)
		);

		// Track whether Akismet filter was invoked — it must not be.
		$akismet_called = 0;
		add_filter(
			'jetpack_contact_form_is_spam',
			function ( $is_spam ) use ( &$akismet_called ) {
				++$akismet_called;
				return $is_spam;
			},
			10,
			1
		);

		$form = new Contact_Form(
			array(),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);
		$form->set_is_preview_submission( true );

		$initial_count = count( Posts::init()->posts );
		$result        = $form->process_submission();

		$this->assertTrue( is_string( $result ), 'Form submission should be successful for preview submissions.' );

		$final_posts = Posts::init()->posts;
		$this->assertCount( $initial_count + 1, $final_posts, 'A feedback post should be created for preview submissions.' );

		$new_post = end( $final_posts );
		$this->assertEquals( 'feedback', $new_post->post_type, 'The new post should be of type feedback.' );
		$this->assertEquals( 'publish', $new_post->post_status, 'Test feedback should be stored with publish status, not spam.' );

		$this->assertSame( 0, $akismet_called, 'Akismet filter must not be invoked for preview (test) submissions.' );

		// Round-trip through the Feedback reader to confirm the is_test flag is
		// serialized into post_content.
		$feedback = Feedback::get( $new_post->ID );
		$this->assertInstanceOf( Feedback::class, $feedback );
		$this->assertTrue( $feedback->is_test(), 'Feedback loaded from post_content should report is_test() === true.' );

		remove_all_filters( 'jetpack_contact_form_is_spam' );
	}

	/**
	 * Test that form submissions are stored in database when saveResponses is not specified (defaults to 'yes')
	 */
	public function test_process_submission_stores_feedback_when_save_responses_default() {
		// Fill field values
		$this->add_field_values(
			array(
				'name'    => 'Default User',
				'email'   => 'default@example.com',
				'message' => 'Test message for default behavior',
			)
		);

		// Create form without specifying saveResponses (should default to 'yes')
		$form = new Contact_Form(
			array(),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Get initial post count
		$initial_posts = Posts::init()->posts;
		$initial_count = count( $initial_posts );

		// Process the submission
		$result = $form->process_submission();

		// Processing should be successful
		$this->assertTrue( is_string( $result ), 'Form submission should be successful' );

		// Check that a new feedback post was created (default behavior)
		$final_posts = Posts::init()->posts;
		$final_count = count( $final_posts );
		$this->assertEquals( $initial_count + 1, $final_count, 'A new feedback post should be created by default' );

		// Verify the feedback post was created with correct type
		$feedback_id = end( $final_posts )->ID;
		$submission  = get_post( $feedback_id );
		$this->assertEquals( 'feedback', $submission->post_type, 'Post type should be feedback' );

		// Verify the form attribute defaults to 'yes'
		$this->assertEquals( 'yes', $form->get_attribute( 'saveResponses' ), 'Form should default saveResponses to yes' );
	}

	/**
	 * Test the esc_shortcode_val method with various input types
	 */
	public function test_esc_shortcode_val() {
		// Test simple string escaping
		$this->assertEquals(
			'Hello&#044; World&#091;&#093;',
			Contact_Form::esc_shortcode_val( 'Hello, World[]' ),
			'Failed to properly escape string with brackets and comma'
		);

		// Test array with value key
		$this->assertEquals(
			'test&#092;value',
			Contact_Form::esc_shortcode_val( array( 'value' => 'test\\value' ) ),
			'Failed to handle array with value key'
		);

		// Test array without value key (recursive case)
		$this->assertEquals(
			'first',
			Contact_Form::esc_shortcode_val( array( 'first', 'second' ) ),
			'Failed to handle array without value key'
		);

		// Test nested array case
		$this->assertEquals(
			'nested',
			Contact_Form::esc_shortcode_val( array( array( 'value' => 'nested' ) ) ),
			'Failed to handle nested array'
		);

		// Test special character escaping
		$special_chars = '[bracket], \\backslash\\, ,comma,';
		$expected      = '&#091;bracket&#093;&#044; &#092;backslash&#092;&#044; &#044;comma&#044;';
		$this->assertEquals(
			$expected,
			Contact_Form::esc_shortcode_val( $special_chars ),
			'Failed to escape all special characters correctly'
		);
	}

	/**
	 * Sets up the test environment before the class tests begin.
	 *
	 * @beforeClass
	 */
	#[BeforeClass]
	public static function set_up_class() {
		define( 'DOING_AJAX', true ); // Defined so that 'exit' is not called in process_submission.

		// Remove any relevant filters that might exist before running the tests.
		remove_all_filters( 'grunion_still_email_spam' );
		remove_all_filters( 'jetpack_contact_form_is_spam' );
		remove_all_filters( 'wp_mail' );
	}

	/**
	 * Inserts globals needed to process contact form submits
	 */
	private function set_globals() {
		$_SERVER['REMOTE_ADDR']     = '127.0.0.1';
		$_SERVER['HTTP_USER_AGENT'] = 'unit-test';
		$_SERVER['HTTP_REFERER']    = 'test';
	}

	/**
	 * Sets up the test environment before each unit test.
	 *
	 * @before
	 */
	#[Before]
	public function set_up_test_case() {
		// Avoid actually trying to send any mail.
		add_filter( 'pre_wp_mail', '__return_true', PHP_INT_MAX );
		$this->track_feedback_inserted = array();
		$this->set_globals();

		$author_id = wp_insert_user(
			array(
				'user_email' => 'john@example.com',
				'user_login' => 'test_user',
				'user_pass'  => 'abc123',
				'role'       => 'author',
			)
		);

		$post_id = wp_insert_post(
			array(
				'post_title'   => 'abc',
				'post_content' => 'def',
				'post_status'  => 'draft',
				'post_author'  => $author_id,
			),
			true
		);

		global $post;
		$post = get_post( $post_id );

		// Place post_id to contact form id to make the form processable.
		$_POST['contact-form-id'] = $post_id;

		// Make the global post (used by contact forms) accessbile to tests.
		$this->post = $post;

		// Initialize plugin.
		$this->plugin = Contact_Form_Plugin::init();
		// Call to add tokenization hook.
		$this->plugin->process_form_submission();
	}

	/**
	 * Tears down the test environment after each unit test.
	 */
	public function tear_down() {
		// Remove filters after running tests.
		remove_all_filters( 'wp_mail' );
		remove_all_filters( 'grunion_still_email_spam' );
		remove_all_filters( 'jetpack_contact_form_is_spam' );

		// Reset the forms array
		Contact_Form::$forms        = array();
		Contact_Form::$last         = null;
		Contact_Form::$current_form = null;
	}

	/**
	 * Adds the field values to the global $_POST value.
	 *
	 * @param array  $values Array of form fields and values.
	 * @param string $form_id Optional form ID. If not provided, will use $this->post->ID.
	 */
	private function add_field_values( $values, $form_id = null ) {
		$prefix = $form_id ? $form_id : 'g' . $this->post->ID;
		$_POST  = array();
		foreach ( $values as $key => $val ) {
			if ( strpos( $key, 'contact-form' ) === 0 || strpos( $key, 'action' ) === 0 ) {
				$_POST[ $key ] = $val;
			} else {
				$_POST[ $prefix . '-' . $key ] = $val;
			}
		}
	}

	/**
	 * Tests that the submission as a whole will produce something in the
	 * database when required information is provided.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_a_feedback_correctly_with_default_form() {
		$form   = new Contact_Form( array() );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback_id = end( Posts::init()->posts )->ID;
		$submission  = get_post( $feedback_id );
		$this->assertEquals( 'feedback', $submission->post_type, 'Post type doesn\'t match' );

		// Default metadata should be saved.
		$email = get_post_meta( $submission->ID, '_feedback_email', true );
		$this->assertEquals( 'john <john@example.com>', $email['to'][0] );
		// IP address is now shown in the metadata section.
		$this->assertStringContainsString( '>IP address:<', $email['message'] );
		$this->assertStringContainsString( '127.0.0.1', $email['message'] );
	}

	/**
	 * Test the success_message method when customThankyou is set to 'message'.
	 */
	public function test_success_message_with_custom_thankyou_message() {
		// Create a form with customThankyou = 'message'
		$form = new Contact_Form(
			array(
				'customThankyou'        => 'message',
				'customThankyouMessage' => 'Thank you <span class="highlight" style="color:green">very much</span> for your submission!',
			)
		);

		// Call the method
		$success_message = Contact_Form::success_message( 1, $form );

		// Verify that the message contains our custom thank you with allowed HTML elements
		$this->assertStringContainsString( '<span class="highlight" style="color:green">very much</span>', $success_message );
		$this->assertStringContainsString( 'Thank you', $success_message );
		$this->assertStringContainsString( 'for your submission', $success_message );
	}

	/**
	 * Test the success_message method when customThankyou is not set to 'message'.
	 * This test uses a real form submission and relies on get_compiled_form.
	 */
	public function test_success_message_with_compiled_form() {
		// Create a form submission
		$this->add_field_values(
			array(
				'name'    => 'John Doe',
				'email'   => 'john@example.com',
				'message' => 'Test message',
			)
		);

		// Create a contact form
		$form = new Contact_Form(
			array(
				'customThankyou' => '',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/][contact-field label='Message' type='textarea' required='1'/]"
		);

		// Process the submission to create a feedback post
		$result = $form->process_submission();
		$this->assertTrue( is_string( $result ), 'Form submission should be successful' );

		// Get the feedback ID from the most recent post
		$feedback_id = end( Posts::init()->posts )->ID;

		// Call the success_message method
		$success_message = Contact_Form::success_message( $feedback_id, $form );

		// Verify the success message format
		$this->assertStringContainsString( '<div class="field-name">Name:</div>', $success_message );
		$this->assertStringContainsString( '<div class="field-value">John Doe</div>', $success_message );
		$this->assertStringContainsString( '<div class="field-name">Email:</div>', $success_message );
		$this->assertStringContainsString( '<div class="field-value">john@example.com</div>', $success_message );
	}

	/**
	 * Test the escape_and_sanitize_field_value method.
	 */
	public function test_escape_and_sanitize_field_value() {
		// Test empty value
		$this->assertSame( '', Contact_Form::escape_and_sanitize_field_value( '' ) );
		$this->assertSame( '', Contact_Form::escape_and_sanitize_field_value( null ) );

		// Test file upload field structure
		$file_upload_value = array(
			'field_id' => 'test_upload',
			'files'    => array(
				array(
					'file_id' => '12345',
					'name'    => 'test-document.pdf',
					'size'    => 1024,
				),
				array(
					'file_id' => '67890',
					'name'    => 'another-document.docx',
					'size'    => 2048,
				),
			),
		);

		$result = Contact_Form::escape_and_sanitize_field_value( $file_upload_value );
		$this->assertStringContainsString( 'test-document.pdf', $result );
		$this->assertStringContainsString( 'another-document.docx', $result );
		$this->assertStringContainsString( '<span class="jetpack-forms-file-size">', $result );
		$this->assertStringContainsString( '(1 KB)', $result );
		$this->assertStringContainsString( '(2 KB)', $result );

		// Test empty file upload field
		$empty_file_upload = array(
			'field_id' => 'test_upload',
			'files'    => array(),
		);
		$this->assertSame( '', Contact_Form::escape_and_sanitize_field_value( $empty_file_upload ) );

		// Test regular array values
		$array_value = array( 'option 1', 'option 2', 'option 3' );
		$this->assertEquals( 'option 1, option 2, option 3', Contact_Form::escape_and_sanitize_field_value( $array_value ) );

		// Test value with brackets (should be escaped)
		$bracket_value = 'This is a [test] with brackets';
		$result        = Contact_Form::escape_and_sanitize_field_value( $bracket_value );
		$this->assertEquals( 'This is a &#091;test&#093; with brackets', $result );

		// Test value with HTML (should be stripped)
		$html_value = 'This has <strong>HTML</strong> tags';
		$result     = Contact_Form::escape_and_sanitize_field_value( $html_value );
		$this->assertEquals( 'This has HTML tags', $result );

		// Test value with newlines (should be converted to <br>)
		$multiline_value = "Line 1\nLine 2\nLine 3";
		$result          = Contact_Form::escape_and_sanitize_field_value( $multiline_value );
		$this->assertEquals( "Line 1<br />\nLine 2<br />\nLine 3", $result );

		// Test deeply nested array
		$nested_array = array(
			array( 'item1', 'item2' ),
			array( 'item3', 'item4' ),
		);
		$result       = Contact_Form::escape_and_sanitize_field_value( $nested_array );
		$this->assertEquals( 'item1, item2, item3, item4', $result );
	}

	/**
	 * Tests that the submission as a whole will produce something in the
	 * database when required information is provided.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_not_store_ip() {
		add_filter( 'jetpack_contact_form_forget_ip_address', '__return_true' );
		$form   = new Contact_Form( array() );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback_id = end( Posts::init()->posts )->ID;
		$submission  = get_post( $feedback_id );

		// Default metadata should be saved.
		$email = get_post_meta( $submission->ID, '_feedback_email', true );
		$this->assertStringNotContainsString( 'IP Address', $email['message'] );
		remove_all_filters( 'jetpack_contact_form_forget_ip_address' );
	}

	/**
	 * Tests that the browser information is included in the email message.
	 */
	public function test_process_submission_includes_browser_in_email() {
		$_SERVER['HTTP_USER_AGENT'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36';
		$form                       = new Contact_Form( array() );
		$result                     = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback_id = end( Posts::init()->posts )->ID;
		$submission  = get_post( $feedback_id );

		// Browser/device information should be included in the email metadata section.
		$email = get_post_meta( $submission->ID, '_feedback_email', true );
		$this->assertStringContainsString( '>Device:<', $email['message'] );
		$this->assertStringContainsString( 'Chrome', $email['message'] );
	}

	/**
	 * Tests that the submission as a whole will produce something in the
	 * database when some labels are provided.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_extra_field_metadata() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form   = new Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback_id = end( Posts::init()->posts )->ID;
		$submission  = get_post( $feedback_id );
		$this->assertEquals( 'feedback', $submission->post_type, 'Post type doesn\'t match' );

		// Default metadata should be saved.
		$extra_fields = get_post_meta( $submission->ID, '_feedback_extra_fields', true );

		$response = Feedback::get( $feedback_id );

		$this->assertEquals( $extra_fields, $response->get_legacy_extra_values(), 'The extra fields should match the response from the Feedback class' );
		$this->assertCount( 3, $extra_fields, 'There should be exactly three extra fields when one of the fields is name, and the others are an extra dropdown, radio button field and text field' );

		/*
		 * Metadata starts counting from 5, because post content has:
		 *   1_Name
		 *   2_Dropdown
		 *   3_Radio
		 *   4_Text
		 */
		$this->assertEquals( 'First option', $extra_fields['5_Dropdown'], 'When the first option of a dropdown field with label Dropdown is selected, there should be metadata with that key and value' );
		$this->assertEquals( 'Second option', $extra_fields['6_Radio'], 'When the first option of a radio button field with label Radio is selected, there should be metadata with that key and value' );
		$this->assertEquals( 'Texty text', $extra_fields['7_Text'], 'When the text field with label Text is filled with the text \'Texty text\', there should be metadata with that key and value' );
	}

	/**
	 * Tests that the submission will store the subject when specified.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_subject_when_specified() {
		$form   = new Contact_Form( array( 'subject' => 'I\'m sorry, but the party\'s over' ) ); // Default form.
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback_id = end( Posts::init()->posts )->ID;
		$response    = Feedback::get( $feedback_id );

		// Default metadata should be saved.
		$this->assertEquals( "I'm sorry, but the party's over", $response->get_subject(), 'The stored subject didn\'t match the given' );
	}

	/**
	 * Tests that the submission will store the subject with tokens replace using the name and text fields.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_subject_with_token_replaced_from_name_and_text_field() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'state' => 'Kansas',
			)
		);

		$form = new Contact_Form( array( 'subject' => 'Hello {name} from {state}!' ), "[contact-field label='Name' type='name' required='1'/][contact-field label='State' type='text'/]" );

		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback_id = end( Posts::init()->posts )->ID;
		$response    = Feedback::get( $feedback_id );

		$this->assertStringContainsString( 'Hello John Doe from Kansas!', $response->get_subject(), 'The stored subject didn\'t match the given' );
	}

	/**
	 * Tests that the submission will store the subject with a token replaced using the radio button field.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_subject_with_token_replaced_from_radio_button_field() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'state' => 'Kansas',
			)
		);

		$form   = new Contact_Form( array( 'subject' => 'Hello {name} from {state}!' ), "[contact-field label='Name' type='name' required='1'/][contact-field label='State' type='radio' options='Kansas,California'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback_id = end( Posts::init()->posts )->ID;
		$response    = Feedback::get( $feedback_id );

		$this->assertStringContainsString( 'Hello John Doe from Kansas!', $response->get_subject(), 'The stored subject didn\'t match the given' );
	}

	/**
	 * Tests that the submission will store the subject with a token replaced using the dropdown field.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_subject_with_token_replaced_from_dropdown_field() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'state' => 'Kansas',
			)
		);

		$form   = new Contact_Form( array( 'subject' => 'Hello {name} from {state}!' ), "[contact-field label='Name' type='name' required='1'/][contact-field label='State' type='select' options='Kansas,California'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback_id = end( Posts::init()->posts )->ID;
		$response    = Feedback::get( $feedback_id );

		$this->assertStringContainsString( 'Hello John Doe from Kansas!', $response->get_subject(), 'The stored subject didn\'t match the given' );
	}

	/**
	 * Tests the form submission will store the fields and their values in the post content.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_fields_and_their_values_to_post_content() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form   = new Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback_id = end( Posts::init()->posts )->ID;

		$response = Feedback::get( $feedback_id );

		$this->assertStringContainsString( 'John Doe', $response->get_field_value_by_label( 'Name' ), 'Post content did not contain the name label and/or value' );
		$this->assertStringContainsString( 'First option', $response->get_field_value_by_label( 'Dropdown' ), 'Post content did not contain the dropdown label and/or value' );
		$this->assertStringContainsString( 'Second option', $response->get_field_value_by_label( 'Radio' ), 'Post content did not contain the radio button label and/or value' );
		$this->assertStringContainsString( 'Texty text', $response->get_field_value_by_label( 'Text' ), 'Post content did not contain the text field label and/or value' );
	}

	/**
	 * Tests that the form submission will store the fields and their value in the email meta.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_will_store_fields_and_their_values_to_email_meta() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form   = new Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$result = $form->process_submission();

		// Processing should be successful and produce the success message.
		$this->assertTrue( is_string( $result ) );

		$feedback_id = end( Posts::init()->posts )->ID;
		$submission  = get_post( $feedback_id );
		$this->assertEquals( 'feedback', $submission->post_type, 'Post type doesn\'t match' );

		$email = get_post_meta( $submission->ID, '_feedback_email', true );

		// New type-aware rendering uses table-based layout with labels and values.
		$this->assertStringContainsString( 'Name', $email['message'] );
		$this->assertStringContainsString( 'John Doe', $email['message'] );
		$this->assertStringContainsString( 'Dropdown', $email['message'] );
		$this->assertStringContainsString( 'First option', $email['message'] );
		$this->assertStringContainsString( 'Radio', $email['message'] );
		$this->assertStringContainsString( 'Second option', $email['message'] );
		$this->assertStringContainsString( 'Text', $email['message'] );
		$this->assertStringContainsString( 'Texty text', $email['message'] );
		// Verify table-based structure is used.
		$this->assertStringContainsString( '<table role="presentation"', $email['message'] );
	}

	/**
	 * Tests that the form subussion sends the correct single email.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_sends_correct_single_email() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		add_filter( 'wp_mail', array( $this, 'pre_test_process_submission_sends_correct_single_email' ) );

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form   = new Contact_Form(
			array(
				'to'      => 'john <john@example.com>',
				'subject' => 'Hello there!',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]"
		);
		$result = $form->process_submission();
		$this->assertNotNull( $result );
	}

	/**
	 * This method is hooked to the wp-mail filter.
	 *
	 * @param array $args A compacted array of wp_mail() arguments, including the "to" email,
	 *                    subject, message, headers, and attachments values.
	 */
	public function pre_test_process_submission_sends_correct_single_email( $args ) {
		$this->assertContains( 'john <john@example.com>', $args['to'] );
		$this->assertEquals( 'Hello there!', $args['subject'] );

		// New type-aware rendering uses table-based layout with labels and values.
		$this->assertStringContainsString( 'Name', $args['message'] );
		$this->assertStringContainsString( 'John Doe', $args['message'] );
		$this->assertStringContainsString( 'Dropdown', $args['message'] );
		$this->assertStringContainsString( 'First option', $args['message'] );
		$this->assertStringContainsString( 'Radio', $args['message'] );
		$this->assertStringContainsString( 'Second option', $args['message'] );
		$this->assertStringContainsString( 'Text', $args['message'] );
		$this->assertStringContainsString( 'Texty text', $args['message'] );
		// Verify table-based structure is used.
		$this->assertStringContainsString( '<table role="presentation"', $args['message'] );
	}

	/**
	 * Tests that the response template is generated correctly
	 */
	public function test_wrap_message_in_html_tags() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form = new Contact_Form(
			array(
				'to'      => 'john@example.com, jane@example.com',
				'subject' => 'Hello there!',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]"
		);

		$title  = 'You got a new response!';
		$body   = 'Here are the details:';
		$footer = 'This is the footer';
		$result = $form->wrap_message_in_html_tags( $title, $body, $footer );

		$this->assertStringContainsString( $title, $result );
		$this->assertStringContainsString( $body, $result );
		// Note: Legacy footer content is no longer displayed in template - metadata section shows this info instead.
	}

	/**
	 * Tests that the form subussion sends the correct multiple emails.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_sends_correct_multiple_email() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		add_filter( 'wp_mail', array( $this, 'pre_test_process_submission_sends_correct_multiple_email' ) );

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form = new Contact_Form(
			array(
				'to'      => 'john@example.com, jane@example.com',
				'subject' => 'Hello there!',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]"
		);

		$result = $form->process_submission();
		$this->assertNotNull( $result );
	}

	/**
	 * Tests that the email does not contain "Powered by".
	 */
	public function test_jetpack_forms_email_powered_by_html_filter() {

		$this->assertStringContainsString( 'Powered by', Contact_Form::wrap_message_in_html_tags( '$title', '$message', '$footer', '$actions' ) );

		add_filter( 'jetpack_forms_email_powered_by_html', '__return_empty_string' );
		$this->assertStringNotContainsString( 'Powered by', Contact_Form::wrap_message_in_html_tags( '$title', '$message', '$footer', '$actions' ) );
		remove_filter( 'jetpack_forms_email_powered_by_html', '__return_empty_string' );
	}

	/**
	 * This method is hooked to the wp-mail filter.
	 *
	 * @param array $args A compacted array of wp_mail() arguments, including the "to" email,
	 *                    subject, message, headers, and attachments values.
	 */
	public function pre_test_process_submission_sends_correct_multiple_email( $args ) {
		$this->assertEquals( array( 'john <john@example.com>', 'jane <jane@example.com>' ), $args['to'] );
	}

	/**
	 * Tests that the form submission fails when spam is marked with a WP_Error object.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_fails_if_spam_marked_with_WP_Error() {
		add_filter( 'jetpack_contact_form_is_spam', array( $this, 'pre_test_process_submission_fails_if_spam_marked_with_WP_Error' ), 11 ); // Run after akismet filter.

		$form   = new Contact_Form( array() );
		$result = $form->process_submission();

		$this->assertInstanceOf( 'WP_Error', $result, 'When $is_spam contains a WP_Error, the result of process_submission should be a WP_Error' );
		$this->assertEquals( 'Message is spam', $result->get_error_message() );
	}

	/**
	 * This method is hooked to the jetpack_contact_form_is_spam filter.
	 */
	public function pre_test_process_submission_fails_if_spam_marked_with_WP_Error() {
		return new \WP_Error( 'spam', 'Message is spam' );
	}

	/**
	 * Tests that the form submission won't send if the submission is marked as spam.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_wont_send_spam_if_marked_as_spam_with_true() {
		add_filter( 'jetpack_contact_form_is_spam', '__return_true', 11 ); // Run after akismet filter.

		add_filter( 'wp_mail', array( $this, 'pre_test_process_submission_wont_send_spam_if_marked_as_spam_with_true' ) );

		$form   = new Contact_Form( array( 'to' => 'john@example.com' ) );
		$result = $form->process_submission();
		$this->assertNotNull( $result );
	}

	/**
	 * This method is hooked to the wp-mail filter, and the test will fail if this method is called.
	 */
	public function pre_test_process_submission_wont_send_spam_if_marked_as_spam_with_true() {
		$this->assertTrue( false ); // Fail if trying to send.
	}

	/**
	 * Tests that the email subject is labeled with Spam when the submission is spam and the filter to send spam is set to true.
	 *
	 * @author tonykova
	 */
	public function test_process_submission_labels_message_as_spam_in_subject_if_marked_as_spam_with_true_and_sending_spam() {
		add_filter( 'jetpack_contact_form_is_spam', '__return_true', 11 ); // Run after akismet filter.

		add_filter( 'grunion_still_email_spam', '__return_true' );

		add_filter( 'wp_mail', array( $this, 'pre_test_process_submission_labels_message_as_spam_in_subject_if_marked_as_spam_with_true_and_sending_spam' ) );

		$form   = new Contact_Form( array( 'to' => 'john@example.com' ) );
		$result = $form->process_submission();
		$this->assertNotNull( $result );
	}

	/**
	 * This method is hooked to the wp-mail filter.
	 *
	 * @param array $args A compacted array of wp_mail() arguments, including the "to" email,
	 *                    subject, message, headers, and attachments values.
	 */
	public function pre_test_process_submission_labels_message_as_spam_in_subject_if_marked_as_spam_with_true_and_sending_spam( $args ) {
		$this->assertStringContainsString( '***SPAM***', $args['subject'] );
	}

	/**
	 * Tests that 'grunion_delete_old_spam()' deletes an old post that is marked as spam.
	 *
	 * @author tonykova
	 */
	public function test_grunion_delete_old_spam_deletes_an_old_post_marked_as_spam() {
		// grunion_Delete_old_spam performs direct DB queries which cannot be tested outside of a working WP install.
		$this->markTestSkipped();
		// @phan-suppress-next-line PhanPluginUnreachableCode
		$post_id = wp_insert_post(
			array(
				'post_type'     => 'feedback',
				'post_status'   => 'spam',
				'post_date_gmt' => '1987-01-01 12:00:00',
			)
		);

		Util::grunion_delete_old_spam();
		$this->assertNull( get_post( $post_id ), 'An old spam feedback should be deleted' );
	}

	/**
	 * Tests that 'grunion_delete_old_spam' does not delete a new post that is marked as spam.
	 *
	 * @author tonykova
	 */
	public function test_grunion_delete_old_spam_does_not_delete_a_new_post_marked_as_spam() {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'testing',
				'post_contnt' => 'testing',
				'post_type'   => 'feedback',
				'post_status' => 'spam',
			)
		);

		Util::grunion_delete_old_spam();
		$this->assertEquals( $post_id, get_post( $post_id )->ID, 'A new spam feedback should be left intact when deleting old spam' );
	}

	public function test_parse_fields_from_content() {

		$comment_content      = 'This is a test comment content.';
		$comment_author       = 'Test User';
		$comment_author_email = 'test@email.com';
		$comment_author_url   = 'http://example.com';
		$comment_ip_text      = 'https://127.0.0.1';
		$subject              = 'Test Subject';
		$all_values           = array(
			'field1'                  => 'value1',
			'field2'                  => 'value2',
			'email_marketing_consent' => 'yes',
		);

		$content = addslashes( wp_kses( "$comment_content\n<!--more-->\nAUTHOR: {$comment_author}\nAUTHOR EMAIL: {$comment_author_email}\nAUTHOR URL: {$comment_author_url}\nSUBJECT: {$subject}\nIP: {$comment_ip_text}\nJSON_DATA\n" . wp_json_encode( $all_values, JSON_UNESCAPED_SLASHES ), array() ) );
		// Create a mock post with JSON_DATA format
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'feedback',
				'post_status'  => 'publish',
				'post_content' => $content,
			)
		);

		// Parse fields from the post
		$fields = Contact_Form_Plugin::parse_fields_from_content( $post_id );

		// Assert that basic feedback fields were parsed correctly
		$this->assertEquals( $comment_author, $fields['_feedback_author'] );
		$this->assertEquals( $comment_author_email, $fields['_feedback_author_email'] );
		$this->assertEquals( $comment_author_url, $fields['_feedback_author_url'] );
		$this->assertEquals( $subject, $fields['_feedback_subject'] );
		$this->assertEquals( $comment_ip_text, $fields['_feedback_ip'] );

		// Assert that JSON data fields were parsed correctly
		$this->assertIsArray( $fields['_feedback_all_fields'] );
		$this->assertEquals( $all_values['field1'], $fields['_feedback_all_fields']['field1'] );
		$this->assertEquals( $all_values['field2'], $fields['_feedback_all_fields']['field2'] );
		$this->assertEquals( $all_values['email_marketing_consent'], $fields['_feedback_all_fields']['email_marketing_consent'] );

		// Test caching by calling the method again and ensuring the same object is returned
		$cached_fields = Contact_Form_Plugin::parse_fields_from_content( $post_id );
		$this->assertSame( $fields, $cached_fields );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	public function test_parse_fields_from_content_no_data() {
		$data = Contact_Form_Plugin::parse_fields_from_content( 999999 );
		$this->assertEmpty( $data );
	}

	/**
	 * We test that if the all fields keys do have HTML content, they are escaped correctly.
	 */
	public function test_parse_fields_from_content_all_field_has_html_content() {

		$comment_content      = 'This is a test comment content.';
		$comment_author       = 'Test User';
		$comment_author_email = 'test@email.com';
		$comment_author_url   = 'http://example.com';
		$comment_ip_text      = 'https://127.0.0.1';
		$subject              = 'Test Subject';
		$all_values           = array(
			'<strong>field2</strong>' => 'value2',
		);

		$content = addslashes( wp_kses( "$comment_content\n<!--more-->\nAUTHOR: {$comment_author}\nAUTHOR EMAIL: {$comment_author_email}\nAUTHOR URL: {$comment_author_url}\nSUBJECT: {$subject}\nIP: {$comment_ip_text}\nJSON_DATA\n" . wp_json_encode( $all_values, JSON_UNESCAPED_SLASHES ), array() ) );
		// Create a mock post with JSON_DATA format
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'feedback',
				'post_status'  => 'publish',
				'post_content' => $content,
			)
		);

		// Parse fields from the post
		$fields = Contact_Form_Plugin::parse_fields_from_content( $post_id );

		// Assert that JSON data fields were parsed correctly
		$this->assertIsArray( $fields['_feedback_all_fields'] );
		$this->assertArrayHasKey( 'field2', $fields['_feedback_all_fields'] ); // note that we should escape HTML tags here.
		$this->assertEquals( $all_values['<strong>field2</strong>'], $fields['_feedback_all_fields']['field2'] );

		// Clean up
		wp_delete_post( $post_id, true );
	}

	public function test_parse_fields_from_content_form_submission() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form = new Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$form->process_submission();

		$post_id = end( Posts::init()->posts )->ID;
		$fields  = Contact_Form_Plugin::parse_fields_from_content( $post_id );

		// Assert basic feedback fields
		$this->assertEquals( 'John Doe', $fields['_feedback_author'] );
		$this->assertSame( '', $fields['_feedback_author_email'] );
		$this->assertSame( '', $fields['_feedback_author_url'] );
		$this->assertStringContainsString( 'abc', $fields['_feedback_subject'] );
		$this->assertEquals( '127.0.0.1', $fields['_feedback_ip'] );

		// Assert all fields array structure
		$this->assertIsArray( $fields['_feedback_all_fields'] );
		$this->assertEquals( 'John Doe', $fields['_feedback_all_fields']['1_Name'] );
		$this->assertEquals( 'First option', $fields['_feedback_all_fields']['2_Dropdown'] );
		$this->assertEquals( 'Second option', $fields['_feedback_all_fields']['3_Radio'] );
		$this->assertEquals( 'Texty text', $fields['_feedback_all_fields']['4_Text'] );

		// Check metadata fields
		$this->assertArrayHasKey( 'email_marketing_consent', $fields['_feedback_all_fields'] );
		$this->assertArrayHasKey( 'entry_title', $fields['_feedback_all_fields'] );
		$this->assertArrayHasKey( 'entry_permalink', $fields['_feedback_all_fields'] );
		$this->assertArrayHasKey( 'feedback_id', $fields['_feedback_all_fields'] );

		// Verify specific content
		$this->assertEquals( 'abc', $fields['_feedback_all_fields']['entry_title'] );
		$this->assertStringContainsString( '', $fields['_feedback_all_fields']['entry_permalink'] );
		$this->assertMatchesRegularExpression( '/^[a-f0-9]{32}$/', $fields['_feedback_all_fields']['feedback_id'] );

		wp_delete_post( $post_id, true );
	}

	/**
	 * This tests make sure that we don't store HTML when labels do have HTML tags.
	 */
	public function test_parse_fields_from_content_form_submission_do_not_store_label_html() {
		// Fill field values.
		$this->add_field_values(
			array(
				'name' => 'John Doe',
			)
		);

		// Initialize a form with name, dropdown and radiobutton (first, second
		// and third option), text field.
		$form = new Contact_Form( array(), "[contact-field label='<strong>Name</strong>' type='name' required='1'/][contact-field label='Dropdown' type='select' options='First option,Second option,Third option'/][contact-field label='Radio' type='radio' options='First option,Second option,Third option'/][contact-field label='Text' type='text'/]" );
		$form->process_submission();

		$post    = end( Posts::init()->posts );
		$post_id = $post->ID;

		$this->assertStringContainsString( '1_Name', $post->post_content, 'Post content should contain the field name without HTML tags' );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Tests that token is left intact when there is not matching field.
	 *
	 * @author tonykova
	 */
	public function test_token_left_intact_when_no_matching_field() {
		$plugin       = Contact_Form_Plugin::init();
		$subject      = 'Hello {name}!';
		$field_values = array(
			'City' => 'Chicago',
		);

		$this->assertEquals( 'Hello {name}!', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that token is replaced with an empty string when there is not value in field.
	 *
	 * @author tonykova
	 */
	public function test_replaced_with_empty_string_when_no_value_in_field() {
		$plugin       = Contact_Form_Plugin::init();
		$subject      = 'Hello {name}!';
		$field_values = array(
			'Name' => null,
		);

		$this->assertEquals( 'Hello !', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that token in curly brackets is replaced with the value when the name has whitespace.
	 *
	 * @author tonykova
	 */
	public function test_token_can_replace_entire_subject_with_token_field_whose_name_has_whitespace() {
		$plugin       = Contact_Form_Plugin::init();
		$subject      = '{subject token}';
		$field_values = array(
			'Subject Token' => 'Chicago',
		);

		$this->assertEquals( 'Chicago', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that token in curly brackets is replaced with the value when the name has whitespace.
	 */
	public function test_token_can_replace_entire_subject_with_token_field_has_japanese() {
		$plugin       = Contact_Form_Plugin::init();
		$subject      = '{名前}';
		$field_values = array(
			'名前' => 'Hello',
		);

		$this->assertEquals( 'Hello', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that token in curly brackets is replaced with the value when the name has whitespace.
	 */
	public function test_token_can_replace_entire_subject_with_token_field_has_emoji() {
		$plugin       = Contact_Form_Plugin::init();
		$subject      = '{🙈}';
		$field_values = array(
			'🙈' => 'Chicago',
		);

		$this->assertEquals( 'Chicago', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that token in curly brackets is replaced with the value when the name has whitespace.
	 */
	public function test_token_can_replace_entire_subject_with_token_field_has_html() {
		$plugin       = Contact_Form_Plugin::init();
		$subject      = '{email}';
		$field_values = array(
			'2_<strong>Email</strong>' => 'note',
		);

		$this->assertEquals( 'note', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that token with curly brackets is replaced with value.
	 *
	 * @author tonykova
	 */
	public function test_token_with_curly_brackets_can_be_replaced() {
		$plugin       = Contact_Form_Plugin::init();
		$subject      = '{subject {token}}';
		$field_values = array(
			'Subject {Token}' => 'Chicago',
		);

		$this->assertEquals( 'Chicago', $plugin->replace_tokens_with_input( $subject, $field_values ) );
	}

	/**
	 * Tests that the field attributes remain the same when no escaping is necessary.
	 *
	 * @author tonykova
	 */
	public function test_parse_contact_field_keeps_string_unchanged_when_no_escaping_necesssary() {
		$shortcode = '[contact-field label="Name" type="name" required="1"/][contact-field label="Email" type="email" required="1"/][contact-field label="asdasd" type="text"/][contact-field id="1" required derp herp asd lkj]adsasd[/contact-field]';
		$html      = do_shortcode( $shortcode );

		$this->assertEquals( $shortcode, $html );
	}

	/**
	 * Tests that the default label is added when no label is present.
	 */
	public function test_make_sure_that_we_add_default_label_when_non_is_present() {
		$shortcode = "[contact-field type='name' required='1' /]";
		$html      = do_shortcode( $shortcode );
		$this->assertEquals( '[contact-field type="name" required="1" label="Name"/]', $html );
	}

	/**
	 * Tests the empty options are removed from form fields.
	 */
	public function test_make_sure_that_we_remove_empty_options_from_form_field() {
		$shortcode = "[contact-field type='select' required='1' options='fun,,run' label='fun times' values='go,,have some fun'/]";
		$html      = do_shortcode( $shortcode );
		$this->assertEquals( '[contact-field type="select" required="1" options="fun,run" label="fun times" values="go,have some fun"/]', $html );
	}

	/**
	 * Tests shortcode with commas and brackets.
	 */
	public function test_array_values_with_commas_and_brackets() {
		$shortcode = "[contact-field type='radio' options='\"foo\",bar&#044; baz,&#091;b&#092;rackets&#093;' label='fun &#093;&#091; times'/]";
		$html      = do_shortcode( $shortcode );
		$this->assertEquals( '[contact-field type="radio" options="&quot;foo&quot;,bar&#044; baz,&#091;b&#092;rackets&#093;" label="fun &#093;&#091; times"/]', $html );
	}

	/**
	 * Tests Gutenblock input with commas and brackets.
	 */
	public function test_array_values_with_commas_and_brackets_from_gutenblock() {
		$attr  = array(
			'type'    => 'radio',
			'options' => array( '"foo"', 'bar, baz', '[b\\rackets]' ),
			'label'   => 'fun ][ times',
		);
		$block = array(
			'blockName' => 'jetpack/field-radio',
		);
		$html  = Contact_Form_Plugin::gutenblock_render_field_radio( $attr, '', new WP_Block( $block ) );
		$this->assertEquals( '[contact-field type="radio" options="&quot;foo&quot;,bar&#044; baz,&#091;b&#092;rackets&#093;" label="fun &#093;&#091; times"/]', $html );
	}

	/**
	 * Test for text field_renders
	 */
	public function test_make_sure_text_field_renders_as_expected() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'text',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-text',
			'class'               => 'lalala',
			'default'             => 'foo',
			'placeholder'         => 'PLACEHOLDTHIS!',
			'id'                  => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'text' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for email field_renders
	 */
	public function test_make_sure_email_field_renders_as_expected() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'email',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-email',
			'class'               => 'lalala',
			'default'             => 'foo',
			'placeholder'         => 'PLACEHOLDTHIS!',
			'id'                  => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'email' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for url field_renders
	 */
	public function test_make_sure_url_field_renders_as_expected() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'url',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-url',
			'class'               => 'lalala',
			'default'             => 'foo',
			'placeholder'         => 'PLACEHOLDTHIS!',
			'id'                  => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'text' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for telephone field_renders
	 */
	public function test_make_sure_telephone_field_renders_as_expected() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'telephone',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-telephone',
			'class'               => 'lalala',
			'default'             => 'foo',
			'placeholder'         => 'PLACEHOLDTHIS!',
			'id'                  => 'funID',
			'searchplaceholder'   => 'Search…',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'tel' ) );
		$this->assertValidPhoneField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for telephone field_renders with showcountryselector false
	 */
	public function test_make_sure_telephone_field_renders_as_expected_with_showcountryselector() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'telephone',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-telephone',
			'class'               => 'lalala',
			'default'             => '', // phone field doesn't expect a default value
			'placeholder'         => 'PLACEHOLDTHIS!',
			'id'                  => 'funID',
			'showcountryselector' => true,
			'searchplaceholder'   => 'Search…',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'tel' ) );
		$this->assertValidPhoneField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for date field_renders
	 */
	public function test_make_sure_date_field_renders_as_expected() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'date',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-date',
			'class'               => 'lalala',
			'default'             => 'foo',
			'placeholder'         => 'PLACEHOLDTHIS!',
			'id'                  => 'funID',
			'format'              => '(YYYY-MM-DD)',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'text' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for textarea field_renders.
	 */
	public function test_make_sure_textarea_field_renders_as_expected() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'textarea',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-textarea',
			'class'               => 'lalala',
			'default'             => 'foo',
			'placeholder'         => 'PLACEHOLDTHIS!',
			'id'                  => 'funID',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'textarea' ) );
		$this->assertValidField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for checkbox field_renders.
	 */
	public function test_make_sure_checkbox_field_renders_as_expected() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'checkbox',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-checkbox',
			'class'               => 'lalala',
			'default'             => 'foo',
			'placeholder'         => 'PLACEHOLDTHIS!',
			'id'                  => 'funID',
			'optionclasses'       => 'option-tomato option-lettuce',
			'optionstyles'        => 'color:cheese;font-size:11px;',
			'labelclasses'        => 'label-tomato label-lettuce',
			'labelstyles'         => 'color:beef;font-size:22px;',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'checkbox' ) );
		$this->assertValidCheckboxField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Multiple fields.
	 */
	public function test_make_sure_checkbox_multiple_field_renders_as_expected() {
		$attributes          = array(
			'label'               => 'fun',
			'type'                => 'checkbox-multiple',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-checkbox-multiple',
			'class'               => 'lalala',
			'default'             => 'option 1',
			'id'                  => 'funID',
			'options'             => array( 'option 1', 'option 2' ),
			'values'              => array( 'option 1', 'option 2' ),
			'optionclasses'       => 'option-cheese option-ham',
			'inputclasses'        => 'input-tomato input-lettuce',
			'optionsdata'         => wp_json_encode(
				array(
					array(
						'label' => 'option 1',
						'class' => 'has-text-color',
						'style' => 'color:caramel; font-size:14px;',
					),
					array(
						'label' => 'option 2',
						'class' => 'has-text-color',
						'style' => 'color:gummy; font-size:14px;',
					),
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_AMP
			),
		);
		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'checkbox' ) );
		$this->assertValidFieldMultiField( $this->render_field( $attributes ), $expected_attributes );
	}

	public function test_make_sure_form_outlined_checkbox_multiple_field_renders_as_expected() {
		$attributes              = array(
			'label'               => 'fun',
			'type'                => 'checkbox-multiple',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-checkbox-multiple',
			'class'               => 'lalala',
			'default'             => 'option 1',
			'id'                  => 'funID',
			'options'             => array( 'option 1', 'option 2' ),
			'values'              => array( 'option 1', 'option 2' ),
			'optionclasses'       => 'option-cheese option-ham',
			'inputclasses'        => 'input-tomato input-lettuce',
			'optionsdata'         => wp_json_encode(
				array(
					array(
						'label' => 'option 1',
						'class' => 'has-text-color',
						'style' => 'color:caramel; font-size:14px;',
					),
					array(
						'label' => 'option 2',
						'class' => 'has-text-color',
						'style' => 'color:gummy; font-size:14px;',
					),
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_AMP
			),
		);
		$contact_form_attributes = array(
			'className' => 'is-style-outlined',
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'checkbox' ) );

		$this->assertValidFieldMultiField( $this->render_field( $attributes, $contact_form_attributes ), $expected_attributes, $contact_form_attributes );
	}

	/**
	 * Test for radio field_renders
	 */
	public function test_make_sure_radio_field_renders_as_expected() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'radio',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-radio',
			'class'               => 'lalala',
			'default'             => 'option 1',
			'id'                  => 'funID',
			'options'             => array( 'option 1', 'option 2', 'option 3, or 4', 'back\\slash' ),
			'values'              => array( 'option 1', 'option 2', 'option [34]', '\\' ),
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'radio' ) );

		$this->assertValidFieldMultiField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for radio field_renders with block style classes.
	 */
	public function test_make_sure_radio_field_renders_as_expected_with_block_style_classes() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'radio',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-radio',
			'class'               => 'lalala',
			'default'             => 'option 1',
			'id'                  => 'funID',
			'options'             => array( 'option 1', 'option 2', 'option 3, or 4', 'back\\slash' ),
			'values'              => array( 'option 1', 'option 2', 'option [34]', '\\' ),
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'radio' ) );

		$this->assertValidFieldMultiField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Test for select field_renders
	 */
	public function test_make_sure_select_field_renders_as_expected() {
		$attributes = array(
			'label'               => 'fun',
			'type'                => 'select',
			'fieldwrapperclasses' => 'wp-block-jetpack-field-select',
			'class'               => 'lalala',
			'default'             => 'option 1',
			'id'                  => 'funID',
			'options'             => array( 'option 1', 'option 2', 'option 3, or 4', 'back\\slash' ),
			'values'              => array( 'option 1', 'option 2', 'option [34]', '\\' ),
		);

		$expected_attributes = array_merge( $attributes, array( 'input_type' => 'select' ) );
		$this->assertValidFieldMultiField( $this->render_field( $attributes ), $expected_attributes );
	}

	/**
	 * Renders a Contact_Form_Field.
	 *
	 * @param array $attributes An associative array of shortcode attributes.
	 * @param array $contact_form_attributes An associative array of attributes to pass to the Contact_Form constructor.
	 *
	 * @return string The field html string.
	 */
	public function render_field( $attributes, $contact_form_attributes = array() ) {
		$form  = new Contact_Form( $contact_form_attributes );
		$field = new Contact_Form_Field( $attributes, '', $form );
		return $field->render();
	}

	/**
	 * Gets the first div in the input html.
	 *
	 * @param string $html The html string.
	 * @param array  $contact_form_attributes An associative array containing the contact form's attributes.
	 *
	 * @return DOMElement The first div element.
	 */
	public function getCommonDiv( $html, $contact_form_attributes = array() ) {
		$doc              = new DOMDocument();
		$previous_setting = libxml_use_internal_errors( true );
		$doc->loadHTML( '<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
		libxml_use_internal_errors( $previous_setting );
		$first_el = $this->getFirstElement( $doc, 'div' );
		/**
		 * If the contact form has the `is-style-outlined` class name, we need to get the second div element.
		 * This is because, to achieve the outlined effect, the first div is the wrapper div, and the second div is the field wrapper div.
		 */
		if ( isset( $contact_form_attributes['className'] ) && 'is-style-outlined' === $contact_form_attributes['className'] ) {
			$first_el = $this->getFirstElement( $doc, 'div', 1 );
		}
		return $first_el;
	}

	/**
	 * Gets the first element in the given DOMDocument object.
	 *
	 * @param DOMDocument|DOMElement $dom The DOMDocument object.
	 * @param string                 $tag The tag name.
	 * @param int                    $index The index.
	 *
	 * @return DOMElement|null The first element with the given tag.
	 */
	public function getFirstElement( $dom, $tag, $index = 0 ) {
		$elements = $dom->getElementsByTagName( $tag );
		$element  = $elements->item( $index );
		return $element instanceof DOMElement ? $element : null;
	}

	/**
	 * Tests whether the class attribute in the wrapper div matches the field's class attribute value.
	 *
	 * @param DOMElement $wrapper_div The wrapper div.
	 * @param array      $attributes An associative array containing the field's attributes.
	 */
	public function assertFieldClasses( $wrapper_div, $attributes ) {
		if ( 'date' === $attributes['type'] ) {
			$attributes['class'] = 'jp-contact-form-date';
		}

		/*
		 * $attributes['optionclasses'] is passed to Contact_Form_Field->render_field()
		 * via $field_class and applied to the wrapper div.
		 */
		$options_classes_wrap = '';
		if ( isset( $attributes['optionclasses'] ) ) {
			$options_classes = explode( ' ', $attributes['optionclasses'] );
			foreach ( $options_classes as $option_class ) {
				$options_classes_wrap .= " {$option_class}-wrap";
			}
		}

		/*
		 * $attributes['inputclasses'] is passed to Contact_Form_Field->render_field()
		 * via $field_class applied to the wrapper div.
		 */
		$input_classes_wrap = '';
		if ( isset( $attributes['inputclasses'] ) ) {
			$input_classes = explode( ' ', $attributes['inputclasses'] );
			foreach ( $input_classes as $input_class ) {
				$input_classes_wrap .= " {$input_class}-wrap";
			}
		}

		// Multiple classes are also added to the wrapper div with the -wrap suffix.
		$classes_wrap = '';
		if ( isset( $attributes['class'] ) ) {
			$wrapper_classes = explode( ' ', $attributes['class'] );
			foreach ( $wrapper_classes as $wrapper_class ) {
				if ( $wrapper_class ) {
					$classes_wrap .= " {$wrapper_class}-wrap";
				}
			}
		}

		$css_class         = "wp-block-jetpack-field-{$attributes['type']} grunion-field-{$attributes['type']}-wrap{$classes_wrap}{$input_classes_wrap}{$options_classes_wrap} grunion-field-wrap";
		$wrapper_div_class = $wrapper_div->getAttribute( 'class' );

		$this->assertEquals(
			$css_class,
			$wrapper_div_class,
			'div class attribute doesn\'t match'
		);
	}

	/**
	 * Tests whether the input class attribute matches the field's class attribute value.
	 *
	 * @param DOMElement $input The input element.
	 * @param array      $attributes An associative array containing the field's attributes.
	 */
	public function assertInputClasses( $input, $attributes ) {
		/*
		 * $attributes['optionclasses'] is passed to
		 * Contact_Form_Field->render_checkbox_multiple_field() as $class
		 * and applied to the input.
		 */
		$options_classes_input = '';
		if ( isset( $attributes['optionclasses'] ) ) {
			$options_classes = explode( ' ', $attributes['optionclasses'] );
			foreach ( $options_classes as $option_class ) {
				$options_classes_input .= " {$option_class}";
			}
		}

		/*
		 * $attributes['inputclasses'] is passed to Contact_Form_Field->render_field()
		 * via $field_class applied to the wrapper div.
		 */
		$input_classes_input = '';
		if ( isset( $attributes['inputclasses'] ) ) {
			$input_classes = explode( ' ', $attributes['inputclasses'] );
			foreach ( $input_classes as $input_class ) {
				$input_classes_input .= " {$input_class}";
			}
		}

		// Multiple classes are also added to the input element, with the exception of is-style-* classes.
		$classes_input = '';
		if ( isset( $attributes['class'] ) ) {
			$input_classes = explode( ' ', $attributes['class'] );
			foreach ( $input_classes as $input_class ) {
				if ( strpos( $input_class, 'is-style-' ) !== false ) {
					continue;
				}
				$classes_input .= " {$input_class}";
			}
		}
		$this->assertEquals(
			$attributes['type'] . $classes_input . $input_classes_input . $options_classes_input . ' grunion-field',
			$input->getAttribute( 'class' ),
			'input class attribute doesn\'t match'
		);
	}

	/**
	 * Tests whether the label class attribute matches the field's class attribute value.
	 *
	 * @param DOMElement $label The input element.
	 * @param array      $attributes An associative array containing the field's attributes.
	 * @param string     $classes_prefix The prefix of the classes.
	 */
	public function assertLabelClasses( $label, $attributes, $classes_prefix ) {
		/*
		 * $attributes['optionclasses'] is added to the label class attribute in
		 * render functions, e.g., Contact_Form_Field->render_checkbox_field().
		 */
		$options_classes_input = '';
		if ( isset( $attributes['optionclasses'] ) ) {
			$options_classes = explode( ' ', $attributes['optionclasses'] );
			foreach ( $options_classes as $option_class ) {
				$options_classes_input .= " {$option_class}";
			}
		}

		/*
		 * $attributes['labelclasses'] is assigned to $this->label_classes and applied in
		 * render functions, e.g., Contact_Form_Field->render_checkbox_field().
		 */
		$label_classes_input = '';
		if ( isset( $attributes['labelclasses'] ) ) {
			$label_classes = explode( ' ', $attributes['labelclasses'] );
			foreach ( $label_classes as $label_class ) {
				$label_classes_input .= " {$label_class}";
			}
		}

		$this->assertEquals(
			$classes_prefix . $label_classes_input . $options_classes_input,
			$label->getAttribute( 'class' ),
			'input class attribute doesn\'t match'
		);
	}

	/**
	 * Tests whether the label in the wrapper div matches the field's label.
	 *
	 * @param DOMElement $wrapper_div The wrapper div.
	 * @param array      $attributes An associative array containing the field's attributes.
	 * @param string     $tag_name The tag used to label the field. Could be `legend` for checkboxes
	 *                                                       and radio buttons.
	 */
	public function assertFieldLabel( $wrapper_div, $attributes, $tag_name = 'label' ) {
		$type     = $attributes['type'];
		$label    = $this->getFirstElement( $wrapper_div, $tag_name );
		$expected = 'date' === $type ? $attributes['label'] . ' ' . $attributes['format'] : $attributes['label'];

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$this->assertEquals( $expected, trim( (string) $label->nodeValue ), 'Label is not what we expect it to be...' );
	}

	/**
	 * Tests whether a field is valid.
	 *
	 * @param string $html The html string.
	 * @param array  $attributes An associative array containing the field's attributes.
	 */
	public function assertValidField( $html, $attributes ) {

		$wrapper_div = $this->getCommonDiv( $html );
		$this->assertFieldClasses( $wrapper_div, $attributes );
		$this->assertFieldLabel( $wrapper_div, $attributes );

		// Get label.
		$label = $this->getFirstElement( $wrapper_div, 'label' );

		// Input.
		$input = (
			'textarea' === $attributes['type']
			? $this->getFirstElement( $wrapper_div, 'textarea' )
			: $this->getFirstElement( $wrapper_div, 'input' )
		);

		// Label matches for matches input ID.
		$this->assertEquals(
			$label->getAttribute( 'for' ),
			$input->getAttribute( 'id' ),
			'label for does not equal input ID!'
		);

		$this->assertEquals( $input->getAttribute( 'placeholder' ), $attributes['placeholder'], 'Placeholder doesn\'t match' );
		if ( 'textarea' === $attributes['type'] ) {
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$this->assertEquals( $input->nodeValue, $attributes['default'], 'value and default doesn\'t match' );
			$this->assertEquals(
				$label->getAttribute( 'for' ),
				'contact-form-comment-' . $input->getAttribute( 'name' ),
				'label for doesn\'t match the input name'
			);
		} else {
			$this->assertEquals( $input->getAttribute( 'type' ), $attributes['input_type'], 'Type doesn\'t match' );
			$this->assertEquals( $input->getAttribute( 'value' ), $attributes['default'], 'value and default doesn\'t match' );
			// Label matches for matches input name.
			$this->assertEquals(
				$label->getAttribute( 'for' ),
				$input->getAttribute( 'name' ),
				'label for doesn\'t match the input name'
			);
		}

		if ( 'date' === $attributes['type'] ) {
			$this->assertEquals(
				$input->getAttribute( 'class' ),
				"{$attributes['type']} jp-contact-form-date grunion-field",
				'input class attribute doesn\'t match'
			);
		} else {
			$this->assertEquals(
				$input->getAttribute( 'class' ),
				"{$attributes['type']} {$attributes['class']} grunion-field",
				'input class attribute doesn\'t match'
			);
		}
	}

	/**
	 * Tests whether a field is valid.
	 *
	 * @param string $html The html string.
	 * @param array  $attributes An associative array containing the field's attributes.
	 */
	public function assertValidPhoneField( $html, $attributes ) {

		if ( ! isset( $attributes['showcountryselector'] ) || ! $attributes['showcountryselector'] ) {
			return $this->assertValidField( $html, $attributes );
		}

		$wrapper_div = $this->getCommonDiv( $html );
		$this->assertFieldClasses( $wrapper_div, $attributes );
		$this->assertFieldLabel( $wrapper_div, $attributes );

		// Get label.
		$label = $this->getFirstElement( $wrapper_div, 'label' );

		// Inputs. (0 is the comboxbox search input, 1 is the visible input and 2 is the hidden, actual, input)
		$visible_input = $this->getFirstElement( $wrapper_div, 'input', 1 );
		$input         = $this->getFirstElement( $wrapper_div, 'input', 2 );

		// Label matches for matches input ID.
		$this->assertEquals(
			$label->getAttribute( 'for' ),
			$visible_input->getAttribute( 'id' ),
			'label for does not equal input ID!'
		);

		// Label matches for matches input name.
		$this->assertEquals(
			$label->getAttribute( 'for' ),
			$visible_input->getAttribute( 'name' ),
			'label for doesn\'t match the input name'
		);

		$this->assertEquals( $visible_input->getAttribute( 'placeholder' ), $attributes['placeholder'], 'Placeholder doesn\'t match' );
		$this->assertEquals( $visible_input->getAttribute( 'type' ), $attributes['input_type'], 'Type doesn\'t match' );

		$this->assertEquals( 'hidden', $input->getAttribute( 'type' ), 'Type doesn\'t match' );
		$this->assertEquals( $input->getAttribute( 'value' ), $attributes['default'], 'value and default doesn\'t match' );

		$this->assertEquals(
			'jetpack-field__input-element',
			$visible_input->getAttribute( 'class' ),
			'input class attribute doesn\'t match'
		);
	}

	/**
	 * Tests whether a checkbox field is valid.
	 *
	 * @param string $html The html string.
	 * @param array  $attributes An associative array containing the field's attributes.
	 */
	public function assertValidCheckboxField( $html, $attributes ) {

		$wrapper_div = $this->getCommonDiv( $html );
		$this->assertFieldClasses( $wrapper_div, $attributes );
		$this->assertFieldLabel( $wrapper_div, $attributes );

		$label = $wrapper_div->getElementsByTagName( 'label' )->item( 0 );
		$input = $wrapper_div->getElementsByTagName( 'input' )->item( 0 );

		$this->assertInstanceOf( DOMElement::class, $label );
		$this->assertInstanceOf( DOMElement::class, $input );

		$this->assertLabelClasses( $label, $attributes, 'grunion-field-label ' . $attributes['type'] );

		$this->assertEquals( $input->getAttribute( 'name' ), $attributes['id'], 'Input name doesn\'t match' );
		$this->assertEquals( 'Yes', $input->getAttribute( 'value' ), 'Input value doesn\'t match' );
		$this->assertEquals( $input->getAttribute( 'type' ), $attributes['type'], 'Input type doesn\'t match' );
		if ( $attributes['default'] ) {
			$this->assertEquals( 'checked', $input->getAttribute( 'checked' ), 'Input checked doesn\'t match' );
		}

		$styles = $label->getAttribute( 'style' );
		$this->assertEquals( $attributes['labelstyles'] . $attributes['optionstyles'], $styles, 'Label styles don\'t match' );
	}

	/**
	 * Tests whether a multifield contact form field is valid.
	 *
	 * @param string $html The html string.
	 * @param array  $attributes An associative array containing the field's attributes.
	 * @param array  $contact_form_attributes An associative array containing the contact form's attributes.
	 */
	public function assertValidFieldMultiField( $html, $attributes, $contact_form_attributes = array() ) {
		$wrapper_div = $this->getCommonDiv( $html, $contact_form_attributes );
		$this->assertFieldClasses( $wrapper_div, $attributes );

		// Inputs.
		if ( 'select' === $attributes['type'] ) {
			$label = $this->getFirstElement( $wrapper_div, 'label' );

			$this->assertFieldLabel( $wrapper_div, $attributes );
			$this->assertEquals( 'grunion-field-label select', $label->getAttribute( 'class' ), 'label class doesn\'t match' );

			$select = $this->getFirstElement( $wrapper_div, 'select' );
			$this->assertEquals(
				$label->getAttribute( 'for' ),
				$select->getAttribute( 'id' ),
				'label for does not equal input ID!'
			);

			$this->assertEquals(
				$label->getAttribute( 'for' ),
				$select->getAttribute( 'name' ),
				'label for does not equal input name!'
			);

			$select_wrapper = $wrapper_div->getElementsByTagName( 'div' )->item( 0 );
			// @phan-suppress-next-line PhanUndeclaredMethod
			$select_wrapper_class = $select_wrapper->getAttribute( 'class' ) ?? '';

			$this->assertEquals( 'contact-form__select-wrapper select ' . $attributes['class'] . ' grunion-field', $select_wrapper_class, ' select class does not match expected' );
			// Options.
			$options = $select->getElementsByTagName( 'option' );
			$n       = $options->length;
			$this->assertCount( $n, $attributes['options'], 'Number of inputs doesn\'t match number of options' );
			$this->assertCount( $n, $attributes['values'], 'Number of inputs doesn\'t match number of values' );
			for ( $i = 0; $i < $n; $i++ ) {
				$option = $options->item( $i );
				$this->assertInstanceOf( DOMElement::class, $option );
				$this->assertEquals( $option->getAttribute( 'value' ), $attributes['values'][ $i ], 'Input value doesn\'t match' );
				if ( 0 === $i ) {
					$this->assertEquals( 'selected', $option->getAttribute( 'selected' ), 'Input is not selected' );
				} else {
					$this->assertNotEquals( 'selected', $option->getAttribute( 'selected' ), 'Input is selected' );
				}
				//phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$this->assertEquals( $option->nodeValue, $attributes['options'][ $i ], 'Input does not match the option' );
			}
		} else {
			$label = $this->getFirstElement( $wrapper_div, 'legend' );

			$this->assertFieldLabel( $wrapper_div, $attributes, 'legend' );
			$this->assertEquals( 'grunion-field-label', $label->getAttribute( 'class' ), 'label class doesn\'t match' );
			// Radio and Checkboxes.
			$labels = $wrapper_div->getElementsByTagName( 'label' );
			$n      = $labels->length;
			$this->assertCount( $n, $attributes['options'], 'Number of inputs doesn\'t match number of options' );
			$this->assertCount( $n, $attributes['values'], 'Number of inputs doesn\'t match number of values' );
			for ( $i = 0; $i < $n; $i++ ) {
				$real_label = $labels->item( $i );
				// Labels can be wrappers (new markup): <label><input><span><span>OPTION VALUE</span></span></label>
				// Or siblings (old markup): <p><input /><label><span>OPTION VALUE</span></label></p>
				// @phan-suppress-next-line PhanUndeclaredMethod -- getElementsByTagName is available on DOMElement, which label elements are.
				$item_label = $real_label->getElementsByTagName( 'span' )->item( 0 );

				//phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$this->assertEquals( $item_label->nodeValue, $attributes['options'][ $i ] );

				// Try to get input from inside label (new markup)
				// @phan-suppress-next-line PhanUndeclaredMethod -- getElementsByTagName is available on DOMElement, which label elements are.
				$input = $real_label->getElementsByTagName( 'input' )->item( 0 );

				// If input is not inside label, get it from parent (old markup)
				// In old markup, each <p> has one input and one label, so always use item(0)
				if ( ! $input ) {
					// @phan-suppress-next-line PhanUndeclaredMethod -- parentElement was only added in PHP 8.3, and Phan can't know that parentNode will be an element.
					$parent_inputs = $real_label->parentNode->getElementsByTagName( 'input' ); //phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					$input         = $parent_inputs->item( 0 );
				}

				$this->assertInstanceOf( DOMElement::class, $input, 'Input element not found' );
				$this->assertEquals( $input->getAttribute( 'type' ), $attributes['input_type'], 'Type doesn\'t match' );
				if ( 'radio' === $attributes['input_type'] ) {
					$this->assertEquals( $input->getAttribute( 'name' ), $attributes['id'], 'Input name doesn\'t match' );
				} else {
					$this->assertEquals( $input->getAttribute( 'name' ), $attributes['id'] . '[]', 'Input name doesn\'t match' );
				}
				$this->assertEquals( $input->getAttribute( 'value' ), $attributes['values'][ $i ], 'Input value doesn\'t match' );

				$this->assertInputClasses( $input, $attributes );

				if ( 0 === $i ) {
					$this->assertEquals( 'checked', $input->getAttribute( 'checked' ), 'Input checked doesn\'t match' );
				} else {
					$this->assertNotEquals( 'checked', $input->getAttribute( 'checked' ), 'Input checked doesn\'t match' );
				}

				if ( ! empty( $attributes['optionsdata'] ) ) {
					$filtered = array_filter(
						json_decode( $attributes['optionsdata'] ),
						function ( $option ) use ( $input ) {
							return $option->label === $input->getAttribute( 'value' );
						}
					);
					// Block styles and classes are applied to the option wrapper.
					$option = $item_label->parentNode;  //phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

					$option_data = array_values( $filtered )[0] ?? null;
					if ( ! empty( $item_label->getAttribute( 'style' ) ) ) {
						$this->assertEquals( $option->getAttribute( 'style' ), $option_data->style, 'Style doesn\'t match' );
					}
					if ( ! empty( $item_label->getAttribute( 'class' ) ) ) {
						$this->assertContains( $option_data->class, explode( ' ', $option->getAttribute( 'class' ) ), 'Class doesn\'t match' );
					}
				}
			}
		}
	}

	/**
	 * Tests that the form attributes and values are properly escaped.
	 *
	 * @author tonykova
	 */
	public function test_parse_contact_field_escapes_things_inside_a_value_and_attribute_and_the_content() {

		$shortcode = "[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type=''email'' req'uired='1'/][contact-field label='asdasd' type='text'/][contact-field id='1' required 'derp' herp asd lkj]adsasd[/contact-field]";
		$html      = do_shortcode( $shortcode );

		/*
		 * The expected string has some quotes escaped, since we want to make
		 * sure we don't output anything harmful
		 */
		$this->assertEquals( '[contact-field label="Name" type="name" required="1"/][contact-field label="Email" type=&#039;&#039;email&#039;&#039; req&#039;uired=&#039;1&#039;/][contact-field label="asdasd" type="text"/][contact-field id="1" required derp herp asd lkj]adsasd[/contact-field]', $html );
	}

	/**
	 * Tests that the form content is trimmed
	 */
	public function test_parse_contact_field_trims_content() {

		$shortcode = '[contact-field id="1" required]     adsasd        [/contact-field]';
		$html      = do_shortcode( $shortcode );

		/*
		 * The expected string has some quotes escaped, since we want to make
		 * sure we don't output anything harmful
		 */
		$this->assertEquals( '[contact-field id="1" required]adsasd[/contact-field]', $html );
	}

	/**
	 * Tests the functionality of 'Contact_Form_Plugin::personal_data_exporter'.
	 *
	 * @author jaswrks
	 */
	public function test_personal_data_exporter() {
		// Contact_Form_Plugin::personal_data_exporter uses `get_posts` internally making it currently untestable outside of a WP environment.
		$this->markTestSkipped();
		// @phan-suppress-next-line PhanPluginUnreachableCode
		$this->add_field_values(
			array(
				'name'     => 'John Doe',
				'email'    => 'john@example.com',
				'dropdown' => 'First option',
				'radio'    => 'Second option',
				'text'     => 'Texty text',
			)
		);

		$feedback_ids = array();

		for ( $i = 1; $i <= 2; $i++ ) {
			$form = new Contact_Form(
				array(
					'to'      => '"john" <john@example.com>',
					'subject' => 'Hello world! [ ' . wp_rand() . ' ]',
				),
				'
					[contact-field label="Name" type="name" required="1"/]
					[contact-field label="Email" type="email" required="1"/]
					[contact-field label="Dropdown" type="select" options="First option,Second option,Third option"/]
					[contact-field label="Radio" type="radio" options="First option,Second option,Third option"/]
					[contact-field label="Text" type="text"/]
				'
			);
			$this->assertTrue(
				is_string( $form->process_submission() ),
				'form submission ' . $i
			);

			$feedback_ids[] = end( Posts::init()->posts )->ID;
		}

		$posts = array_map(
			function ( $id ) {
				$submission = get_post( $id );

				$this->assertEquals( 'feedback', $submission->post_type, 'Post type doesn\'t match!' );

				return $submission;
			},
			$feedback_ids
		);

		$export = $this->plugin->personal_data_exporter( 'john@example.com' );

		$this->assertCount( 2, $posts, 'posts count matches' );
		$this->assertCount( 2, $export['data'], 'export[data] count matches' );

		foreach ( $export['data'] as $data ) {
			$this->assertSame( 'feedback', $data['group_id'], 'group_id matches' );
			$this->assertSame( 'Feedback', $data['group_label'], 'group_label matches' );
			$this->assertSame( true, ! empty( $data['item_id'] ), 'has item_id key' );
			$this->assertCount( 10, $data['data'], 'has total expected data keys' );
		}
	}

	/**
	 * Tests the functionality of 'Contact_Form_Plugin::personal_data_eraser'.
	 *
	 * @author jaswrks
	 */
	public function test_personal_data_eraser() {
		// Contact_Form_Plugin::personal_data_exporter uses `get_posts` internally making it currently untestable outside of a WP environment.
		$this->markTestSkipped();
		// @phan-suppress-next-line PhanPluginUnreachableCode
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'email' => 'john@example.com',
			)
		);

		for ( $i = 1; $i <= 2; $i++ ) {
			$form = new Contact_Form(
				array(
					'to'      => '"john" <john@example.com>',
					'subject' => 'Hello world! [ ' . wp_rand() . ' ]',
				),
				'
					[contact-field label="Name" type="name" required="1"/]
					[contact-field label="Email" type="email" required="1"/]
				'
			);
			$this->assertTrue(
				is_string( $form->process_submission() ),
				'form submission ' . $i
			);
		}

		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 2, $posts, 'posts count matches before erasing' );

		$this->plugin->personal_data_eraser( 'john@example.com' );

		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 0, $posts, 'posts count matches after erasing' );
	}

	/**
	 * Tests the functionality of 'Contact_Form_Plugin::personal_data_eraser' with pagination.
	 */
	public function test_personal_data_eraser_pagination() {
		// Contact_Form_Plugin::personal_data_exporter uses `get_posts` internally making it currently untestable outside of a WP environment.
		$this->markTestSkipped();
		// @phan-suppress-next-line PhanPluginUnreachableCode
		$this->add_field_values(
			array(
				'name'  => 'Jane Doe',
				'email' => 'jane_doe@example.com',
			)
		);

		for ( $i = 1; $i <= 3; $i++ ) {
			$form = new Contact_Form(
				array(
					'to'      => '"jane" <jane_doe@example.com>',
					'subject' => 'Hello world! [ ' . wp_rand() . ' ]',
				),
				'
					[contact-field label="Name" type="name" required="1"/]
					[contact-field label="Email" type="email" required="1"/]
				'
			);
			$this->assertTrue(
				is_string( $form->process_submission() ),
				'form submission ' . $i
			);
		}

		$this->add_field_values(
			array(
				'name'  => 'Jane Doe Again',
				'email' => 'jane@example.com',
			)
		);

		$form = new Contact_Form(
			array(
				'to'      => '"jane" <jane@example.com>',
				'subject' => 'Hello world! [ ' . wp_rand() . ' ]',
			),
			'
				[contact-field label="Name" type="name" required="1"/]
				[contact-field label="Email" type="email" required="1"/]
			'
		);
		$this->assertTrue(
			is_string( $form->process_submission() ),
			'form submission ' . $i
		);

		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 4, $posts, 'posts count matches before erasing' );

		$this->plugin->_internal_personal_data_eraser( 'jane_doe@example.com', 1, 1 );
		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 3, $posts, 'posts count matches after page 1' );

		$this->plugin->_internal_personal_data_eraser( 'jane_doe@example.com', 2, 1 );
		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 2, $posts, 'posts count matches after page 2' );

		$this->plugin->_internal_personal_data_eraser( 'jane_doe@example.com', 3, 1 );
		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 1, $posts, 'posts count matches after page 3' );

		$this->plugin->_internal_personal_data_eraser( 'jane@example.com', 1, 1 );
		$posts = get_posts( array( 'post_type' => 'feedback' ) );
		$this->assertCount( 0, $posts, 'posts count matches after deleting the other feedback responder' );
	}

	/**
	 * Helper function that tracks the ids of the feedbacks that got created.
	 */
	public function track_feedback_inserted( $post_id ) {
		$this->track_feedback_inserted[] = $post_id;
	}
	/**
	 * Tests that multiple instances of the same form work correctly with unique IDs.
	 */
	public function test_multiple_form_instances_with_unique_ids() {
		global $post;

		add_action( 'grunion_after_feedback_post_inserted', array( $this, 'track_feedback_inserted' ), 10, 1 );

		$this->add_field_values(
			array(
				'name'    => 'First form name 1',
				'message' => 'First form message 1',
			),
			'g' . $post->ID
		);

		$form1 = new Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Message' type='textarea' required='1'/]" );
		// Submit first form
		$result1 = $form1->process_submission();

		$this->assertTrue( is_string( $result1 ), 'First form submission should be successful' );

		$this->add_field_values(
			array(
				'name'    => 'First form name 2',
				'message' => 'First form message 2',
			),
			'g' . $post->ID . '-1' // The 2 here is the count and 1 is now always set for page number which in this case is 1.
		);

		$form2   = new Contact_Form( array(), "[contact-field label='Name' type='name' required='1'/][contact-field label='Message' type='textarea' required='1'/]" );
		$result2 = $form2->process_submission();

		$this->assertTrue( is_string( $result2 ), 'First form submission should be successful' );

		// Verify that the forms have different IDs
		$this->assertNotEquals( $form1->get_attribute( 'id' ), $form2->get_attribute( 'id' ), 'Forms should have unique IDs' );

		remove_action( 'grunion_after_feedback_post_inserted', array( $this, 'track_feedback_inserted' ), 10 );

		$this->assertCount( 2, $this->track_feedback_inserted, 'The number of feedback forms that were inserted does not match! Expected 2.' );

		// Add assertion to ensure array is not empty
		$this->assertNotEmpty( $this->track_feedback_inserted, 'No feedback forms were inserted' );

		$count = 1;
		foreach ( $this->track_feedback_inserted as $feedback_id ) {
			$feedback = get_post( $feedback_id );
			$this->assertStringContainsString( 'First form name ' . $count, $feedback->post_content );
			$this->assertStringContainsString( 'First form message ' . $count, $feedback->post_content );
			++$count;
		}
	}

	/**
	 * Tests that forms properly determine defaults even if the user doesn't exist anymore.
	 */
	public function test_form_defaults_to_admin_email_on_no_user_data() {
		global $post;

		// Removing the user without reassinging posts.
		wp_delete_user( (int) $post->post_author );

		$this->add_field_values(
			array(
				'name'    => 'First form name 1',
				'message' => 'First form message 1',
			),
			'g' . $post->ID
		);

		$form1 = new Contact_Form(
			array(),
			"[contact-field label='Name' type='name' required='1'/]"
			. "[contact-field label='Message' type='textarea' required='1'/]"
		);

		$this->assertEquals( $form1->defaults['to'], get_option( 'admin_email' ), 'The default to address should equal the admin email.' );
	}

	/**
	 * Tests get_default_to_for_editor method with valid post author
	 */
	public function test_get_default_to_for_editor_with_valid_post_author() {
		$email     = 'author@example.com';
		$author_id = wp_insert_user(
			array(
				'user_email' => $email,
				'user_login' => 'test_author',
				'user_pass'  => 'password123',
				'role'       => 'editor',
			)
		);
		$post_id   = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'This is a test post.',
				'post_status'  => 'publish',
				'post_author'  => $author_id,
			)
		);

		$post   = get_post( $post_id );
		$result = Contact_Form::get_default_to_for_editor( $post );
		$this->assertEquals( $email, $result );

		wp_delete_user( $author_id );
		wp_delete_post( $post_id, true );
	}

	/**
	 * Tests get_default_to_for_editor method with null
	 */
	public function test_get_default_to_for_editor_with_null() {
		$result = Contact_Form::get_default_to_for_editor( null );
		$this->assertEquals( get_option( 'admin_email' ), $result );
	}

	/**
	 * Tests get_default_to method with valid post author.
	 */
	public function test_get_default_to_with_valid_post_author() {
		$email     = 'author@example.com';
		$author_id = wp_insert_user(
			array(
				'user_email' => $email,
				'user_login' => 'test_author',
				'user_pass'  => 'password123',
				'role'       => 'editor',
			)
		);
		$source    = $this->get_source( $author_id );
		$result    = Contact_Form::get_default_to( $author_id, $source );

		$this->assertEquals( $email, $result );

		wp_delete_user( $author_id );
		wp_delete_post( $source->get_id(), true );
	}

	/**
	 * Tests get_default_to method with valid post author.
	 */
	public function test_get_default_to_with_valid_post_author_subscriber() {
		$author_id = wp_insert_user(
			array(
				'user_email' => 'subscriber@example.com',
				'user_login' => 'test_author',
				'user_pass'  => 'password123',
				'role'       => 'subscriber',
			)
		);
		$source    = $this->get_source( $author_id );
		$result    = Contact_Form::get_default_to( $author_id, $source );

		$this->assertEquals( get_option( 'admin_email' ), $result );

		wp_delete_user( $author_id );
		wp_delete_post( $source->get_id(), true );
	}
	/**
	 * Helper function to create a Feedback_Source object from a post.
	 */
	public function get_source( $author_id ) {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'This is a test post.',
				'post_status'  => 'publish',
				'post_author'  => $author_id,
			)
		);

		return Feedback_Source::from_serialized(
			array(
				'source_id' => $post_id,
				'title'     => 'Test Post',
			)
		);
	}

	/**
	 * Tests get_default_to method with invalid post author ID.
	 */
	public function test_get_default_to_with_invalid_post_author() {
		$source = $this->get_source( 99999 );
		$result = Contact_Form::get_default_to( 99999, $source ); // Non-existent user ID

		wp_delete_post( $source->get_id(), true );
		$this->assertEquals( get_option( 'admin_email' ), $result );
	}

	/**
	 * Tests that the constructor handles non-integer $page global without warnings.
	 */
	public function test_constructor_handles_non_integer_page_global() {
		global $page;
		$original_page = $page;
		$page          = 'not-an-integer'; // Simulating theme overwriting $page

		$attributes = array( 'to' => 'test@example.com' );
		$form       = new Contact_Form( $attributes );

		// Verify no warnings and form is created successfully
		$this->assertInstanceOf( Contact_Form::class, $form );
		$page = $original_page; // Restore original value
	}

	/**
	 * Tests get_default_to method with null post author ID.
	 */
	public function test_get_default_to_with_null_post_author() {
		$result = Contact_Form::get_default_to( null );

		$this->assertEquals( get_option( 'admin_email' ), $result );
	}

	/**
	 * Tests get_default_to method with post author that has empty email.
	 */
	public function test_get_default_to_with_empty_author_email() {
		$author_id = wp_insert_user(
			array(
				'user_email' => '',
				'user_login' => 'test_author_no_email',
				'user_pass'  => 'password123',
				'role'       => 'editor',
			)
		);

		$source = $this->get_source( $author_id );

		$result = Contact_Form::get_default_to( $author_id, $source );

		$this->assertEquals( get_option( 'admin_email' ), $result );

		wp_delete_user( $author_id );
		wp_delete_post( $source->get_id(), true );
	}

	/**
	 * Tests get_default_subject method with post.
	 */
	public function test_get_default_subject_with_post() {
		global $post;

		$attributes = array();
		$result     = Contact_Form::get_default_subject( $attributes );

		$expected = '[' . get_option( 'blogname' ) . '] ' . Contact_Form_Plugin::strip_tags( $post->post_title );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Tests get_default_subject method with widget attribute.
	 */
	public function test_get_default_subject_with_widget() {
		global $post;

		$attributes = array( 'widget' => true );
		$result     = Contact_Form::get_default_subject( $attributes );

		$blog_name = get_option( 'blogname' );
		$expected  = '[' . $blog_name . '] ' . Contact_Form_Plugin::strip_tags( $post->post_title ) . ' Sidebar';
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Tests get_default_subject method with widget attribute set to false.
	 */
	public function test_get_default_subject_with_widget_false() {
		global $post;

		$attributes = array( 'widget' => false );
		$result     = Contact_Form::get_default_subject( $attributes );

		$expected = '[' . get_option( 'blogname' ) . '] ' . Contact_Form_Plugin::strip_tags( $post->post_title );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Tests get_default_subject method without post.
	 */
	public function test_get_default_subject_without_post() {
		global $post;
		$original_post = $post;
		$post          = null;

		$attributes = array();
		$result     = Contact_Form::get_default_subject( $attributes );

		$expected = '[' . get_option( 'blogname' ) . ']';
		$this->assertEquals( $expected, $result );

		// Restore original post
		$post = $original_post;
	}

	/**
	 * Tests get_default_subject method without post but with widget.
	 */
	public function test_get_default_subject_without_post_with_widget() {
		global $post;
		$original_post = $post;
		$post          = null;

		$attributes = array( 'widget' => true );
		$result     = Contact_Form::get_default_subject( $attributes );

		$expected = '[' . get_option( 'blogname' ) . '] Sidebar';
		$this->assertEquals( $expected, $result );

		// Restore original post
		$post = $original_post;
	}

	public function test_encode_form_to_jwt() {
		Constants::set_constant( 'JETPACK_BLOG_TOKEN', 'test.token' );
		$form = new Contact_Form(
			array(
				'to'      => 'hello@email.com',
				'subject' => 'test subject',
			),
			"[contact-field label='Name' type='name' required='1'/]"
			. "[contact-field label='Message' type='textarea' required='1'/]"
		);

		$jwt = $form->get_jwt();

		$this->assertNotEmpty( $jwt, 'JWT should not be empty' );
		$this->assertIsString( $jwt, 'JWT should be a string' );

		$form_copy = Contact_Form::get_instance_from_jwt( $jwt );

		// Decode the JWT to verify its structure
		$to_attribute = $form_copy->get_attribute( 'to' );
		$this->assertEquals( 'hello@email.com', $to_attribute );
		$this->assertEquals( $form_copy->get_attributes(), $form->get_attributes(), 'Form attributes should match' );
		$this->assertEquals( $form->get_attribute( 'to' ), $form_copy->get_attribute( 'to' ), 'Form IDs should match' );
		$this->assertEquals( $form->get_attribute( 'id' ), $form_copy->get_attribute( 'id' ), 'Form IDs should match' );

		$this->assertTrue( $form_copy->has_verified_jwt, 'Form copy should have verified JWT' );
		$this->assertFalse( $form->has_verified_jwt, 'Original form should not have verified JWT' );

		$this->assertEquals( $form->hash, $form_copy->hash, 'Form hashes should match' );
		$this->assertNotEmpty( $form_copy->hash, 'Form hash should not be empty' );

		$this->assertEquals( $form->get_field_ids(), $form_copy->get_field_ids(), 'Field IDs should match' );
		$this->assertNotEmpty( $form_copy->get_field_ids(), 'Fields should not be empty' );
		Constants::clear_single_constant( 'JETPACK_BLOG_TOKEN' );
	}

	/**
	 * A JWT issued while Form_Preview::is_preview_mode() is active carries
	 * is_test=true inside its serialized source. After decode, the form's
	 * source should report is_test() === true, which is how
	 * process_form_submission() recognizes preview submissions.
	 */
	public function test_jwt_source_is_flagged_as_test_when_rendered_in_preview_mode() {
		Constants::set_constant( 'JETPACK_BLOG_TOKEN', 'test.token' );

		// Flip the Form_Preview static flag for the duration of this test so
		// Feedback_Source::get_current() — invoked by get_jwt() — records the
		// preview context in the serialized source.
		$reflection   = new \ReflectionClass( Form_Preview::class );
		$preview_flag = $reflection->getProperty( 'is_preview_mode' );
		// PHP 8.1+ makes this a no-op and 8.5+ emits a deprecation notice.
		if ( PHP_VERSION_ID < 80100 ) {
			$preview_flag->setAccessible( true );
		}
		$previous_value = $preview_flag->getValue();
		$preview_flag->setValue( null, true );

		try {
			$form = new Contact_Form(
				array(
					'to'      => 'preview@example.com',
					'subject' => 'preview subject',
				),
				"[contact-field label='Name' type='name' required='1'/]"
			);

			$jwt = $form->get_jwt();

			$decoded = Contact_Form::get_instance_from_jwt( $jwt );

			$this->assertNotNull( $decoded, 'JWT should decode successfully.' );
			$this->assertTrue(
				$decoded->get_source()->is_test(),
				'A JWT issued while preview mode was active should carry is_test=true in its source.'
			);
		} finally {
			$preview_flag->setValue( null, $previous_value );
			Constants::clear_single_constant( 'JETPACK_BLOG_TOKEN' );
		}
	}

	/**
	 * Backward compatibility: a JWT issued before this feature shipped (or
	 * issued outside preview mode) has no is_test key in its source. After
	 * decode, the form's source should report is_test() === false, so the
	 * submission flows through the normal response pipeline. This matters
	 * because JWTs can live in cached HTML fragments across page loads.
	 */
	public function test_jwt_without_is_test_in_source_is_not_a_preview_submission() {
		Constants::set_constant( 'JETPACK_BLOG_TOKEN', 'test.token' );

		$form = new Contact_Form(
			array(
				'to'      => 'normal@example.com',
				'subject' => 'normal subject',
			),
			"[contact-field label='Name' type='name' required='1'/]"
		);

		$jwt = $form->get_jwt();

		// Sanity-check the serialized JWT does not carry is_test. We read the
		// unencrypted outer claims directly — implementation detail, but it
		// documents the backward-compat contract.
		$raw_parts       = explode( '.', $jwt );
		$raw_payload     = $raw_parts[1] ?? '';
		$decoded_json    = base64_decode( strtr( $raw_payload, '-_', '+/' ), true );
		$decoded_payload = $decoded_json === false ? null : json_decode( $decoded_json, true );
		$this->assertIsArray( $decoded_payload );
		$this->assertArrayHasKey( 'source', $decoded_payload );
		$this->assertArrayNotHasKey(
			'is_test',
			$decoded_payload['source'],
			'Outside preview mode the source must not include an is_test key so old cached JWTs stay compatible.'
		);

		$decoded = Contact_Form::get_instance_from_jwt( $jwt );

		$this->assertNotNull( $decoded );
		$this->assertFalse(
			$decoded->get_source()->is_test(),
			'A JWT without is_test in its source must decode to a regular (non-test) submission.'
		);

		Constants::clear_single_constant( 'JETPACK_BLOG_TOKEN' );
	}

	public function test_get_instance_from_jwt_uses_default_secret_when_no_token_secret() {
		// Ensure JETPACK_BLOG_TOKEN is not defined, so default secret is used
		Constants::clear_single_constant( 'JETPACK_BLOG_TOKEN' );

		$form = new Contact_Form(
			array(
				'to'      => 'test@email.com',
				'subject' => 'Test Form',
			),
			"[contact-field label='Name' type='name' required='1'/]"
		);

		$jwt = $form->get_jwt();
		$this->assertNotEmpty( $jwt, 'JWT should not be empty as it uses default secret' );
		$this->assertIsString( $jwt, 'JWT should be a string' );

		// The form should still be recoverable using the default secret
		$form_copy = Contact_Form::get_instance_from_jwt( $jwt );
		$this->assertNotNull( $form_copy, 'Should recover form using default secret' );
		$this->assertTrue( $form_copy->has_verified_jwt, 'Form should have verified JWT with default secret' );
	}

	public function test_get_instance_from_jwt_returns_with_all_attribute_data() {
		// Ensure JETPACK_BLOG_TOKEN is not defined
		Constants::clear_single_constant( 'JETPACK_BLOG_TOKEN' );

		$attributes = array(
			'to'                     => 'test@email.com',
			'subject'                => 'Test Form',
			'show_subject'           => 'no', // only used in back-compat mode
			'widget'                 => 'string',    // Not exposed to the user. Works with Contact_Form_Plugin::widget_atts()
			'block_template'         => null, // Not exposed to the user. Works with template_loader
			'block_template_part'    => null, // Not exposed to the user. Works with Contact_Form::parse()
			'submit_button_text'     => __( 'Submit', 'jetpack-forms' ),
			// These attributes come from the block editor, so use camel case instead of snake case.
			'customThankyou'         => 'message', // Whether to show a custom thankyou response after submitting a form. '' for no, 'message' for a custom message, 'redirect' to redirect to a new URL.
			'customThankyouHeading'  => __( 'Your message has been sent', 'jetpack-forms' ), // The text to show above customThankyouMessage.
			'customThankyouMessage'  => __( 'Thank you for your submission!', 'jetpack-forms' ), // The message to show when customThankyou is set to 'message'.
			'customThankyouRedirect' => '', // The URL to redirect to when customThankyou is set to 'redirect'.
			'jetpackCRM'             => true, // Whether Jetpack CRM should store the form submission.
			'className'              => 'string-class-name', // The class name to apply to the form.
			'postToUrl'              => 'https://example.com/submit', // The URL to post the form data to.
			'salesforceData'         => array( 'organizationId' => '12345' ),
			'hiddenFields'           => array(
				'hiddenField1' => 'value1',
				'hiddenField2' => 'value2',
			), // Hidden fields to include in the form.
			'stepTransition'         => 'fade-slide',
			'mailpoet'               => '',
			'emailNotifications'     => 'yes',
			'disableGoBack'          => false,
			'formTitle'              => 'Test Form',
		);
		// Add a widget ID to the attributes for testing.
		$expected_attributes                           = $attributes;
		$expected_attributes['jetpackCRM']             = '1';
		$expected_attributes['block_template']         = '';
		$expected_attributes['block_template_part']    = '';
		$expected_attributes['id']                     = 'widget-string';
		$expected_attributes['saveResponses']          = 'yes';
		$expected_attributes['disableGoBack']          = '';
		$expected_attributes['notificationRecipients'] = array();
		$expected_attributes['webhooks']               = array();
		$expected_attributes['disableSummary']         = '';
		$expected_attributes['confirmationType']       = 'text';
		$expected_attributes['hostingerReach']         = '';
		$expected_attributes['ref']                    = '';
		$expected_attributes['formTitle']              = 'Test Form';
		$form = new Contact_Form(
			$attributes,
			"[contact-field label='Name' type='name' required='1'/]"
		);

		$jwt = $form->get_jwt();
		$this->assertNotEmpty( $jwt, 'JWT should not be empty as it uses default secret' );
		$this->assertIsString( $jwt, 'JWT should be a string' );
		$form_copy = Contact_Form::get_instance_from_jwt( $jwt );

		$this->assertEquals( $form->get_attributes(), $form_copy->get_attributes(), 'Form attributes should match' );
		$this->assertNotNull( $form_copy, 'Should recover form using default secret' );
		$this->assertTrue( $form_copy->has_verified_jwt, 'Form should have verified JWT with default secret' );
		$this->assertEquals( $form->get_attribute( 'salesforceData' ), $form_copy->get_attribute( 'salesforceData' ), 'Form attributes should match' );
		$this->assertIsArray( $form_copy->get_attribute( 'salesforceData' ), 'salesforceData should be an array' );
		$this->assertArrayHasKey( 'organizationId', $form_copy->get_attribute( 'salesforceData' ), 'salesforceData should contain organizationId' );
		$this->assertSame( '12345', $form_copy->get_attribute( 'salesforceData' )['organizationId'], 'organizationId should match' );

		$this->assertEquals( $expected_attributes, $form_copy->get_attributes(), 'jetpackCRM should be true' );

		$this->assertEquals( $form->get_source(), $form_copy->get_source(), 'Form sources should match' );
	}

	public function test_get_instance_from_jwt_throws_exception_for_invalid_jwt() {
		Constants::set_constant( 'JETPACK_BLOG_TOKEN', 'test.token' );

		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Failed to decode JWT token' );

		Contact_Form::get_instance_from_jwt( 'invalid_jwt_token', true );

		Constants::clear_single_constant( 'JETPACK_BLOG_TOKEN' );
	}

	public function test_get_instance_from_jwt_returns_null_for_invalid_jwt() {
		Constants::set_constant( 'JETPACK_BLOG_TOKEN', 'test.token' );

		$form = Contact_Form::get_instance_from_jwt( 'invalid_jwt_token', false );
		$this->assertNull( $form, 'Form should be null if decoding fails and $throw_exception is false' );

		Constants::clear_single_constant( 'JETPACK_BLOG_TOKEN' );
	}

	public function test_jetpack_forms_jwt_decode_failure_filter_with_throw_exception() {
		Constants::set_constant( 'JETPACK_BLOG_TOKEN', 'test.token' );

		// Create a mock form instance to return from the filter
		$mock_form = new Contact_Form(
			array(
				'to' => 'test@example.com',
			),
			"[contact-field label='Name' type='name' required='1'/]"
		);

		// Add filter to return the mock form instead of throwing exception
		$filter_called = false;
		add_filter(
			'jetpack_forms_jwt_decode_failure',
			function ( $value, $jwt_token, $exception ) use ( $mock_form, &$filter_called ) {
				$filter_called = true;
				$this->assertNull( $value, 'Filter should receive null as first parameter' );
				$this->assertEquals( 'invalid_jwt_token', $jwt_token, 'Filter should receive the JWT token' );
				$this->assertInstanceOf( \Exception::class, $exception, 'Filter should receive an Exception instance' );
				return $mock_form;
			},
			10,
			3
		);

		// Call with throw_exception = true, but filter should prevent exception
		$result = Contact_Form::get_instance_from_jwt( 'invalid_jwt_token', true );

		$this->assertTrue( $filter_called, 'Filter should have been called' );
		$this->assertSame( $mock_form, $result, 'Filter should return the mock form instead of throwing exception' );

		remove_all_filters( 'jetpack_forms_jwt_decode_failure' );
		Constants::clear_single_constant( 'JETPACK_BLOG_TOKEN' );
	}

	public function test_jetpack_forms_jwt_decode_failure_filter_without_throw_exception() {
		Constants::set_constant( 'JETPACK_BLOG_TOKEN', 'test.token' );

		// Add filter to return a custom value
		$custom_return_value = 'custom_fallback';
		$filter_called       = false;
		add_filter(
			'jetpack_forms_jwt_decode_failure',
			function ( $value, $jwt_token, $exception ) use ( $custom_return_value, &$filter_called ) {
				$filter_called = true;
				$this->assertNull( $value, 'Filter should receive null as first parameter' );
				$this->assertEquals( 'invalid_jwt_token', $jwt_token, 'Filter should receive the JWT token' );
				$this->assertInstanceOf( \Exception::class, $exception, 'Filter should receive an Exception instance' );
				return $custom_return_value;
			},
			10,
			3
		);

		// Call with throw_exception = false
		$result = Contact_Form::get_instance_from_jwt( 'invalid_jwt_token', false );

		$this->assertTrue( $filter_called, 'Filter should have been called' );
		$this->assertEquals( $custom_return_value, $result, 'Filter should return the custom value' );

		remove_all_filters( 'jetpack_forms_jwt_decode_failure' );
		Constants::clear_single_constant( 'JETPACK_BLOG_TOKEN' );
	}

	public function test_jetpack_forms_jwt_decode_failure_filter_returns_null_still_throws() {
		Constants::set_constant( 'JETPACK_BLOG_TOKEN', 'test.token' );

		// Add filter that returns null (should allow exception to be thrown)
		$filter_called = false;
		add_filter(
			'jetpack_forms_jwt_decode_failure',
			function ( $value, $jwt_token, $exception ) use ( &$filter_called ) {
				$filter_called = true;
				$this->assertNull( $value, 'Filter should receive null as first parameter' );
				$this->assertEquals( 'invalid_jwt_token', $jwt_token, 'Filter should receive the JWT token' );
				$this->assertInstanceOf( \Exception::class, $exception, 'Filter should receive an Exception instance' );
				return null; // Returning null means "don't override default behavior"
			},
			10,
			3
		);

		$this->expectException( \Exception::class );
		$this->expectExceptionMessage( 'Failed to decode JWT token' );

		Contact_Form::get_instance_from_jwt( 'invalid_jwt_token', true );

		// Note: Code after exception won't be reached, but filter will have been called
		remove_all_filters( 'jetpack_forms_jwt_decode_failure' );
		Constants::clear_single_constant( 'JETPACK_BLOG_TOKEN' );
	}

	/**
	 * Test compute_id method with basic attributes
	 */
	public function test_compute_id_with_basic_attributes() {
		global $post;

		$attributes = array(
			'to'      => 'test@example.com',
			'subject' => 'Test Subject',
		);

		$computed_id = Contact_Form::compute_id( $attributes, $post );

		$this->assertIsString( $computed_id, 'Computed ID should be a string' );
		$this->assertNotEmpty( $computed_id, 'Computed ID should not be empty' );
		$this->assertStringContainsString( (string) $post->ID, $computed_id, 'Computed ID should contain post ID' );
	}

	/**
	 * Test compute_id method with null post
	 */
	public function test_compute_id_with_null_post() {
		$attributes = array(
			'to'      => 'test@example.com',
			'subject' => 'Test Subject',
		);

		$computed_id = Contact_Form::compute_id( $attributes, null );
		$this->assertIsString( $computed_id, 'Computed ID should be a string' );
		$this->assertNotEmpty( $computed_id, 'Computed ID should not be empty' );
		$this->assertStringNotContainsString( (string) $this->post->ID, $computed_id, 'Computed ID should not contain post ID when post is null' );
	}

	/**
	 * Test compute_id method with widget attribute
	 */
	public function test_compute_id_with_widget_attribute() {
		global $post;

		$attributes = array(
			'to'     => 'test@example.com',
			'widget' => 'sidebar-1',
		);

		$computed_id = Contact_Form::compute_id( $attributes, $post );

		$this->assertIsString( $computed_id, 'Computed ID should be a string' );
		$this->assertStringContainsString( 'widget', $computed_id, 'Widget form ID should contain "widget"' );
		$this->assertStringContainsString( 'sidebar-1', $computed_id, 'Widget form ID should contain widget ID' );
	}

	/**
	 * Test compute_id method with different page numbers
	 */
	public function test_compute_id_with_different_page_numbers() {
		global $post;

		$attributes = array(
			'to'      => 'test@example.com',
			'subject' => 'Test Subject',
		);

		$id_page_1 = Contact_Form::compute_id( $attributes, $post, 1 );
		$id_page_2 = Contact_Form::compute_id( $attributes, $post, 2 );

		$this->assertNotEquals( $id_page_1, $id_page_2, 'IDs should be different for different page numbers' );
		$this->assertEquals( $post->ID, $id_page_1, 'Page 1 ID should match post ID' );
		$this->assertEquals( $post->ID . '-2', $id_page_2, 'Page 2 ID should match post ID' );
	}

	/**
	 * Test compute_id method generates consistent IDs
	 */
	public function test_compute_id_generates_consistent_ids() {
		global $post;

		$attributes = array(
			'to'      => 'test@example.com',
			'subject' => 'Test Subject',
		);

		$id1 = Contact_Form::compute_id( $attributes, $post, 1 );
		$id2 = Contact_Form::compute_id( $attributes, $post, 1 );

		$this->assertEquals( $id1, $id2, 'Same attributes should generate same ID' );
	}

	/**
	 * Test compute_id method with different attributes generates different IDs
	 */
	public function test_compute_id_with_different_attributes_generates_different_ids() {
		$attributes1 = array(
			'to'      => 'test1@example.com',
			'subject' => 'Test Subject 1',
		);

		$form1 = new Contact_Form( $attributes1 );
		$id1   = $form1->get_attribute( 'id' );

		$attributes2 = array(
			'to'      => 'test2@example.com',
			'subject' => 'Test Subject 2',
		);

		$form2 = new Contact_Form( $attributes2 );
		$id2   = $form2->get_attribute( 'id' );

		$this->assertNotEquals( $id1, $id2, 'Different form objects should generate equals ID if the match is IDs' );
	}

	/**
	 * Test compute_id method with different attributes generates different IDs
	 */
	public function test_contact_form_constructor_set_id_parameter() {

		$attributes1 = array(
			'to'      => 'test1@example.com',
			'subject' => 'Test Subject 1',
			'id'      => 'form-1',
		);

		$form1 = new Contact_Form( $attributes1, '', false );
		$id1   = $form1->get_attribute( 'id' );

		$form2 = new Contact_Form( $attributes1, '', false );
		$id2   = $form2->get_attribute( 'id' );

		$this->assertEquals( 'form-1', $id1, 'If you pass false for the 3rd parameter, the ID should match the one provided in the attributes' );
		$this->assertEquals( 'form-1', $id2, 'If you pass false for the 3rd parameter, the ID should match the one provided in the attributes' );
	}

	/**
	 * Test compute_id method with empty attributes
	 */
	public function test_compute_id_with_empty_attributes() {
		global $post;

		$attributes = array();

		$computed_id = Contact_Form::compute_id( $attributes, $post );

		$this->assertIsString( $computed_id, 'Computed ID should be a string even with empty attributes' );
		$this->assertNotEmpty( $computed_id, 'Computed ID should not be empty even with empty attributes' );
	}

	/**
	 * Test compute_id method with special characters in attributes
	 */
	public function test_compute_id_with_special_characters() {
		global $post;

		$attributes = array(
			'to'      => 'test+special@example.com',
			'subject' => 'Test Subject with "quotes" and symbols!@#$%',
		);

		$computed_id = Contact_Form::compute_id( $attributes, $post );

		$this->assertIsString( $computed_id, 'Computed ID should handle special characters' );
		$this->assertNotEmpty( $computed_id, 'Computed ID should not be empty with special characters' );
	}

	/**
	 * Test compute_id method with form count increment
	 */
	public function test_compute_id_with_form_count_increment() {
		global $post;

		// Reset forms count for consistent testing
		Contact_Form::$forms = array();

		$attributes = array(
			'to'      => 'test@example.com',
			'subject' => 'Test Subject',
		);

		// Create first form to increment count
		$id1   = Contact_Form::compute_id( $attributes, $post );
		$form1 = new Contact_Form( $attributes );

		// Create second form to increment count again
		$id2   = Contact_Form::compute_id( $attributes, $post );
		$form2 = new Contact_Form( $attributes );

		$id3 = Contact_Form::compute_id( $attributes, $post );
		$id4 = Contact_Form::compute_id( $attributes, $post );

		$this->assertNotEquals( $id1, $id2, 'IDs should be different when form count increases' );
		$this->assertEquals( $id1, $form1->get_attribute( 'id' ), 'IDs should match the form object' );
		$this->assertEquals( $id2, $form2->get_attribute( 'id' ), 'IDs should match the form object' );
		$this->assertEquals( 2, Contact_Form::get_forms_count(), 'Forms count should be 2 after second form creation' );
		$this->assertEquals( $id3, $id4, "IDs should match since calling the function should't have side effects" );
	}

	/**
	 * Test compute_id method with block template attributes
	 */
	public function test_compute_id_with_block_template_attributes() {
		global $post;

		$attributes = array(
			'to'                  => 'test@example.com',
			'block_template'      => 'contact-template',
			'block_template_part' => 'header-part',
		);

		$computed_id = Contact_Form::compute_id( $attributes, $post );

		$this->assertIsString( $computed_id, 'Computed ID should handle block template attributes' );
		$this->assertNotEmpty( $computed_id, 'Computed ID should not be empty with block template attributes' );
	}

	/**
	 * Test compute_id method with all possible attribute combinations
	 */
	public function test_compute_id_with_comprehensive_attributes() {
		global $post;

		$attributes = array(
			'to'                    => 'comprehensive@example.com',
			'subject'               => 'Comprehensive Test',
			'widget'                => false,
			'block_template'        => 'test-template',
			'block_template_part'   => 'test-part',
			'customThankyou'        => 'message',
			'customThankyouMessage' => 'Thank you!',
			'jetpackCRM'            => true,
			'className'             => 'test-class',
			'hiddenFields'          => array( 'field1' => 'value1' ),
		);

		$computed_id = Contact_Form::compute_id( $attributes, $post, 3 );

		$this->assertIsString( $computed_id, 'Computed ID should handle comprehensive attributes' );
		$this->assertNotEmpty( $computed_id, 'Computed ID should not be empty with comprehensive attributes' );
		$this->assertStringContainsString( '-3', $computed_id, 'ID should contain page number' );
	}

	/**
	 * Test compute_id method maintains uniqueness across different posts
	 */
	public function test_compute_id_uniqueness_across_posts() {
		// Create another post for testing
		$second_post_id = wp_insert_post(
			array(
				'post_title'   => 'Second Test Post',
				'post_content' => 'Second test content',
				'post_status'  => 'publish',
				'post_author'  => $this->post->post_author,
			),
			true
		);

		$second_post = get_post( $second_post_id );

		$attributes = array(
			'to'      => 'test@example.com',
			'subject' => 'Same Subject',
		);

		$id_post1 = Contact_Form::compute_id( $attributes, $this->post );
		$id_post2 = Contact_Form::compute_id( $attributes, $second_post );

		$this->assertNotEquals( $id_post1, $id_post2, 'Same attributes on different posts should generate different IDs' );

		// Clean up
		wp_delete_post( $second_post_id, true );
	}

	/**
	 * Test compute_id method with numeric values in attributes
	 */
	public function test_compute_id_with_numeric_attributes() {
		global $post;

		$attributes = array(
			'to'          => 'test@example.com',
			'subject'     => 'Test Subject',
			'widget'      => 123,
			'some_number' => 456.789,
		);

		$computed_id = Contact_Form::compute_id( $attributes, $post );

		$this->assertIsString( $computed_id, 'Computed ID should handle numeric attributes' );
		$this->assertNotEmpty( $computed_id, 'Computed ID should not be empty with numeric attributes' );
	}

	/**
	 * Test compute_id method with boolean attributes
	 */
	public function test_compute_id_with_boolean_attributes() {
		global $post;

		$attributes = array(
			'to'         => 'test@example.com',
			'jetpackCRM' => true,
			'widget'     => false,
			'required'   => true,
		);

		$computed_id = Contact_Form::compute_id( $attributes, $post );

		$this->assertIsString( $computed_id, 'Computed ID should handle boolean attributes' );
		$this->assertNotEmpty( $computed_id, 'Computed ID should not be empty with boolean attributes' );
	}

	/**
	 * Test compute_id method with array attributes
	 */
	public function test_compute_id_with_array_attributes() {
		global $post;

		$attributes = array(
			'to'             => 'test@example.com',
			'hiddenFields'   => array(
				'field1' => 'value1',
				'field2' => 'value2',
			),
			'salesforceData' => array(
				'organizationId' => '12345',
			),
		);

		$computed_id = Contact_Form::compute_id( $attributes, $post );

		$this->assertIsString( $computed_id, 'Computed ID should handle array attributes' );
		$this->assertNotEmpty( $computed_id, 'Computed ID should not be empty with array attributes' );
	}

	public function test_test_context_in_form_id_creation() {

		$attributes   = array();
		$post_post_id = wp_insert_post(
			array(
				'post_title'   => 'First Test Post',
				'post_content' => 'First test content',
				'post_status'  => 'publish',
				'post_author'  => $this->post->post_author,
			),
			true
		);
		$post         = get_post( $post_post_id );

		$form_id = Contact_Form::compute_id( $attributes, $post );
		Contact_Form::increment_form_context_count( $attributes, $post );
		$this->assertStringContainsString( (string) $post_post_id, $form_id, 'Form ID should contain the post ID of the first post' );

		$form_id_2 = Contact_Form::compute_id( $attributes, $post );
		$this->assertStringContainsString( (string) $post_post_id, $form_id_2, 'Form ID should contain the post ID of the first post' );
		$this->assertNotEquals( $form_id, $form_id_2, 'Form IDs should be different for different instances' );

		$second_post_id = wp_insert_post(
			array(
				'post_title'   => 'Second Test Post',
				'post_content' => 'Second test content',
				'post_status'  => 'publish',
				'post_author'  => $this->post->post_author,
			),
			true
		);
		$second_post    = get_post( $second_post_id );

		$form_id_3 = Contact_Form::compute_id( $attributes, $second_post );
		Contact_Form::increment_form_context_count( $attributes, $second_post );

		$this->assertStringContainsString( (string) $second_post_id, $form_id_3, 'Form ID should contain the post ID of the second post' );

		$form_id_4 = Contact_Form::compute_id( $attributes, $second_post );
		$this->assertStringContainsString( (string) $second_post_id, $form_id_4, 'Form ID should contain the post ID of the second post' );
		$this->assertNotEquals( $form_id_3, $form_id_4, 'Form IDs should be different for different instances' );

		$attributes['widget'] = 'sidebar';

		$form_id_5 = Contact_Form::compute_id( $attributes, $second_post );
		Contact_Form::increment_form_context_count( $attributes, $second_post );
		$this->assertStringContainsString( 'widget-sidebar', $form_id_5, 'Form ID should contain the post ID of the second post' );

		$form_id_6 = Contact_Form::compute_id( $attributes, $second_post );
		$this->assertStringContainsString( 'widget-sidebar', $form_id_6, 'Form ID should contain the post ID of the second post' );
		$this->assertNotEquals( $form_id_5, $form_id_6, 'Form IDs should be different for different instances' );

		// Assert that we have 6 unique form ids.
		$this->assertCount( 6, array_unique( array( $form_id, $form_id_2, $form_id_3, $form_id_4, $form_id_5, $form_id_6 ) ), 'There should be 6 unique forms' );
	}

	/**
	 * Test get_post_property method with various scenarios
	 */
	public function test_get_post_property() {
		global $post;

		// Test null/false/empty inputs
		$this->assertNull( Contact_Form::get_post_property( null, 'ID' ), 'Should return null for null post data' );
		$this->assertNull( Contact_Form::get_post_property( false, 'ID' ), 'Should return null for false post data' );
		$this->assertNull( Contact_Form::get_post_property( 'not an object nor array', 'ID' ), 'Should return null for non-object/array post data' );

		// Test object properties
		$this->assertEquals( $post->ID, Contact_Form::get_post_property( $post, 'ID' ), 'Should return object property value' );
		$this->assertEquals( $post->post_title, Contact_Form::get_post_property( $post, 'post_title' ), 'Should return object string property' );
		$this->assertNull( Contact_Form::get_post_property( $post, 'non_existent_property' ), 'Should return null for non-existent object property' );

		// Test array properties
		$array_post = array(
			'ID'         => 123,
			'post_title' => 'Test Post',
			'meta'       => array( 'key' => 'value' ),
		);
		$this->assertEquals( 123, Contact_Form::get_post_property( $array_post, 'ID' ), 'Should return array property value' );
		$this->assertEquals( 'Test Post', Contact_Form::get_post_property( $array_post, 'post_title' ), 'Should return array string property' );
		$this->assertEquals( array( 'key' => 'value' ), Contact_Form::get_post_property( $array_post, 'meta' ), 'Should return array property with nested array' );
		$this->assertNull( Contact_Form::get_post_property( $array_post, 'non_existent_property' ), 'Should return null for non-existent array property' );

		// Test empty array
		$this->assertNull( Contact_Form::get_post_property( array(), 'ID' ), 'Should return null for empty array' );
	}

	/**
	 * Test get_redirect_url method with various scenarios
	 */
	public function test_get_redirect_url() {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Test Post',
				'post_content' => 'Test content',
				'post_status'  => 'publish',
				'post_author'  => $this->post->post_author,
			),
			true
		);

		$attributes = array(
			'customThankyou'         => 'redirect',
			'customThankyouRedirect' => 'https://example.com/thank-you',
		);

		$form = new Contact_Form( $attributes, '' );

		// Test with custom thank you redirect URL.
		$redirect_url = $form->get_redirect_url( array(), 123, $post_id );
		$this->assertEquals( 'https://example.com/thank-you', $redirect_url, 'Redirect URL should match the custom thank you redirect URL.' );

		// Test with no custom thank you redirect URL.
		unset( $attributes['customThankyouRedirect'] );
		$previous_request_uri         = $_REQUEST['_wp_http_referer'] ?? '';
		$_REQUEST['_wp_http_referer'] = '/test-uri';

		$form_no_redirect         = new Contact_Form( $attributes, '' );
		$redirect_url_no_redirect = $form_no_redirect->get_redirect_url( array(), 123, $post_id );

		if ( ! empty( $previous_request_uri ) ) {
			$_REQUEST['_wp_http_referer'] = $previous_request_uri;
		} else {
			unset( $_REQUEST['_wp_http_referer'] );
		}
		// Restore the original request URI.

		$this->assertEquals( '/test-uri', $redirect_url_no_redirect, 'Redirect URL should be empty when no custom thank you redirect URL is set.' );

		$form_has_filter = new Contact_Form( $attributes, '' );
		add_filter( 'grunion_contact_form_redirect_url', array( $this, 'redirect_filter' ), 10 );
		$redirect_url_via_filter = $form_has_filter->get_redirect_url( array(), 123, $post_id );
		remove_filter( 'grunion_contact_form_redirect_url', array( $this, 'redirect_filter' ), 10 );
		$this->assertEquals( 'https://example.com/redirected', $redirect_url_via_filter, 'Redirect URL should match the filter return value.' );
	}

	public function redirect_filter() {
		return 'https://example.com/redirected';
	}

	public function test_has_custom_redirect() {
		$attributes = array(
			'customThankyou'         => 'redirect',
			'customThankyouRedirect' => 'https://example.com/thank-you',
		);

		$form = new Contact_Form( $attributes, '' );

		$this->assertTrue( $form->has_custom_redirect(), 'Form should have a custom redirect URL.' );

		unset( $attributes['customThankyouRedirect'] );

		$form_no_redirect = new Contact_Form( $attributes, '' );

		$this->assertFalse( $form_no_redirect->has_custom_redirect(), 'Form should not have a custom redirect URL.' );

		$form_has_filter = new Contact_Form( $attributes, '' );
		add_filter( 'grunion_contact_form_redirect_url', array( $this, 'redirect_filter' ), 10, 3 );
		$this->assertTrue( $form_has_filter->has_custom_redirect(), 'Form should have a custom redirect URL.' );
		remove_filter( 'grunion_contact_form_redirect_url', array( $this, 'redirect_filter' ), 10 );
	}

	public function test_validate_form() {
		$name    = 'John Doe';
		$email   = 'john@example.com';
		$choose  = array( 'truth' );
		$form_id = Utility::get_form_id();

		// Create a form submission
		$_POST = Utility::get_post_request(
			array(
				'name'   => $name,
				'email'  => $email,
				'choose' => $choose,
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			'[contact-field label="Name" type="name" required="1"/][contact-field label="Email" type="email" required="1"/][contact-field label="Choose" type="checkbox-multiple"  options="truth,dare"  required="1"]'
		);

		$form->validate();
		unset( $_POST ); // Clean up the global $_POST variable after the test.
		$this->assertEquals( array(), $form->get_error_messages() );
		$this->assertFalse( $form->has_errors(), 'Form should not have errors after validation.' );
	}

	public function test_validate_form_with_errors() {
		$name    = ''; // required field
		$email   = 'hello@world'; // Invalid email
		$choose  = array( '' ); // required field
		$pick    = array( 'not-a-value' ); // required field
		$form_id = Utility::get_form_id();

		// Create a form submission
		$_POST = Utility::get_post_request(
			array(
				'name'           => $name,
				'email'          => $email,
				'invite'         => 'hello@world', // not required
				'choose'         => $choose,
				'chooseradio'    => 'not-a-value',
				'radioempty'     => '',
				'radioemptydata' => '',
				'pick'           => $pick,
				'pickvalue'      => array( 'truth' ), // a value but not a part of the values array.
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			"
			[contact-field label='Name' type='name' required='1'/]
			[contact-field label='Email' type='email' required='1'/]
			[contact-field label='Invite' type='email' /]
			[contact-field label='Choose' type='checkbox-multiple' options='truth,dare' required='1'/]
			[contact-field label='Choose Radio' type='radio' options='truth,dare' required='1'/]
			[contact-field label='Choose Empty' type='radio' options='truth,dare' required='1'/]
			[contact-field label='Choose Empty Data' type='radio' options='truth,dare' optionsdata='&#091;{&quot;label&quot;:&quot;hello  there&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 1&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 2&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#093;' required='1'/]
			[contact-field label='Pick' type='checkbox-multiple' options='truth,dare' required='1'/]
			[contact-field label='Pick Value' type='checkbox-multiple' options='truth,dare' values='one,two' required='1'/]"
		);
		$form->validate();
		unset( $_POST ); // Clean up the global $_POST variable after the test.

		// message should be not empty.
		$this->assertTrue( $form->has_errors(), 'Form should not have errors after validation.' );
		$this->assertEquals(
			array(
				'Name field is required.',
				'Email requires a valid email address.',
				'Invite requires a valid email address.',
				'Choose requires at least one selection.',
				'Choose Radio requires at least one selection.',
				'Choose Empty requires at least one selection.',
				'Choose Empty Data requires at least one selection.',
				'Pick requires at least one selection.',
				'Pick Value requires at least one selection.',
			),
			$form->get_error_messages()
		);
		Contact_Form::reset_errors();
		$this->assertFalse( $form->has_errors(), 'Form should not have errors after validation.' );
		$this->assertEquals( array(), $form->get_error_messages() );

		$form->add_error( 'custom_error', 'This is a custom error message.' );
		$this->assertTrue( $form->has_errors(), 'Form should have custom error after adding it.' );
		$this->assertEquals( array( 'This is a custom error message.' ), $form->get_error_messages(), 'Form should return custom error message.' );

		// Reset errors and check again.
		Contact_Form::reset_errors( $form->get_attribute( 'id' ) );
		$this->assertFalse( $form->has_errors(), 'Form should not have errors after resetting.' );
		$this->assertEquals( array(), $form->get_error_messages() );
	}

	public function test_validate_empty_form() {
		$name    = '';
		$email   = '';
		$choose  = array( '' );
		$form_id = Utility::get_form_id();

		// Create a form submission
		$_POST = Utility::get_post_request(
			array(
				'name'   => $name,
				'email'  => $email,
				'choose' => $choose,
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			'[contact-field label="Name" type="name" /][contact-field label="Email" type="email" /][contact-field label="Choose" type="checkbox-multiple" options="truth,dare" /]'
		);
		$form->validate();
		unset( $_POST ); // Clean up the global $_POST variable after the test.

		// message should be not empty.
		$this->assertTrue( $form->has_errors(), 'Form should not have errors after validation.' );
		$this->assertEquals( array( 'Please fill out at least one field.' ), $form->get_error_messages() );
		Contact_Form::reset_errors();
	}

	public function test_validate_checkboxes_form() {
		$form_id = Utility::get_form_id();

		// Create a form submission
		$_POST = Utility::get_post_request(
			array(

				'choose'                      => array( 'truth 🙈 ' ),
				'chooseoptions'               => array( 'hello  there' ),
				'chooseseveraloptions'        => array( 'hello, there' ),
				'chooseseveraloptionsspecial' => array( 'hello, world' ),
				'chooseseveraloptionsvalues'  => array( 'one' ),
				'choosevalueoptionsdata'      => array( 'one' ),

			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			'
			[contact-field label="Choose" type="checkbox-multiple" options="truth 🙈 , dare" ]
			[contact-field type="checkbox-multiple" label="Choose options" labelclasses="wp-block-jetpack-label" optionsclasses="wp-block-jetpack-options" options="hello  there,option 1,option 2" optionsdata="&#091;{&quot;label&quot;:&quot;hello  there&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 1&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 2&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#093;" stylevariationattributes="" stylevariationclasses="" stylevariationstyles="" fieldwrapperclasses="wp-block-jetpack-field-checkbox-multiple"]&lt;div&gt;
&lt;ul class=&quot;wp-block-jetpack-options&quot;&gt;
&lt;/ul&gt;
&lt;/div&gt;[/contact-field]
[contact-field type="checkbox-multiple" label="Choose several options" labelclasses="wp-block-jetpack-label" optionsclasses="wp-block-jetpack-options" options="hello, there,option 1,option 2" optionsdata="&#091;{&quot;label&quot;:&quot;hello&#044; there&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 1&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 2&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#093;" stylevariationattributes="" stylevariationclasses="" stylevariationstyles="" fieldwrapperclasses="wp-block-jetpack-field-checkbox-multiple"]&lt;div&gt;
&lt;ul class=&quot;wp-block-jetpack-options&quot;&gt;
&lt;/ul&gt;
&lt;/div&gt;[/contact-field]
[contact-field label="Choose several options special" type="checkbox-multiple" options="hello&#044; world,dare" /]
[contact-field label="Choose several options  values" type="checkbox-multiple" options="hello world,dare" values="one,two" /]
[contact-field type="checkbox-multiple" label="Choose value options data" labelclasses="wp-block-jetpack-label" optionsclasses="wp-block-jetpack-options" options="hello, there,option 1,option 2" values="one,two" optionsdata="&#091;{&quot;label&quot;:&quot;hello&#044; there&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 1&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#044;{&quot;label&quot;:&quot;option 2&quot;&#044;&quot;class&quot;:&quot;wp-block-jetpack-option&quot;}&#093;" stylevariationattributes="" stylevariationclasses="" stylevariationstyles="" fieldwrapperclasses="wp-block-jetpack-field-checkbox-multiple"]&lt;div&gt;
&lt;ul class=&quot;wp-block-jetpack-options&quot;&gt;
&lt;/ul&gt;
&lt;/div&gt;[/contact-field]
'
		);
		$form->validate();
		unset( $_POST ); // Clean up the global $_POST variable after the test.

		// message should be not empty.
		$this->assertFalse( $form->has_errors(), 'Form should not have errors after validation.' );

		Contact_Form::reset_errors();
	}

	public function test_validate_radio_form() {
		$name    = '';
		$email   = '';
		$form_id = Utility::get_form_id();

		// Create a form submission
		$_POST = Utility::get_post_request(
			array(
				'name'   => $name,
				'email'  => $email,
				'choose' => 'hello, world',
			),
			'g' . $form_id
		);

		$form = new Contact_Form(
			array(
				'title'       => 'Test Form',
				'description' => 'This is a test form.',
			),
			'[contact-field label="Choose" type="radio" options="hello&#044; world,dare" /]'
		);
		$form->validate();
		unset( $_POST ); // Clean up the global $_POST variable after the test.

		$this->assertEquals( array(), $form->get_error_messages() );
		// message should be not empty.
		$this->assertFalse( $form->has_errors(), 'Form should not have errors after validation.' );

		Contact_Form::reset_errors();
	}

	/**
	 * Test that email is sent when emailNotifications is 'yes' (default behavior)
	 */
	public function test_process_submission_sends_email_when_email_notifications_enabled() {
		// Fill field values
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'email' => 'john@example.com',
			)
		);

		// Track if wp_mail was called
		$email_sent = false;
		add_filter(
			'wp_mail',
			function ( $args ) use ( &$email_sent ) {
				$email_sent = true;
				$this->assertContains( 'john <john@example.com>', $args['to'] );
				$this->assertEquals( 'Contact Form', $args['subject'] );
				return $args;
			}
		);

		// Initialize a form with emailNotifications explicitly set to 'yes'
		$form = new Contact_Form(
			array(
				'to'                 => 'john@example.com',
				'subject'            => 'Contact Form',
				'emailNotifications' => 'yes',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]"
		);

		$result = $form->process_submission();
		$this->assertNotNull( $result );
		$this->assertTrue( $email_sent, 'Email should be sent when emailNotifications is "yes"' );
	}

	/**
	 * Test that email is NOT sent when emailNotifications is 'no'
	 */
	public function test_process_submission_does_not_send_email_when_email_notifications_disabled() {
		// Fill field values
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'email' => 'john@example.com',
			)
		);

		// Track if wp_mail was called
		$email_sent = false;
		add_filter(
			'wp_mail',
			function ( $args ) use ( &$email_sent ) {
				$email_sent = true;
				return $args;
			}
		);

		// Initialize a form with emailNotifications set to 'no'
		$form = new Contact_Form(
			array(
				'to'                 => 'john@example.com',
				'subject'            => 'Contact Form',
				'emailNotifications' => 'no',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]"
		);

		$result = $form->process_submission();
		$this->assertNotNull( $result );
		$this->assertFalse( $email_sent, 'Email should NOT be sent when emailNotifications is "no"' );
	}

	/**
	 * Test that emailNotifications does not affect spam email behavior
	 */
	public function test_process_submission_email_notifications_does_not_affect_spam_behavior() {
		// Fill field values
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'email' => 'john@example.com',
			)
		);

		// Mark submission as spam
		add_filter( 'jetpack_contact_form_is_spam', '__return_true', 11 );

		// Track if wp_mail was called for spam
		$spam_email_sent = false;
		add_filter(
			'wp_mail',
			function ( $args ) use ( &$spam_email_sent ) {
				$spam_email_sent = true;
				$this->assertStringContainsString( '***SPAM***', $args['subject'] );
				return $args;
			}
		);

		// Initialize a form with emailNotifications set to 'no' but spam email enabled
		$form = new Contact_Form(
			array(
				'to'                 => 'john@example.com',
				'subject'            => 'Contact Form',
				'emailNotifications' => 'no',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]"
		);

		$result = $form->process_submission();
		$this->assertNotNull( $result );
		// Spam email should still be sent regardless of emailNotifications setting
		$this->assertFalse( $spam_email_sent, 'Spam email should NOT be sent by default even when emailNotifications is disabled' );

		// Now enable spam email sending
		add_filter( 'grunion_still_email_spam', '__return_true' );

		$spam_email_sent = false;
		$result          = $form->process_submission();
		$this->assertNotNull( $result );
		// Spam email should be sent when grunion_still_email_spam filter is true
		$this->assertTrue( $spam_email_sent, 'Spam email should be sent when grunion_still_email_spam filter is true, regardless of emailNotifications setting' );
	}

	/**
	 * Test that emailNotifications defaults to 'yes' when not specified
	 */
	public function test_process_submission_sends_email_when_email_notifications_not_specified() {
		// Fill field values
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'email' => 'john@example.com',
			)
		);

		// Track if wp_mail was called
		$email_sent = false;
		add_filter(
			'wp_mail',
			function ( $args ) use ( &$email_sent ) {
				$email_sent = true;
				$this->assertContains( 'john <john@example.com>', $args['to'] );
				return $args;
			}
		);

		// Initialize a form without specifying emailNotifications (should default to 'yes')
		$form = new Contact_Form(
			array(
				'to'      => 'john@example.com',
				'subject' => 'Contact Form',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]"
		);

		$result = $form->process_submission();
		$this->assertNotNull( $result );
		$this->assertTrue( $email_sent, 'Email should be sent when emailNotifications is not specified (defaults to "yes")' );
	}

	/**
	 * Test that email is not sent when grunion_should_send_email filter is false and emailNotifications is set to 'yes'
	 */
	public function test_process_submission_does_not_send_email_when_grunion_should_send_email_filter_is_false_and_emailNotifications_is_set_to_yes() {
		// Fill field values
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'email' => 'john@example.com',
			)
		);

		add_filter( 'grunion_should_send_email', '__return_false' );

		// Track if wp_mail was called
		$email_sent = false;
		add_filter(
			'wp_mail',
			function ( $args ) use ( &$email_sent ) {
				$email_sent = true;
				return $args;
			}
		);

		$form = new Contact_Form(
			array(
				'to'                 => 'john@example.com',
				'subject'            => 'Contact Form',
				'emailNotifications' => 'yes',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]"
		);

		$result = $form->process_submission();
		$this->assertNotNull( $result );
		$this->assertFalse( $email_sent, 'Email should NOT be sent when grunion_should_send_email filter is false' );

		remove_filter( 'grunion_should_send_email', '__return_false' );
	}

	/**
	 * Test that email is sent when grunion_should_send_email filter is true and emailNotifications is set to 'no'
	 */
	public function test_process_submission_sends_email_when_grunion_should_send_email_filter_is_true_and_emailNotifications_is_set_to_no() {
		// Fill field values
		$this->add_field_values(
			array(
				'name'  => 'John Doe',
				'email' => 'john@example.com',
			)
		);

		add_filter( 'grunion_should_send_email', '__return_true' );

		// Track if wp_mail was called
		$email_sent = false;
		add_filter(
			'wp_mail',
			function ( $args ) use ( &$email_sent ) {
				$email_sent = true;
				$this->assertContains( 'john <john@example.com>', $args['to'] );
				return $args;
			}
		);

		$form = new Contact_Form(
			array(
				'to'                 => 'john@example.com',
				'subject'            => 'Contact Form',
				'emailNotifications' => 'no',
			),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]"
		);

		$result = $form->process_submission();
		$this->assertNotNull( $result );
		$this->assertTrue( $email_sent, 'Email should be sent when grunion_should_send_email filter is true and emailNotifications is set to no' );

		remove_filter( 'grunion_should_send_email', '__return_true' );
	}

	/**
	 * Test that parse method handles null or non-array fields gracefully without fatal error.
	 * This tests the safety check added at line 738 to prevent PHP fatal errors
	 * when $form->fields is null or not countable.
	 */
	public function test_parse_handles_null_fields_without_fatal_error() {
		// Test 1: Create a form and set fields to null to simulate the error condition
		$form = new Contact_Form(
			array( 'to' => 'test@example.com' ),
			'' // Empty content
		);

		// Manually set fields to null to simulate the error condition
		// @phan-suppress-next-line PhanTypeMismatchPropertyProbablyReal -- purely for testing purposes
		$form->fields = null;

		// Now test that parse() doesn't throw a fatal error when accessing $form->fields
		$result = Contact_Form::parse(
			array( 'to' => 'test@example.com' ),
			'',
			array()
		);

		// Should return a valid string without throwing a fatal error
		$this->assertIsString( $result, 'Parse should return a string even when fields is null' );

		// Test 2: Test with fields set to false
		$form2 = new Contact_Form(
			array( 'to' => 'test@example.com' ),
			''
		);
		// @phan-suppress-next-line PhanTypeMismatchPropertyProbablyReal -- purely for testing purposes
		$form2->fields = false;

		$result2 = Contact_Form::parse(
			array( 'to' => 'test@example.com' ),
			'',
			array()
		);

		$this->assertIsString( $result2, 'Parse should return a string even when fields is false' );

		// Test 3: Test with empty array (should identify as not single input form)
		$form3         = new Contact_Form(
			array( 'to' => 'test@example.com' ),
			''
		);
		$form3->fields = array();

		$result3 = Contact_Form::parse(
			array( 'to' => 'test@example.com' ),
			'',
			array()
		);

		$this->assertIsString( $result3, 'Parse should return a string with empty fields array' );
		$this->assertStringNotContainsString( 'is-single-input-form', $result3, 'Should not have single-input-form class with empty fields' );

		// Test 4: Test with single field (should identify as single input form)
		$result4 = Contact_Form::parse(
			array( 'to' => 'test@example.com' ),
			"[contact-field label='Name' type='name' required='1'/]",
			array()
		);

		$this->assertIsString( $result4, 'Parse should return a string with single field' );
		$this->assertStringContainsString( 'is-single-input-form', $result4, 'Should have single-input-form class with one field' );

		// Test 5: Test with multiple fields (should not be single input form)
		$result5 = Contact_Form::parse(
			array( 'to' => 'test@example.com' ),
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]",
			array()
		);

		$this->assertIsString( $result5, 'Parse should return a string with multiple fields' );
		$this->assertStringNotContainsString( 'is-single-input-form', $result5, 'Should not have single-input-form class with multiple fields' );
	}

	/**
	 * Test is_webhooks_enabled returns true by default.
	 */
	public function test_is_webhooks_enabled_default() {
		$this->assertTrue( \Automattic\Jetpack\Forms\Jetpack_Forms::is_webhooks_enabled() );
	}

	/**
	 * Test is_webhooks_enabled filter can be used to enable webhooks.
	 */
	public function test_is_webhooks_enabled_filter_enable() {
		add_filter( 'jetpack_forms_webhooks_enabled', '__return_true' );

		$this->assertTrue( \Automattic\Jetpack\Forms\Jetpack_Forms::is_webhooks_enabled() );

		remove_filter( 'jetpack_forms_webhooks_enabled', '__return_true' );
	}

	/**
	 * Test is_webhooks_enabled filter can be used to keep webhooks disabled.
	 */
	public function test_is_webhooks_enabled_filter_disable() {
		add_filter( 'jetpack_forms_webhooks_enabled', '__return_false' );

		$this->assertFalse( \Automattic\Jetpack\Forms\Jetpack_Forms::is_webhooks_enabled() );

		remove_filter( 'jetpack_forms_webhooks_enabled', '__return_false' );
	}

	/**
	 * Create a user with the given role and a published post authored by them.
	 *
	 * @param string $role Role to assign to the post author.
	 * @return int The created post ID.
	 */
	private function create_post_for_role( $role ) {
		$author_id = wp_insert_user(
			array(
				'user_email' => $role . '-webhook-author@example.com',
				'user_login' => 'webhook_' . $role . '_author',
				'user_pass'  => 'abc123',
				'role'       => $role,
			)
		);

		return wp_insert_post(
			array(
				'post_title'  => ucfirst( $role ) . ' authored form',
				'post_status' => 'publish',
				'post_author' => $author_id,
			),
			true
		);
	}

	/**
	 * Build a Contact_Form whose source resolves to the given post id.
	 *
	 * @param array      $attributes  Form attributes.
	 * @param int|string $source_id   Source id the form should report: a numeric post id, or a
	 *                                non-numeric widget/block-template id.
	 * @param string     $source_type Source type (single, widget, block_template, block_template_part).
	 * @return Contact_Form
	 */
	private function make_form_with_source( $attributes, $source_id, $source_type = 'single' ) {
		$source = Feedback_Source::from_serialized(
			array(
				'source_id'   => $source_id,
				'title'       => 'Test Post',
				'source_type' => $source_type,
			)
		);

		return $this->make_form_with_source_object( $attributes, $source );
	}

	/**
	 * Build a Contact_Form that reports the given (already constructed) source.
	 *
	 * @param array           $attributes Form attributes.
	 * @param Feedback_Source $source     Source to report from get_source().
	 * @return Contact_Form
	 */
	private function make_form_with_source_object( $attributes, $source ) {
		return new class( $attributes, $source ) extends Contact_Form {
			/**
			 * Source to report from get_source().
			 *
			 * @var Feedback_Source
			 */
			private $test_source;

			/**
			 * Constructor that sets attributes and source directly, skipping parsing.
			 *
			 * @param array           $attributes Form attributes.
			 * @param Feedback_Source $source     Source to report from get_source().
			 */
			public function __construct( $attributes, $source ) {
				$this->attributes  = $attributes;
				$this->fields      = array();
				$this->test_source = $source;
			}

			/**
			 * Return the test source instead of resolving it from the request.
			 *
			 * @return Feedback_Source
			 */
			public function get_source() {
				return $this->test_source;
			}
		};
	}

	/**
	 * Resolve a Feedback_Source through get_current() with a render-scoped global set, then clear
	 * the global. Mirrors how a real template/template-part render establishes the source type.
	 *
	 * @param string $global_key The render-scoped global to set (e.g. grunion_block_template_id).
	 * @param string $value      The value to set it to (the template/part id).
	 * @param array  $attributes Attributes to pass to get_current().
	 * @return Feedback_Source
	 */
	private function source_from_render_global( $global_key, $value, $attributes = array() ) {
		$GLOBALS[ $global_key ] = $value;
		$source                 = Feedback_Source::get_current( $attributes );
		unset( $GLOBALS[ $global_key ] );
		return $source;
	}

	/**
	 * Invoke the private reconcile_content_destinations() method on the plugin singleton.
	 *
	 * @param Contact_Form $form Form to reconcile.
	 */
	private function invoke_reconcile_content_destinations( $form ) {
		$method = new \ReflectionMethod( Contact_Form_Plugin::class, 'reconcile_content_destinations' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$method->invoke( Contact_Form_Plugin::init(), $form );
	}

	/**
	 * Test should_honor_content_destinations returns true when the source author can manage options.
	 */
	public function test_should_honor_content_destinations_for_capable_author() {
		$post_id = $this->create_post_for_role( 'administrator' );

		// WorDBless can clear role/option state between tests, so grant the
		// capability via the user_has_cap filter rather than relying on the role.
		$grant = function ( $allcaps ) {
			$allcaps['manage_options'] = true;
			return $allcaps;
		};
		add_filter( 'user_has_cap', $grant );

		$this->assertTrue( \Automattic\Jetpack\Forms\Jetpack_Forms::should_honor_content_destinations( $post_id ) );

		remove_filter( 'user_has_cap', $grant );
	}

	/**
	 * Test should_honor_content_destinations denies an author-role author.
	 */
	public function test_should_not_honor_content_destinations_for_author_role() {
		$this->assertFalse(
			\Automattic\Jetpack\Forms\Jetpack_Forms::should_honor_content_destinations( $this->create_post_for_role( 'author' ) )
		);
	}

	/**
	 * Test should_honor_content_destinations denies a contributor-role author.
	 */
	public function test_should_not_honor_content_destinations_for_contributor_role() {
		$this->assertFalse(
			\Automattic\Jetpack\Forms\Jetpack_Forms::should_honor_content_destinations( $this->create_post_for_role( 'contributor' ) )
		);
	}

	/**
	 * Test should_honor_content_destinations returns false when the source cannot be resolved.
	 */
	public function test_should_honor_content_destinations_returns_false_for_missing_post() {
		$this->assertFalse( \Automattic\Jetpack\Forms\Jetpack_Forms::should_honor_content_destinations( 0 ) );
		$this->assertFalse( \Automattic\Jetpack\Forms\Jetpack_Forms::should_honor_content_destinations( 999999 ) );
	}

	/**
	 * Test should_honor_content_destinations honors block-template, template-part and widget
	 * sources, whose (non-numeric) ids have no post author but require an administrator-tier
	 * `edit_theme_options` capability to author.
	 */
	public function test_should_honor_content_destinations_for_admin_tier_sources() {
		foreach ( Feedback_Source::ADMIN_TIER_SOURCE_TYPES as $source_type ) {
			$this->assertTrue(
				\Automattic\Jetpack\Forms\Jetpack_Forms::should_honor_content_destinations( 'mytheme//page', $source_type ),
				"Destinations should be honored for $source_type sources."
			);
		}
	}

	/**
	 * Test should_honor_content_destinations still denies an unresolved non-numeric source whose
	 * type is not an admin-tier authoring surface (the conservative catch-all).
	 */
	public function test_should_not_honor_content_destinations_for_unknown_non_numeric_source() {
		$this->assertFalse(
			\Automattic\Jetpack\Forms\Jetpack_Forms::should_honor_content_destinations( 'mytheme//page', 'single' )
		);
	}

	/**
	 * Test reconcile_content_destinations drops every content-configured destination
	 * when the source post author may not configure them.
	 */
	public function test_reconcile_content_destinations_drops_destinations_for_unauthorized_author() {
		$form = $this->make_form_with_source(
			array(
				'webhooks'       => array(
					array(
						'webhook_id' => 'w',
						'url'        => 'https://example.com/hook',
						'enabled'    => true,
						'format'     => 'json',
						'method'     => 'POST',
					),
				),
				'postToUrl'      => array(
					'url'     => 'https://example.com/post',
					'enabled' => true,
				),
				'salesforceData' => array( 'organizationId' => '12345' ),
			),
			$this->create_post_for_role( 'author' )
		);

		$this->invoke_reconcile_content_destinations( $form );

		$this->assertSame( array(), $form->attributes['webhooks'], 'Webhooks should be dropped.' );
		$this->assertSame( array(), $form->attributes['postToUrl'], 'postToUrl should be dropped.' );
		$this->assertNull( $form->attributes['salesforceData'], 'salesforceData should be dropped.' );
	}

	/**
	 * Test reconcile_content_destinations drops a Salesforce-only configuration for an
	 * unauthorized author, confirming the early return does not skip salesforce-only forms.
	 */
	public function test_reconcile_content_destinations_drops_salesforce_only_for_unauthorized_author() {
		$form = $this->make_form_with_source(
			array( 'salesforceData' => array( 'organizationId' => '12345' ) ),
			$this->create_post_for_role( 'author' )
		);

		$this->invoke_reconcile_content_destinations( $form );

		$this->assertNull( $form->attributes['salesforceData'], 'salesforceData should be dropped for a Salesforce-only form.' );
	}

	/**
	 * Test reconcile_content_destinations keeps destinations and migrates postToUrl
	 * when the source post author may configure them.
	 */
	public function test_reconcile_content_destinations_keeps_destinations_for_capable_author() {
		$form = $this->make_form_with_source(
			array(
				'webhooks'       => array(
					array(
						'webhook_id' => 'w',
						'url'        => 'https://example.com/hook',
						'enabled'    => true,
						'format'     => 'json',
						'method'     => 'POST',
					),
				),
				'postToUrl'      => array(
					'url'     => 'https://example.com/post',
					'enabled' => true,
				),
				'salesforceData' => array( 'organizationId' => '12345' ),
			),
			$this->create_post_for_role( 'administrator' )
		);

		$grant = function ( $allcaps ) {
			$allcaps['manage_options'] = true;
			return $allcaps;
		};
		add_filter( 'user_has_cap', $grant );

		$this->invoke_reconcile_content_destinations( $form );

		remove_filter( 'user_has_cap', $grant );

		// postToUrl is migrated into the webhooks collection, so both entries survive.
		$this->assertCount( 2, $form->attributes['webhooks'], 'Configured webhook and migrated postToUrl should remain.' );
		$this->assertSame( array( 'organizationId' => '12345' ), $form->attributes['salesforceData'], 'salesforceData should be preserved.' );
	}

	/**
	 * Test reconcile_content_destinations keeps destinations for a block-template source built
	 * through the real render path: the source type comes from the render-scoped global, not from
	 * a content attribute, so this exercises a reachable state.
	 *
	 * Regression test for forms placed in FSE block templates, template parts and widgets whose
	 * webhooks/postToUrl/Salesforce destinations were silently dropped from Jetpack 15.9.
	 */
	public function test_reconcile_content_destinations_keeps_destinations_for_block_template_source() {
		$source = $this->source_from_render_global( 'grunion_block_template_id', 'mytheme//single' );

		$this->assertSame( 'block_template', $source->get_source_type(), 'Render-scoped global should yield a block_template source.' );

		$form = $this->make_form_with_source_object(
			array(
				'webhooks'       => array(
					array(
						'webhook_id' => 'w',
						'url'        => 'https://example.com/hook',
						'enabled'    => true,
						'format'     => 'json',
						'method'     => 'POST',
					),
				),
				'postToUrl'      => array(
					'url'     => 'https://example.com/post',
					'enabled' => true,
				),
				'salesforceData' => array( 'organizationId' => '12345' ),
			),
			$source
		);

		$this->invoke_reconcile_content_destinations( $form );

		// postToUrl is migrated into the webhooks collection, so both entries survive.
		$this->assertCount( 2, $form->attributes['webhooks'], 'Configured webhook and migrated postToUrl should remain for a block-template form.' );
		$this->assertSame( array( 'organizationId' => '12345' ), $form->attributes['salesforceData'], 'salesforceData should be preserved for a block-template form.' );
	}

	/**
	 * Test that Feedback_Source::get_current() anchors the block_template / block_template_part
	 * source types to render-scoped globals, NOT to content attributes.
	 *
	 * A content attribute can be supplied by a post author who lacks edit_theme_options, so
	 * trusting it would let a post-content form masquerade as an admin-authored template source
	 * and have its content-declared destinations honored. This guards that hole.
	 */
	public function test_content_supplied_template_markers_are_not_trusted() {
		unset( $GLOBALS['grunion_block_template_id'], $GLOBALS['grunion_block_template_part_id'] );

		foreach ( array( 'block_template', 'block_template_part' ) as $marker ) {
			$source = Feedback_Source::get_current(
				array(
					$marker    => 'mytheme//evil',
					'webhooks' => array(
						array(
							'webhook_id' => 'w',
							'url'        => 'https://example.com/x',
							'enabled'    => true,
							'format'     => 'json',
							'method'     => 'POST',
						),
					),
				)
			);

			$this->assertNotContains(
				$source->get_source_type(),
				Feedback_Source::ADMIN_TIER_SOURCE_TYPES,
				"A content-supplied $marker attribute must not yield an admin-tier source type."
			);
		}
	}

	/**
	 * Test that a block_template / block_template_part source built from the render-scoped global
	 * (the legitimate path) is honored.
	 */
	public function test_render_anchored_template_sources_are_trusted() {
		$template_source = $this->source_from_render_global( 'grunion_block_template_id', 'mytheme//single' );

		$this->assertSame( 'block_template', $template_source->get_source_type() );
		$this->assertTrue(
			\Automattic\Jetpack\Forms\Jetpack_Forms::should_honor_content_destinations( $template_source->get_id(), $template_source->get_source_type() )
		);

		$part_source = $this->source_from_render_global( 'grunion_block_template_part_id', 'mytheme//footer' );

		$this->assertSame( 'block_template_part', $part_source->get_source_type() );
		$this->assertTrue(
			\Automattic\Jetpack\Forms\Jetpack_Forms::should_honor_content_destinations( $part_source->get_id(), $part_source->get_source_type() )
		);
	}

	/**
	 * Test that get_current() still resolves a widget source from the widget attribute, which
	 * Contact_Form::parse() sets from the server-resolved widget context (not from content).
	 */
	public function test_get_current_resolves_widget_source_from_attribute() {
		unset( $GLOBALS['grunion_block_template_id'], $GLOBALS['grunion_block_template_part_id'] );

		$source = Feedback_Source::get_current( array( 'widget' => 'sidebar-1' ) );

		$this->assertSame( 'widget', $source->get_source_type() );
		$this->assertSame( 'sidebar-1', (string) $source->get_id() );
	}

	/**
	 * Test prepare_submit_button adds interactivity attributes to submit buttons.
	 *
	 * @dataProvider data_provider_prepare_submit_button
	 */
	#[DataProvider( 'data_provider_prepare_submit_button' )]
	public function test_prepare_submit_button( $input_html, $expected_contains, $expected_not_contains, $description ) {
		// Use reflection to access private method
		$reflection = new \ReflectionClass( Contact_Form::class );
		$method     = $reflection->getMethod( 'prepare_submit_button' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( null, $input_html );

		foreach ( $expected_contains as $expected ) {
			$this->assertStringContainsString( $expected, $result, "$description: should contain $expected" );
		}

		foreach ( $expected_not_contains as $not_expected ) {
			$this->assertStringNotContainsString( $not_expected, $result, "$description: should NOT contain $not_expected" );
		}
	}

	/**
	 * Data provider for prepare_submit_button tests.
	 */
	public static function data_provider_prepare_submit_button() {
		return array(
			'button with type=submit'        => array(
				'<button type="submit">Submit</button>',
				array(
					'data-wp-class--is-submitting="state.isSubmitting"',
					'data-wp-bind--aria-disabled="state.isAriaDisabled"',
					'data-wp-bind--disabled="state.isAriaDisabled"',
				),
				array(),
				'Button with type=submit should get interactivity attributes',
			),
			'button with is-submit class'    => array(
				'<button class="is-submit">Submit</button>',
				array(
					'data-wp-class--is-submitting="state.isSubmitting"',
					'data-wp-bind--aria-disabled="state.isAriaDisabled"',
					'data-wp-bind--disabled="state.isAriaDisabled"',
				),
				array(),
				'Button with is-submit class should get interactivity attributes',
			),
			'button with form-button-submit' => array(
				'<button class="form-button-submit">Submit</button>',
				array(
					'data-wp-class--is-submitting="state.isSubmitting"',
					'data-wp-bind--aria-disabled="state.isAriaDisabled"',
					'data-wp-bind--disabled="state.isAriaDisabled"',
				),
				array(),
				'Button with form-button-submit class should get interactivity attributes',
			),
			'regular button not affected'    => array(
				'<button class="some-other-class">Click</button>',
				array(),
				array(
					'data-wp-class--is-submitting',
					'data-wp-bind--aria-disabled',
					'data-wp-bind--disabled',
				),
				'Regular button should NOT get interactivity attributes',
			),
			'multiple buttons mixed'         => array(
				'<button class="is-previous">Previous</button><button class="is-next">Next</button><button class="is-submit">Submit</button>',
				array(
					'data-wp-class--is-submitting="state.isSubmitting"',
				),
				array(),
				'Only submit button should get interactivity attributes in mixed buttons',
			),
			'button with multiple classes'   => array(
				'<button class="wp-block-button__link is-submit form-button-submit">Submit</button>',
				array(
					'data-wp-class--is-submitting="state.isSubmitting"',
				),
				array(),
				'Button with multiple classes including is-submit should get attributes',
			),
		);
	}

	/**
	 * Test escape_and_sanitize_field_value handles rating and URL field types.
	 *
	 * @dataProvider data_provider_escape_and_sanitize_field_value_structured
	 *
	 * @param array  $value    The structured field value.
	 * @param string $expected The expected sanitized output.
	 */
	#[DataProvider( 'data_provider_escape_and_sanitize_field_value_structured' )]
	public function test_escape_and_sanitize_field_value_structured( $value, $expected ) {
		$this->assertSame( $expected, Contact_Form::escape_and_sanitize_field_value( $value ) );
	}

	/**
	 * Data provider for structured field value sanitization (rating, URL types).
	 *
	 * @return array[]
	 */
	public static function data_provider_escape_and_sanitize_field_value_structured() {
		return array(
			'rating with displayValue'              => array(
				array(
					'type'         => 'rating',
					'displayValue' => '3/5',
				),
				'3/5',
			),
			'rating without displayValue'           => array(
				array( 'type' => 'rating' ),
				'',
			),
			'rating escapes HTML in displayValue'   => array(
				array(
					'type'         => 'rating',
					'displayValue' => '<script>alert("xss")</script>',
				),
				'&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
			),
			'URL with displayValue and url'         => array(
				array(
					'type'         => 'url',
					'displayValue' => 'Example Site',
					'url'          => 'https://example.com',
				),
				'Example Site',
			),
			'URL with url only'                     => array(
				array(
					'type' => 'url',
					'url'  => 'https://example.com',
				),
				'https://example.com',
			),
			'URL with neither displayValue nor url' => array(
				array( 'type' => 'url' ),
				'',
			),
		);
	}

	/**
	 * Test the get_block_container_classes method
	 */
	public function test_get_block_container_classes() {
		// Test with no attributes (default case)
		$classes = Contact_Form::get_block_container_classes();
		$this->assertStringContainsString( 'jetpack-contact-form-container', $classes );

		// Test with empty attributes array
		$classes = Contact_Form::get_block_container_classes( array() );
		$this->assertStringContainsString( 'jetpack-contact-form-container', $classes );

		// Test with align attribute set to 'wide'
		$attributes = array( 'align' => 'wide' );
		$classes    = Contact_Form::get_block_container_classes( $attributes );
		$this->assertStringContainsString( 'jetpack-contact-form-container', $classes );
		$this->assertStringContainsString( 'alignwide', $classes );

		// Test with align attribute set to 'full'
		$attributes = array( 'align' => 'full' );
		$classes    = Contact_Form::get_block_container_classes( $attributes );
		$this->assertStringContainsString( 'jetpack-contact-form-container', $classes );
		$this->assertStringContainsString( 'alignfull', $classes );

		// Test with unsupported align attribute (should not add alignment class)
		$attributes = array( 'align' => 'left' );
		$classes    = Contact_Form::get_block_container_classes( $attributes );
		$this->assertStringContainsString( 'jetpack-contact-form-container', $classes );
		$this->assertStringNotContainsString( 'alignleft', $classes );

		// Test that classes are space-separated string
		$attributes    = array( 'align' => 'wide' );
		$classes       = Contact_Form::get_block_container_classes( $attributes );
		$classes_array = explode( ' ', $classes );
		$this->assertContains( 'jetpack-contact-form-container', $classes_array );
		$this->assertContains( 'alignwide', $classes_array );
	}

	/**
	 * Test that get_field_type_icon rejects field types that don't match the
	 * required format (lowercase letter prefix, then lowercase letters, digits,
	 * or hyphens).
	 *
	 * @dataProvider data_provider_get_field_type_icon_invalid
	 *
	 * @param mixed  $field_type  The field type to test.
	 * @param string $description Human-readable description of the case.
	 */
	#[DataProvider( 'data_provider_get_field_type_icon_invalid' )]
	public function test_get_field_type_icon_rejects_invalid_field_type_format( $field_type, $description ) {
		$reflection = new \ReflectionClass( Contact_Form::class );
		$method     = $reflection->getMethod( 'get_field_type_icon' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( null, $field_type );

		$this->assertSame( '', $result, $description );
	}

	/**
	 * Data provider for invalid field type format cases.
	 *
	 * @return array[]
	 */
	public static function data_provider_get_field_type_icon_invalid() {
		return array(
			'contains parent directory segment' => array(
				'../../../../etc/passwd',
				'Field type containing ../ should be rejected',
			),
			'contains url-encoded path segment' => array(
				'..%2F..%2Fetc%2Fpasswd',
				'Field type with url-encoded path segment should be rejected',
			),
			'contains backslash path segment'   => array(
				'..\\..\\windows\\system32',
				'Field type with backslash path segment should be rejected',
			),
			'leading slash'                     => array(
				'/etc/passwd',
				'Field type beginning with a forward slash should be rejected',
			),
			'contains null byte'                => array(
				"text\0.svg",
				'Field type with embedded null byte should be rejected',
			),
			'uppercase letters'                 => array(
				'TEXT',
				'Uppercase field type should be rejected (strict format)',
			),
			'starts with digit'                 => array(
				'1text',
				'Field type starting with digit should be rejected',
			),
			'starts with hyphen'                => array(
				'-text',
				'Field type starting with hyphen should be rejected',
			),
			'contains space'                    => array(
				'text field',
				'Field type with space should be rejected',
			),
			'non-string array'                  => array(
				array( 'text' ),
				'Array field type should be rejected',
			),
			'non-string integer'                => array(
				123,
				'Integer field type should be rejected',
			),
			'non-string null'                   => array(
				null,
				'Null field type should be rejected',
			),
			'empty string'                      => array(
				'',
				'Empty field type should be rejected',
			),
		);
	}

	/**
	 * Test that get_field_type_icon returns valid SVG markup for known field types.
	 *
	 * Companion to test_get_field_type_icon_rejects_invalid_field_type_format —
	 * ensures the format check does not break legitimate field types.
	 *
	 * @dataProvider data_provider_get_field_type_icon_valid
	 *
	 * @param string $field_type The valid field type to test.
	 */
	#[DataProvider( 'data_provider_get_field_type_icon_valid' )]
	public function test_get_field_type_icon_accepts_valid_types( $field_type ) {
		$reflection = new \ReflectionClass( Contact_Form::class );
		$method     = $reflection->getMethod( 'get_field_type_icon' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		$result = $method->invoke( null, $field_type );

		// Valid field types either return SVG markup (when the icon file exists)
		// or an empty string (when the block directory exists but has no icon.svg yet).
		$this->assertIsString( $result, "Field type '$field_type' should return a string" );
		if ( $result !== '' ) {
			$this->assertStringContainsString( '<svg', $result, "Field type '$field_type' should return SVG markup" );
		}
	}

	/**
	 * Data provider for valid field type acceptance test cases.
	 *
	 * @return array[]
	 */
	public static function data_provider_get_field_type_icon_valid() {
		return array(
			'text'                           => array( 'text' ),
			'email'                          => array( 'email' ),
			'textarea'                       => array( 'textarea' ),
			'phone (via exception map)'      => array( 'phone' ),
			'telephone (via exception map)'  => array( 'telephone' ),
			'radio (via exception map)'      => array( 'radio' ),
			'checkbox-multiple (hyphenated)' => array( 'checkbox-multiple' ),
			'image-select (hyphenated)'      => array( 'image-select' ),
		);
	}

	/**
	 * A manually-set field ID that collides with another field in the same form
	 * (e.g. from duplicating or copy/pasting the block) should be suffixed so
	 * each field keeps a unique input name. The suffix starts at -2 to match
	 * generateUniqueFormFieldId() on the editor side. See FORMS-724.
	 */
	public function test_duplicate_manual_field_ids_are_made_unique() {
		$form = new Contact_Form(
			array(),
			"[contact-field label='First' type='text' id='name'/][contact-field label='Second' type='text' id='name'/][contact-field label='Third' type='text' id='name'/]"
		);

		$this->assertSame(
			array( 'name', 'name-2', 'name-3' ),
			array_keys( $form->fields ),
			'Duplicate manual field IDs should be suffixed so each field stays unique.'
		);
	}

	/**
	 * A single, non-colliding manual field ID must be preserved verbatim — the
	 * de-duplication should only kick in on an actual collision.
	 */
	public function test_unique_manual_field_id_is_preserved() {
		$form = new Contact_Form(
			array(),
			"[contact-field label='First' type='text' id='full_name'/][contact-field label='Second' type='email' id='contact_email'/]"
		);

		$this->assertSame(
			array( 'full_name', 'contact_email' ),
			array_keys( $form->fields ),
			'Non-colliding manual field IDs should be left untouched.'
		);
	}

	/**
	 * Two distinct duplicated IDs in the same form must be de-duplicated
	 * independently — the counter is per-ID, so "tel" collisions don't inherit
	 * the "name" count. See FORMS-724.
	 */
	public function test_mixed_manual_field_ids_are_deduped_independently() {
		$form = new Contact_Form(
			array(),
			"[contact-field label='First' type='text' id='name'/][contact-field label='Second' type='text' id='name'/][contact-field label='Third' type='text' id='name'/][contact-field label='Fourth' type='text' id='tel'/][contact-field label='Fifth' type='text' id='tel'/][contact-field label='Sixth' type='text' id='name'/]"
		);

		$this->assertSame(
			array( 'name', 'name-2', 'name-3', 'tel', 'tel-2', 'name-4' ),
			array_keys( $form->fields ),
			'Each colliding ID should be suffixed against its own base, not a shared counter.'
		);
	}

	/**
	 * When a form already contains suffixed IDs, generated suffixes must skip the
	 * ones already in use rather than collide with them. See FORMS-724.
	 */
	public function test_pre_suffixed_manual_field_ids_stay_unique() {
		$form = new Contact_Form(
			array(),
			"[contact-field label='First' type='text' id='name'/][contact-field label='Second' type='text' id='name'/][contact-field label='Third' type='text' id='name'/][contact-field label='Fourth' type='text' id='name-2'/][contact-field label='Fifth' type='text' id='tel'/][contact-field label='Sixth' type='text' id='name-3'/]"
		);

		// The explicit "name-2"/"name-3" collide with generated ones and fall back
		// to a further suffix, but every resulting ID stays unique.
		$this->assertSame(
			array( 'name', 'name-2', 'name-3', 'name-2-2', 'tel', 'name-3-2' ),
			array_keys( $form->fields ),
			'Explicit suffixed IDs that collide with generated ones should still resolve to unique IDs.'
		);
	}
}
