<?php
/**
 * Unit Tests for feedback form_ref functionality.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Posts;

/**
 * Test class for feedback form_ref functionality
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Feedback
 * @covers \Automattic\Jetpack\Forms\ContactForm\Contact_Form
 */
#[CoversClass( Feedback::class )]
#[CoversClass( Contact_Form::class )]
class Feedback_Form_Ref_Test extends BaseTestCase {

	/**
	 * Parent post ID for testing.
	 *
	 * @var int
	 */
	private $parent_post_id;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Create a parent post for testing
		$this->parent_post_id = wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Test Post',
			)
		);

		// Mock $_POST data for form submission
		$_POST['contact-form-id'] = $this->parent_post_id;
		$_POST['_wpnonce']        = wp_create_nonce( 'contact-form_' . $this->parent_post_id );
	}

	/**
	 * Helper to create a form and simulate submission.
	 */
	private function create_and_submit_form( $form_id = null ) {
		global $post;
		// Set the right global context.
		$post = get_post( $this->parent_post_id );
		// Prepare attributes
		$attributes = array(
			'saveResponses' => 'yes',
		);

		// Set form_id as ref attribute if provided
		if ( $form_id ) {
			$attributes['ref'] = $form_id;
		}

		// Fill field values
		$_POST[ 'g' . $this->parent_post_id . '-email' ] = 'john@example.com';

		// Create form with ref attribute
		$form = new Contact_Form(
			$attributes,
			"[contact-field label='Name' type='name' required='1'/][contact-field label='Email' type='email' required='1'/]"
		);

		// Process submission
		$result = $form->process_submission();

		$post = null;

		return $result;
	}

	/**
	 * Test that feedback post_parent is set to form_id when form_id is provided.
	 */
	public function test_feedback_post_parent_set_to_form_id_publish() {
		// Create a jetpack_form post
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Test Synced Form',
				'post_content' => '<!-- wp:jetpack/contact-form -->
					<!-- wp:jetpack/field-email {"label":"Email","required":true} /-->
					<!-- wp:jetpack/button {"element":"button","text":"Submit"} /-->
					<!-- /wp:jetpack/contact-form -->',
			)
		);

		$this->assertGreaterThan( 0, $form_id, 'Form post should be created' );

		// Get initial feedback count
		$initial_posts = Posts::init()->posts;
		$initial_count = count( $initial_posts );

		// Submit form with form_id set
		$result = $this->create_and_submit_form( $form_id );

		$this->assertTrue( is_string( $result ), 'Form submission should be successful' );

		// Get final feedback count
		$final_posts = Posts::init()->posts;
		$final_count = count( $final_posts );
		$this->assertEquals( $initial_count + 1, $final_count, 'A new feedback post should be created' );

		// Get the created feedback post
		$feedback_post = end( $final_posts );
		$this->assertEquals( 'feedback', $feedback_post->post_type, 'Post type should be feedback' );

		// Verify post_parent is set to form_id
		$this->assertEquals( $form_id, $feedback_post->post_parent, 'Feedback post_parent should be set to form_id' );

		$feedback = Feedback::get( $feedback_post->ID );

		$feedback->get_form_id();
		$this->assertEquals( $form_id, $feedback->get_form_id(), 'Feedback form_id should match the provided form_id' );
		$this->assertEquals( \get_edit_post_link( $form_id, 'url' ), $feedback->get_edit_form_url(), 'Feedback form edit link should match the form edit link' );
	}

	public function test_validate_ref_draft_form_has_errors() {
		// Create a jetpack_form post
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'draft',
				'post_title'   => 'Test Synced Form',
				'post_content' => '<!-- wp:jetpack/contact-form -->
					<!-- wp:jetpack/field-email {"label":"Email"} /-->
					<!-- wp:jetpack/button {"element":"button","text":"Submit"} /-->
					<!-- /wp:jetpack/contact-form -->',
			)
		);

		$form = new Contact_Form( array( 'ref' => $form_id ), '' );
		$form->validate_ref( $form_id );
		$this->assertTrue( $form->has_errors() );
	}

	public function test_validate_ref_published_form_has_no_errors() {
		// Create a jetpack_form post
		$form_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_status'  => 'publish',
				'post_title'   => 'Test Synced Form',
				'post_content' => '<!-- wp:jetpack/contact-form -->
					<!-- wp:jetpack/field-email {"label":"Email"} /-->
					<!-- wp:jetpack/button {"element":"button","text":"Submit"} /-->
					<!-- /wp:jetpack/contact-form -->',
			)
		);

		$form = new Contact_Form( array( 'ref' => $form_id ), '' );
		$form->validate_ref( $form_id );
		$this->assertFalse( $form->has_errors() );
	}
}
