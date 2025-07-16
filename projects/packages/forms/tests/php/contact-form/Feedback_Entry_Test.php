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
 * Test class for Feedback_Entry
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Feedback_Entry
 */
#[CoversClass( Feedback_Entry::class )]
class Feedback_Entry_Test extends BaseTestCase {
	/**
	 * Test constructor with invalid ID (0 or negative)
	 */
	public function test_constructor_with_invalid_id() {
		$entry = new Feedback_Entry( 0, 'Test Title', 2 );

		$this->assertSame( 0, $entry->get_id() );
		$this->assertEquals( 'Test Title', $entry->get_title() );
		$this->assertEquals( 2, $entry->get_page_number() );
		$this->assertSame( '', $entry->get_permalink() );
	}

	/**
	 * Test constructor with negative ID
	 */
	public function test_constructor_with_negative_id() {
		$entry = new Feedback_Entry( -5, 'Test Title' );

		$this->assertSame( 0, $entry->get_id() );
		$this->assertEquals( 'Test Title', $entry->get_title() );
		$this->assertSame( 1, $entry->get_page_number() );
		$this->assertSame( '', $entry->get_permalink() );
	}

	/**
	 * Test constructor with valid ID but non-existent post
	 */
	public function test_constructor_with_nonexistent_post() {
		$entry = new Feedback_Entry( 999999, 'Fallback Title' );

		$this->assertSame( 999999, $entry->get_id() );
		$this->assertEquals( 'Fallback Title', $entry->get_title() );
		$this->assertSame( 1, $entry->get_page_number() );
		$this->assertSame( '', $entry->get_permalink() );
	}

