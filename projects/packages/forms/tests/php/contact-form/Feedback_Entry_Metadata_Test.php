<?php
/**
 * Unit Tests for Feedback Entry Metadata (Post Context, Title, Permalink).
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
 * Test class for Feedback Entry Metadata
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Entry_Metadata_Test extends BaseTestCase {

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
}
