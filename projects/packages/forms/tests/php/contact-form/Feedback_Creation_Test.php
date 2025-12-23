<?php
/**
 * Unit Tests for Feedback Creation and Retrieval.
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
 * Test class for Feedback Creation and Retrieval
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Creation_Test extends BaseTestCase {

	public function test_from_post_id_returns_null_for_invalid_post() {
		$response = Feedback::get( 999999 );
		$this->assertNull( $response );
	}

	public function test_from_post_id_returns_instance_for_valid_feedback_post() {
		$post_id  = \wp_insert_post(
			array(
				'post_type'     => 'feedback',
				'post_status'   => 'publish',
				'post_title'    => 'Test Feedback',
				'post_content'  => '{}',
				'page_template' => 'v2',
			)
		);
		$response = Feedback::get( $post_id );
		$this->assertInstanceOf( Feedback::class, $response );
	}

	public function test_from_submission_sets_fields_and_post_data() {
		$form       = new Contact_Form( array() );
		$_post_data = array(
			'name'    => 'John Doe',
			'email'   => 'john@example.com',
			'message' => 'Hello!',
			'ignore'  => 'should not be included',
		);
		$response   = Feedback::from_submission( $_post_data, $form );
		$this->assertInstanceOf( Feedback::class, $response );
	}
}
