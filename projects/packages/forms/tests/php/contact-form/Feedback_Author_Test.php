<?php
/**
 * Unit Tests for Automattic\Jetpack\Forms\Contact_Form.
 *
 * To run the test visit the packages/forms directory and run composer test-php
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Test class for Feedback_Author
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Feedback_Author
 */
#[CoversClass( Feedback_Author::class )]
class Feedback_Author_Test extends BaseTestCase {

	/**
	 * Minimal: combining first and last name yields full name in name/display.
	 */
	public function test_combined_first_last_in_name_and_display() {
		$author = new Feedback_Author( '', 'john@example.com', '', 'John', 'Doe' );

		$this->assertEquals( 'John Doe', $author->get_name() );
		$this->assertEquals( 'John Doe', $author->get_display_name() );
		$this->assertSame( 'John', $author->get_first_name() );
		$this->assertSame( 'Doe', $author->get_last_name() );
	}
	/**
	 * Minimal: when only one of first/last is present, fall back to single name.
	 */
	public function test_partial_first_or_last_falls_back_to_single_name() {
		$author = new Feedback_Author( 'Single Name', 's@example.com', '', 'Bob', '' );
		$this->assertEquals( 'Single Name', $author->get_name() );
		$this->assertEquals( 'Single Name', $author->get_display_name() );
	}

	/**
	 * When both first/last are present and differ from single name, combined name takes precedence.
	 */
	public function test_first_last_override_single_name_when_both_present() {
		$author = new Feedback_Author( 'Some Other Name', 'x@example.com', '', 'Alice', 'Jones' );
		$this->assertEquals( 'Alice Jones', $author->get_name() );
		$this->assertEquals( 'Alice Jones', $author->get_display_name() );
	}

	/**
	 * When only last name is provided and single name exists, fall back to single name.
	 */
	public function test_only_lastname_with_single_name_falls_back_to_single() {
		$author = new Feedback_Author( 'Single Name', 'x@example.com', '', '', 'Jones' );
		$this->assertEquals( 'Single Name', $author->get_name() );
		$this->assertEquals( 'Single Name', $author->get_display_name() );
	}

	/**
	 * When only last name is provided and single name is missing, fall back to email in display.
	 */
	public function test_only_lastname_without_single_name_falls_back_to_email() {
		$author = new Feedback_Author( '', 'x@example.com', '', '', 'Jones' );
		$this->assertSame( '', $author->get_name() );
		$this->assertEquals( 'x@example.com', $author->get_display_name() );
	}

	/**
	 * Test constructor with all parameters.
	 */
	public function test_constructor_with_all_parameters() {
		$author = new Feedback_Author( 'John Doe', 'john@example.com', 'https://example.com' );

		$this->assertEquals( 'John Doe', $author->get_name() );
		$this->assertEquals( 'john@example.com', $author->get_email() );
		$this->assertEquals( 'https://example.com', $author->get_url() );
	}

	/**
	 * Test constructor with default parameters.
	 */
	public function test_constructor_with_default_parameters() {
		$author = new Feedback_Author();

		$this->assertSame( '', $author->get_name() );
		$this->assertSame( '', $author->get_email() );
		$this->assertSame( '', $author->get_url() );
	}

	/**
	 * Test get_display_name when name is set.
	 */
	public function test_get_display_name_with_name() {
		$author = new Feedback_Author( 'John Doe', 'john@example.com' );

		$this->assertEquals( 'John Doe', $author->get_display_name() );
	}

	/**
	 * Test get_display_name when name is empty, falls back to email.
	 */
	public function test_get_display_name_without_name() {
		$author = new Feedback_Author( '', 'john@example.com' );

		$this->assertEquals( 'john@example.com', $author->get_display_name() );
	}

	/**
	 * Test get_display_name when both name and email are empty.
	 */
	public function test_get_display_name_empty() {
		$author = new Feedback_Author();

		$this->assertSame( '', $author->get_display_name() );
	}

	/**
	 * Test get_avatar_url with email.
	 */
	public function test_get_avatar_url_with_email() {
		$author = new Feedback_Author( 'John Doe', 'john@example.com' );

		$this->assertNotEmpty( $author->get_avatar_url() );
		$this->assertStringContainsString( 'gravatar', $author->get_avatar_url() );
	}

	/**
	 * Test get_avatar_url without email.
	 */
	public function test_get_avatar_url_without_email() {
		$author = new Feedback_Author( 'John Doe' );

		$this->assertSame( '', $author->get_avatar_url() );
	}

	/**
	 * Test from_submission method.
	 */
	public function test_from_submission() {
		$form = $this->createStub( Contact_Form::class );
		$form->method( 'get_field_ids' )
			->willReturn(
				array(
					'name'  => 'g1-name',
					'email' => 'g1-email',
					'url'   => 'g1-url',
				)
			);

		$post_data = array(
			'g1-name'  => 'John Doe',
			'g1-email' => 'john@example.com',
			'g1-url'   => 'https://example.com',
		);

		$author = Feedback_Author::from_submission( $post_data, $form );

		$this->assertInstanceOf( Feedback_Author::class, $author );
	}

	public function test_from_submission_with_mock_data() {
		$author_name = 'Mikey Mouse';

		$form_id = Utility::get_form_id();
		// Create a form submission
		$_post_data = Utility::get_post_request(
			array(
				'name'    => $author_name,
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

		$author = Feedback_Author::from_submission( $_post_data, $form );
		$this->assertEquals( $author_name, $author->get_name() );
		$this->assertEquals( 'email@email.com', $author->get_email() );
	}

	/**
	 * Test from_submission with missing fields.
	 */
	public function test_from_submission_missing_fields() {
		$form = $this->createStub( Contact_Form::class );
		$form->method( 'get_field_ids' )
			->willReturn(
				array(
					'name' => 'g1-name',
				)
			);

		$post_data = array(
			'g1-other' => 'some value',
		);

		$author = Feedback_Author::from_submission( $post_data, $form );

		$this->assertInstanceOf( Feedback_Author::class, $author );
	}

	/**
	 * Test getters return correct types.
	 */
	public function test_getters_return_strings() {
		$author = new Feedback_Author( 'John', 'john@test.com', 'http://test.com' );

		$this->assertIsString( $author->get_name() );
		$this->assertIsString( $author->get_email() );
		$this->assertIsString( $author->get_url() );
		$this->assertIsString( $author->get_display_name() );
		$this->assertIsString( $author->get_avatar_url() );
	}
}
