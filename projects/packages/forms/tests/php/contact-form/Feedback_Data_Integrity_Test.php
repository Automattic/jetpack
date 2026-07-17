<?php
/**
 * Unit Tests for Feedback Data Integrity, Files, Read/Unread, and Notifications.
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
 * Test class for Feedback Data Integrity, Files, Read/Unread, and Notifications
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Data_Integrity_Test extends BaseTestCase {

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
	 * Feedback whose post_content is JSON but has no version marker (empty
	 * post_mime_type) should be parsed as JSON, not run through the legacy
	 * plain-text parser.
	 */
	public function test_versionless_json_content_is_parsed_as_json() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => Feedback::POST_TYPE,
				'post_title'   => 'Versionless JSON Feedback',
				'post_content' => '{"subject":"Contact us!","entry_title":"Contact us!","entry_page":1,"fields":[{"key":"1_name","label":"Name","value":"Jane Doe","type":"name","meta":[],"form_field_id":"g1-name"},{"key":"2_email","label":"Email","value":"jane@example.com","type":"email","meta":[],"form_field_id":"g1-email"}]}',
				'post_status'  => 'publish',
				// Intentionally NO post_mime_type -> versionless.
			)
		);

		$response = Feedback::get( $post_id );
		$this->assertInstanceOf( Feedback::class, $response );
		$this->assertSame( 'Contact us!', $response->get_subject() );
		$this->assertSame( 'Jane Doe', $response->get_field_value_by_label( 'Name' ) );
		$this->assertSame( 'jane@example.com', $response->get_field_value_by_label( 'Email' ) );
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
}