	/**
	 * Test constructor with valid public post
	 */
	public function test_constructor_with_valid_public_post() {
		// Create a public post
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Public Post Title',
				'post_status' => 'publish',
				'post_type'   => 'post',
			)
		);

		$entry = new Feedback_Entry( $post_id, 'Fallback Title', 3 );

		$this->assertEquals( $post_id, $entry->get_id() );
		$this->assertEquals( 'Public Post Title', $entry->get_title() );
		$this->assertEquals( 3, $entry->get_page_number() );
		$this->assertNotEmpty( $entry->get_permalink() );
	}

	/**
	 * Test constructor with draft post (non-public)
	 */
	public function test_constructor_with_draft_post() {
		// Create a draft post
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Draft Post Title',
				'post_status' => 'draft',
				'post_type'   => 'post',
			)
		);

		$entry = new Feedback_Entry( $post_id, 'Fallback Title' );

		$this->assertSame( $post_id, $entry->get_id() );
		$this->assertEquals( 'Fallback Title', $entry->get_title() );
		$this->assertSame( 1, $entry->get_page_number() );
		$this->assertSame( '', $entry->get_permalink() );
	}

	/**
	 * Test from_submission with post missing ID
	 */
	public function test_from_submission_with_missing_id() {
		$post = new \WP_Post(
			(object) array(
				'post_title' => 'No ID Post',
			)
		);

		$entry = Feedback_Entry::from_submission( $post );

		$this->assertSame( 0, $entry->get_id() );
		$this->assertSame( '', $entry->get_title() );
		$this->assertSame( 1, $entry->get_page_number() );
	}

	/**
	 * Test from_submission with post missing title
	 */
	public function test_from_submission_with_missing_title() {
		$post = new \WP_Post(
			(object) array(
				'ID' => 456,
			)
		);

		$entry = Feedback_Entry::from_submission( $post, 3 );

		$this->assertEquals( 456, $entry->get_id() );
		$this->assertSame( '', $entry->get_title() );
		$this->assertEquals( 3, $entry->get_page_number() );
	}

	/**
	 * Test from_submission with empty post object
	 */
	public function test_from_submission_with_empty_post() {
		$post = new \WP_Post( (object) array() );

		$entry = Feedback_Entry::from_submission( $post );

		$this->assertSame( 0, $entry->get_id() );
		$this->assertSame( '', $entry->get_title() );
		$this->assertSame( 1, $entry->get_page_number() );
	}

	/**
	 * Test get_permalink with page number 1
	 */
	public function test_get_permalink_with_page_one() {
		// Create a public post
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
				'post_type'   => 'post',
			)
		);

		$entry     = new Feedback_Entry( $post_id, 'Test', 1 );
		$permalink = $entry->get_permalink();

		$this->assertNotEmpty( $permalink );
		$this->assertStringNotContainsString( 'page=', $permalink );
	}

	/**
	 * Test get_permalink with page number greater than 1
	 */
	public function test_get_permalink_with_page_greater_than_one() {
		// Create a public post
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
				'post_type'   => 'post',
			)
		);

		$entry     = new Feedback_Entry( $post_id, 'Test', 3 );
		$permalink = $entry->get_permalink();

		$this->assertStringContainsString( 'page=3', $permalink );
	}

	/**
	 * Test get_permalink with no valid post
	 */
	public function test_get_permalink_with_no_post() {
		$entry = new Feedback_Entry( 0, 'Test' );

		$this->assertSame( '', $entry->get_permalink() );
	}

	/**
	 * Test get_relative_permalink with valid permalink
	 */
	public function test_get_relative_permalink_with_valid_permalink() {
		// Create a public post
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
				'post_type'   => 'post',
			)
		);

		$entry              = new Feedback_Entry( $post_id, 'Test' );
		$relative_permalink = $entry->get_relative_permalink();

		$this->assertNotEmpty( $relative_permalink );
		$this->assertStringStartsNotWith( 'http', $relative_permalink );
	}

	/**
	 * Test get_relative_permalink with empty permalink
	 */
	public function test_get_relative_permalink_with_empty_permalink() {
		$entry = new Feedback_Entry( 0, 'Test' );

		$this->assertSame( '', $entry->get_relative_permalink() );
	}

	/**
	 * Test all getter methods
	 */
	public function test_getter_methods() {
		$entry = new Feedback_Entry( 0, 'Test Title', 5 );

		$this->assertSame( 0, $entry->get_id() );
		$this->assertEquals( 'Test Title', $entry->get_title() );
		$this->assertEquals( 5, $entry->get_page_number() );
	}

	/**
	 * Test serialize method
	 */
	public function test_serialize() {
		$entry      = new Feedback_Entry( 0, 'Serialized Title', 2 );
		$serialized = $entry->serialize();

		$expected = array(
			'entry_title' => 'Serialized Title',
			'entry_page'  => 2,
		);

		$this->assertEquals( $expected, $serialized );
		$this->assertIsArray( $serialized );
		$this->assertArrayHasKey( 'entry_title', $serialized );
		$this->assertArrayHasKey( 'entry_page', $serialized );
	}

	/**
	 * Test serialize with empty title
	 */
	public function test_serialize_with_empty_title() {
		$entry      = new Feedback_Entry( 0, '', 1 );
		$serialized = $entry->serialize();

		$expected = array(
			'entry_title' => '',
			'entry_page'  => 1,
		);

		$this->assertEquals( $expected, $serialized );
	}

	/**
	 * Test default page number
	 */
	public function test_default_page_number() {
		$entry = new Feedback_Entry( 0, 'Test' );

		$this->assertSame( 1, $entry->get_page_number() );
	}

	/**
	 * Test constructor overwrites ID when post is not public
	 */
	public function test_constructor_overwrites_id_for_non_public_post() {
		// Create a private post
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Private Post',
				'post_status' => 'private',
				'post_type'   => 'post',
			)
		);

		$entry = new Feedback_Entry( $post_id, 'Fallback Title' );

		// ID should be reset to 0 for non-public posts
		$this->assertSame( $post_id, $entry->get_id() );
		$this->assertEquals( 'Fallback Title', $entry->get_title() );
	}
}
