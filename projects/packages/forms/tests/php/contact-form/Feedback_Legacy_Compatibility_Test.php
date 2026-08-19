<?php
/**
 * Unit Tests for Feedback Legacy Format Compatibility.
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
 * Test class for Feedback Legacy Format Compatibility
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Legacy_Compatibility_Test extends BaseTestCase {

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

		$saved_response     = Feedback::get( $post_id );
		$expected_permalink = get_permalink( $current_post->ID );
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
			'permalink',
			'contact_form_field_text',
		);

		foreach ( $assert_keys as $key ) {
			$this->assertArrayHasKey( $key, $response->get_akismet_vars(), "Akismet vars should contain '$key'" );
			$this->assertArrayHasKey( $key, $saved_response->get_akismet_vars(), "Akismet vars should contain '$key'" );
		}

		// Verify permalink points to the post the form was submitted on.
		$this->assertEquals( $expected_permalink, $response->get_akismet_vars()['permalink'], 'Akismet permalink should match the entry permalink' );
		$this->assertEquals( $expected_permalink, $saved_response->get_akismet_vars()['permalink'], 'Saved Akismet permalink should match the entry permalink' );
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

	/**
	 * Data provider: every field type in $non_extra_fields that must not
	 * fatal when its value is an array.
	 */
	public static function data_provider_non_extra_field_types() {
		return array(
			'email'    => array( 'email', 'Email', array( 'first@example.com', 'second@example.com' ) ),
			'name'     => array( 'name', 'Name', array( 'Alice', 'Bob' ) ),
			'url'      => array( 'url', 'Website', array( 'https://example.com', 'https://another.com' ) ),
			'subject'  => array( 'subject', 'Subject', array( 'Subject A', 'Subject B' ) ),
			'textarea' => array( 'textarea', 'Message', array( 'First message', 'Second message' ) ),
			'ip'       => array( 'ip', 'IP', array( '127.0.0.1', '192.168.1.1' ) ),
		);
	}

	/**
	 * Regression test: get_legacy_extra_values() must not fatal when a
	 * non-extra field holds an array value.
	 *
	 * In production this happens when POST data contains multiple values
	 * for the same field name, causing get_field_value() to store an array.
	 * The 'submit' context is critical because get_render_submit_value()
	 * returns $this->value without any array-to-string conversion — unlike
	 * 'default' context which implodes arrays.
	 *
	 * @dataProvider data_provider_non_extra_field_types
	 */
	#[DataProvider( 'data_provider_non_extra_field_types' )]
	public function test_get_legacy_extra_values_with_array_field_value_does_not_fatal( $type, $label, $array_value ) {
		$feedback_time  = current_time( 'mysql' );
		$feedback_title = "Test User - {$feedback_time}";

		$array_field = new Feedback_Field( '1_' . $label, $label, $array_value, $type );
		$text_field  = new Feedback_Field( '2_Comment', 'Comment', 'Hello world', 'text' );

		$content = array(
			'subject' => 'Test Subject',
			'ip'      => '127.0.0.1',
			'fields'  => array(
				$array_field->serialize(),
				$text_field->serialize(),
			),
		);

		$post_id = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'publish',
				'post_title'     => addslashes( wp_kses( $feedback_title, array() ) ),
				'post_date'      => $feedback_time,
				'post_name'      => md5( $feedback_title . $type ),
				'post_content'   => wp_json_encode( $content, JSON_UNESCAPED_SLASHES ),
				'post_mime_type' => 'v2',
				'post_parent'    => 0,
			)
		);

		$response = Feedback::get( $post_id );
		$this->assertInstanceOf( Feedback::class, $response, "Feedback should load for {$type} field" );

		// 'submit' context — the production path (class-contact-form.php:2678).
		// get_render_submit_value() returns the raw array, which without the fix
		// triggers: TypeError: Cannot access offset of type array on array
		$extra_values_submit = $response->get_legacy_extra_values( 'submit' );
		$this->assertIsArray( $extra_values_submit, "get_legacy_extra_values(submit) should not fatal for {$type} with array value" );

		// The Comment text field should appear in extra values with correct value.
		$this->assertNotEmpty( $extra_values_submit, "Extra values should not be empty for {$type} with array value" );
		$found_comment = false;
		foreach ( $extra_values_submit as $value ) {
			if ( $value === 'Hello world' ) {
				$found_comment = true;
				break;
			}
		}
		$this->assertTrue( $found_comment, "Extra values should contain the Comment field value for {$type} test case" );

		// 'default' context — implodes arrays to strings, verify it still works.
		$extra_values_default = $response->get_legacy_extra_values( 'default' );
		$this->assertIsArray( $extra_values_default, "get_legacy_extra_values(default) should not fatal for {$type} with array value" );
	}

	/**
	 * Verify that checkbox-multiple fields preserve their array values
	 * through get_legacy_extra_values() — they are the one field type
	 * that legitimately holds arrays.
	 */
	public function test_get_legacy_extra_values_preserves_checkbox_multiple_array() {
		$feedback_time  = current_time( 'mysql' );
		$feedback_title = "Test User - {$feedback_time}";

		$checkbox_field = new Feedback_Field( '1_Colors', 'Colors', array( 'red', 'blue', 'green' ), 'checkbox-multiple' );
		$name_field     = new Feedback_Field( '2_Name', 'Name', 'Test User', 'name' );

		$content = array(
			'subject' => 'Test Subject',
			'ip'      => '127.0.0.1',
			'fields'  => array(
				$checkbox_field->serialize(),
				$name_field->serialize(),
			),
		);

		$post_id = wp_insert_post(
			array(
				'post_type'      => 'feedback',
				'post_status'    => 'publish',
				'post_title'     => addslashes( wp_kses( $feedback_title, array() ) ),
				'post_date'      => $feedback_time,
				'post_name'      => md5( $feedback_title ),
				'post_content'   => wp_json_encode( $content, JSON_UNESCAPED_SLASHES ),
				'post_mime_type' => 'v2',
				'post_parent'    => 0,
			)
		);

		$response = Feedback::get( $post_id );
		$this->assertInstanceOf( Feedback::class, $response );

		// checkbox-multiple values should remain as arrays in submit/api contexts.
		$value_submit = $response->get_field_value_by_label( 'Colors', 'submit' );
		$this->assertIsArray( $value_submit, 'checkbox-multiple value should be an array in submit context' );
		$this->assertEquals( array( 'red', 'blue', 'green' ), $value_submit, 'checkbox-multiple value should preserve all selected options' );

		// In default context, arrays are imploded to a comma-separated string.
		$value_default = $response->get_field_value_by_label( 'Colors', 'default' );
		$this->assertEquals( 'red, blue, green', $value_default, 'checkbox-multiple value should be imploded in default context' );

		// get_legacy_extra_values should work without fatal and include the checkbox-multiple field.
		$extra_values = $response->get_legacy_extra_values( 'submit' );
		$this->assertIsArray( $extra_values, 'get_legacy_extra_values(submit) should work with checkbox-multiple' );

		// checkbox-multiple is not in $non_extra_fields, so its value should appear in extra values.
		$found_colors = false;
		foreach ( $extra_values as $value ) {
			if ( is_array( $value ) && $value === array( 'red', 'blue', 'green' ) ) {
				$found_colors = true;
				break;
			}
		}
		$this->assertTrue( $found_colors, 'Extra values should contain the checkbox-multiple array value' );
	}

	/**
	 * Legacy v1 feedback stores checkbox-multiple values as JSON arrays in
	 * post_content. When loaded, these become Feedback_Field objects with
	 * type 'basic' (not 'checkbox-multiple') and an array value.
	 *
	 * Verify the full array is preserved through get_legacy_extra_values()
	 * and not flattened to just the first element by the reset() guard.
	 */
	public function test_legacy_v1_checkbox_multiple_array_preserved() {
		// In legacy v1 format, checkbox-multiple values are stored as JSON arrays.
		// When loaded via process_legacy_values(), the field type becomes 'basic'.
		$post_id = Utility::create_legacy_feedback(
			array(
				'1_Colors'  => array( 'red', 'blue', 'green' ),
				'2_Name'    => 'Test User',
				'3_Comment' => 'Hello world',
			)
		);

		$response = Feedback::get( $post_id );
		$this->assertInstanceOf( Feedback::class, $response );

		// The array value should survive the round-trip through legacy format.
		// In default context, get_render_default_value() implodes arrays to strings.
		$value_default = $response->get_field_value_by_label( 'Colors', 'default' );
		$this->assertEquals( 'red, blue, green', $value_default, 'Legacy v1 checkbox-multiple should be imploded in default context' );

		// In submit context, get_render_submit_value() returns the raw value.
		$value_submit = $response->get_field_value_by_label( 'Colors', 'submit' );
		$this->assertIsArray( $value_submit, 'Legacy v1 checkbox-multiple should remain an array in submit context' );
		$this->assertEquals( array( 'red', 'blue', 'green' ), $value_submit, 'Legacy v1 checkbox-multiple should preserve all values' );

		// get_legacy_extra_values should not flatten the array via reset().
		$extra_values_submit = $response->get_legacy_extra_values( 'submit' );
		$this->assertIsArray( $extra_values_submit, 'get_legacy_extra_values(submit) should work with legacy checkbox-multiple' );

		// The field should appear in extra values with all array items intact.
		$found_colors = false;
		foreach ( $extra_values_submit as $value ) {
			if ( is_array( $value ) && $value === array( 'red', 'blue', 'green' ) ) {
				$found_colors = true;
				break;
			}
		}
		$this->assertTrue( $found_colors, 'Legacy v1 checkbox-multiple array should not be flattened to first element' );

		// Also verify default context preserves the imploded string.
		$extra_values_default = $response->get_legacy_extra_values( 'default' );
		$found_colors_string  = false;
		foreach ( $extra_values_default as $value ) {
			if ( $value === 'red, blue, green' ) {
				$found_colors_string = true;
				break;
			}
		}
		$this->assertTrue( $found_colors_string, 'Legacy v1 checkbox-multiple should appear as imploded string in default context extra values' );
	}

	public function test_escape_legacy_v2_special_characters_handeling() {
		$post_id = Utility::create_legacy_feedback_v2(
			array(
				'Special こんにちは世界' => 'こんにちは世界',
				'Message'         => '🙈',
			)
		);

		$post_object = get_post( $post_id );
		$this->assertTrue( str_contains( $post_object->post_content, 'ud83dude48' ) ); // ud83dude48 => 🙈 without the /

		$response = Feedback::get( $post_id );

		$this->assertEquals( 'こんにちは世界', $response->get_field_value_by_label( 'Special こんにちは世界' ), 'Special field value should match' );
		$this->assertEquals( '🙈', $response->get_field_value_by_label( 'Message' ), 'Message field value should match' );
	}
}
