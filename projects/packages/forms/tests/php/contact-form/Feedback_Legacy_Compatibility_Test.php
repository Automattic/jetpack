<?php
/**
 * Unit Tests for Feedback Legacy Format Compatibility.
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
