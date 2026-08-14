<?php
/**
 * Unit Tests for Feedback Entry Metadata (Post Context, Title, Permalink).
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

	/**
	 * Test that logged-in user info is captured and persists after save/load.
	 */
	public function test_logged_in_user_captured_during_submission() {
		// Create a test user and log them in
		$user_id = wp_insert_user(
			array(
				'user_login'   => 'testsubmitter',
				'user_email'   => 'submitter@example.com',
				'user_pass'    => 'password123',
				'display_name' => 'Test Submitter',
				'role'         => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		$form_id    = Utility::get_form_id();
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'John Doe',
				'email'   => 'john@example.com',
				'message' => 'Test message from logged-in user',
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

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// The logged-in user info should be present
		$this->assertNotEmpty( $response->get_logged_in_user(), 'Logged-in user should not be empty for submission' );
		$this->assertNotEmpty( $saved_response->get_logged_in_user(), 'Logged-in user should not be empty after save/load' );

		// Check the structure and values
		$logged_in_user = $response->get_logged_in_user();
		$this->assertIsArray( $logged_in_user, 'Logged-in user should be an array' );
		$this->assertArrayHasKey( 'display_name', $logged_in_user, 'Logged-in user should have display_name key' );
		$this->assertArrayHasKey( 'username', $logged_in_user, 'Logged-in user should have username key' );
		$this->assertArrayHasKey( 'id', $logged_in_user, 'Logged-in user should have id key' );
		$this->assertEquals( 'Test Submitter', $logged_in_user['display_name'], 'Display name should match' );
		$this->assertEquals( 'testsubmitter', $logged_in_user['username'], 'Username should match' );
		$this->assertEquals( $user_id, $logged_in_user['id'], 'User ID should match' );

		// Check saved response has the same data
		$saved_logged_in_user = $saved_response->get_logged_in_user();
		$this->assertEquals( $logged_in_user, $saved_logged_in_user, 'Logged-in user info should match after save/load' );

		// Clean up
		wp_delete_user( $user_id );
		wp_set_current_user( 0 );
	}

	/**
	 * Test that logged-in user is null when no user is logged in.
	 */
	public function test_logged_in_user_null_when_not_logged_in() {
		// Ensure no user is logged in
		wp_set_current_user( 0 );

		$form_id    = Utility::get_form_id();
		$_post_data = Utility::get_post_request(
			array(
				'name'    => 'Anonymous User',
				'email'   => 'anon@example.com',
				'message' => 'Test message from anonymous user',
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

		$response         = Feedback::from_submission( $_post_data, $form );
		$feedback_post_id = $response->save();
		$saved_response   = Feedback::get( $feedback_post_id );

		// The logged-in user should be null
		$this->assertNull( $response->get_logged_in_user(), 'Logged-in user should be null when not logged in' );
		$this->assertNull( $saved_response->get_logged_in_user(), 'Logged-in user should be null after save/load when not logged in' );
	}

	/**
	 * Test that logged-in user persists through serialization for legacy feedback.
	 */
	public function test_logged_in_user_in_legacy_feedback() {
		$logged_in_user = array(
			'display_name' => 'Legacy User',
			'id'           => 42,
		);

		// Create a v3 feedback post with logged_in_user data
		$content = wp_json_encode(
			array(
				'subject'        => 'Test Subject',
				'ip'             => '127.0.0.1',
				'country_code'   => 'US',
				'user_agent'     => 'Mozilla/5.0',
				'logged_in_user' => $logged_in_user,
				'entry_title'    => 'Test Page',
				'entry_page'     => 1,
				'source_type'    => 'single',
				'request_url'    => 'https://example.com',
				'fields'         => array(),
			),
			JSON_UNESCAPED_SLASHES
		);

		$post_id = wp_insert_post(
			array(
				'post_type'      => Feedback::POST_TYPE,
				'post_title'     => 'Legacy Feedback with User',
				'post_content'   => addslashes( $content ),
				'post_status'    => 'publish',
				'post_mime_type' => 'v3',
			)
		);

		$saved_response = Feedback::get( $post_id );
		$this->assertNotNull( $saved_response->get_logged_in_user(), 'Logged-in user should not be null for legacy feedback' );
		$this->assertEquals( $logged_in_user, $saved_response->get_logged_in_user(), 'Logged-in user should match legacy data' );
	}

	/**
	 * Test that username is captured alongside display_name and id.
	 */
	public function test_logged_in_user_includes_username() {
		$user_id = wp_insert_user(
			array(
				'user_login'   => 'usernametest',
				'user_email'   => 'username@example.com',
				'user_pass'    => 'password123',
				'display_name' => 'Display Name Test',
				'role'         => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );

		$form_id    = Utility::get_form_id();
		$_post_data = Utility::get_post_request(
			array(
				'name'  => 'Test Name',
				'email' => 'test@example.com',
			),
			'g' . $form_id
		);

		$form     = new Contact_Form( array(), '' );
		$response = Feedback::from_submission( $_post_data, $form );

		$logged_in_user = $response->get_logged_in_user();
		$this->assertIsArray( $logged_in_user );
		$this->assertArrayHasKey( 'username', $logged_in_user );
		$this->assertEquals( 'usernametest', $logged_in_user['username'] );
		$this->assertEquals( 'Display Name Test', $logged_in_user['display_name'] );
		$this->assertEquals( $user_id, $logged_in_user['id'] );

		wp_delete_user( $user_id );
		wp_set_current_user( 0 );
	}
}
