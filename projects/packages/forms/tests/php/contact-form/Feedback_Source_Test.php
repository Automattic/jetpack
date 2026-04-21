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
 * Test class for Feedback_Source
 *
 * @covers \Automattic\Jetpack\Forms\ContactForm\Feedback_Source
 */
#[CoversClass( Feedback_Source::class )]
class Feedback_Source_Test extends BaseTestCase {
	/**
	 * Test constructor with invalid ID (0 or negative)
	 */
	public function test_constructor_with_invalid_id() {
		$entry = new Feedback_Source( 0, 'Test Title', 2 );

		$this->assertSame( 0, $entry->get_id() );
		$this->assertEquals( 'Test Title', $entry->get_title() );
		$this->assertEquals( 2, $entry->get_page_number() );
		$this->assertSame( home_url() . '?page=2', $entry->get_permalink() );
	}

	/**
	 * Test constructor with negative ID
	 */
	public function test_constructor_with_negative_id() {
		$entry = new Feedback_Source( -5, 'Test Title' );

		$this->assertSame( 0, $entry->get_id() );
		$this->assertEquals( '(deleted) Test Title', $entry->get_title() );
		$this->assertSame( 1, $entry->get_page_number() );
		$this->assertSame( '', $entry->get_permalink() );
	}

	/**
	 * Test constructor with valid ID but non-existent post
	 */
	public function test_constructor_with_nonexistent_post() {
		$entry = new Feedback_Source( 999999, 'Fallback Title' );

		$this->assertSame( 999999, $entry->get_id() );
		$this->assertEquals( '(deleted) Fallback Title', $entry->get_title() );
		$this->assertSame( 1, $entry->get_page_number() );
		$this->assertSame( '', $entry->get_permalink() );
		$this->assertSame( '', $entry->get_relative_permalink() );
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

		$entry = new Feedback_Source( $post_id, 'Fallback Title', 3 );

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

		$entry = new Feedback_Source( $post_id, 'Fallback Title' );

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

		$entry = Feedback_Source::from_submission( $post );

		$this->assertSame( 0, $entry->get_id() );
		$this->assertSame( '', $entry->get_title() );
		$this->assertSame( 1, $entry->get_page_number() );
	}

	/**
	 * Test from_submission with post missing title
	 */
	public function test_from_submission_with_missing_title() {

		$post_id = wp_insert_post(
			array(
				'post_status'  => 'publish',
				'post_type'    => 'post',
				'post_content' => 'Content without title',
				'post_title'   => 'howdy',
			)
		);
		wp_update_post(
			array(
				'ID'         => $post_id,
				'post_title' => '',
			)
		);
		$post = \get_post( $post_id );

		$entry = Feedback_Source::from_submission( $post, 3 );

		$this->assertEquals( $post_id, $entry->get_id() );
		$this->assertSame( '', $entry->get_title() );
		$this->assertEquals( 3, $entry->get_page_number() );
	}

	/**
	 * Test from_submission with empty post object
	 */
	public function test_from_submission_with_empty_post() {
		$post = new \WP_Post( (object) array() );

		$entry = Feedback_Source::from_submission( $post );

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

		$entry     = new Feedback_Source( $post_id, 'Test', 1 );
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

		$entry     = new Feedback_Source( $post_id, 'Test', 3 );
		$permalink = $entry->get_permalink();

		$this->assertStringContainsString( 'page=3', $permalink );
	}

	/**
	 * Test get_permalink with no valid post
	 */
	public function test_get_permalink_with_no_post() {
		$entry = new Feedback_Source( 0, 'Test' );

		$this->assertSame( home_url(), $entry->get_permalink() );
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

		$entry              = new Feedback_Source( $post_id, 'Test' );
		$relative_permalink = $entry->get_relative_permalink();

		$this->assertNotEmpty( $relative_permalink );
		$this->assertStringStartsNotWith( 'http', $relative_permalink );
	}

	/**
	 * Test get_relative_permalink with empty permalink
	 */
	public function test_get_relative_permalink_with_empty_permalink() {
		$entry = new Feedback_Source( 0, 'Test' );

		$this->assertSame( '', $entry->get_relative_permalink() );
	}

	/**
	 * Test all getter methods
	 */
	public function test_getter_methods() {
		$entry = new Feedback_Source( 0, 'Test Title', 5 );

		$this->assertSame( 0, $entry->get_id() );
		$this->assertEquals( 'Test Title', $entry->get_title() );
		$this->assertEquals( 5, $entry->get_page_number() );
	}

	/**
	 * Test serialize method
	 */
	public function test_serialize() {
		$entry      = new Feedback_Source( 0, 'Serialized Title', 2 );
		$serialized = $entry->serialize();

		$expected = array(
			'entry_title' => 'Serialized Title',
			'entry_page'  => 2,
			'source_id'   => 0,
			'source_type' => 'single',
			'request_url' => '',
		);

		$this->assertEquals( $expected, $serialized );
		$this->assertIsArray( $serialized );
		$this->assertArrayHasKey( 'entry_title', $serialized );
		$this->assertArrayHasKey( 'entry_page', $serialized );

		$new_source = Feedback_Source::from_serialized( $serialized );
		$this->assertEquals( $serialized, $new_source->serialize() );
	}

	/**
	 * Test serialize with empty title
	 */
	public function test_serialize_with_empty_title() {
		$entry      = new Feedback_Source( 0, '', 1 );
		$serialized = $entry->serialize();

		$expected = array(
			'entry_title' => '',
			'entry_page'  => 1,
			'source_id'   => 0,
			'source_type' => 'single',
			'request_url' => '',
		);

		$this->assertEquals( $expected, $serialized );

		$new_source = Feedback_Source::from_serialized( $serialized );
		$this->assertEquals( $expected, $new_source->serialize() );
	}

	/**
	 * Test default page number
	 */
	public function test_default_page_number() {
		$entry = new Feedback_Source( 0, 'Test' );

		$this->assertSame( 1, $entry->get_page_number() );
	}

	/**
	 * A fresh Feedback_Source is not a test submission by default.
	 */
	public function test_is_test_defaults_to_false() {
		$entry = new Feedback_Source( 0, 'Test Title' );

		$this->assertFalse( $entry->is_test() );
	}

	/**
	 * The set_is_test setter flips the flag both ways.
	 */
	public function test_set_is_test_flips_the_flag() {
		$entry = new Feedback_Source( 0, 'Test Title' );
		$entry->set_is_test( true );

		$this->assertTrue( $entry->is_test() );

		$entry->set_is_test( false );
		$this->assertFalse( $entry->is_test() );
	}

	/**
	 * When flagged as test, serialize includes is_test and round-trips through from_serialized.
	 */
	public function test_is_test_round_trips_through_serialize() {
		$entry = new Feedback_Source( 0, 'Preview Title', 1 );
		$entry->set_is_test( true );

		$serialized = $entry->serialize();

		$this->assertArrayHasKey( 'is_test', $serialized );
		$this->assertTrue( $serialized['is_test'] );

		$restored = Feedback_Source::from_serialized( $serialized );
		$this->assertTrue( $restored->is_test() );
	}

	/**
	 * Serialize omits the is_test key entirely when the flag is not set,
	 * so existing serialized payloads are not affected.
	 */
	public function test_serialize_omits_is_test_when_false() {
		$entry      = new Feedback_Source( 0, 'Normal Title' );
		$serialized = $entry->serialize();

		$this->assertArrayNotHasKey( 'is_test', $serialized );
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

		$entry = new Feedback_Source( $post_id, 'Fallback Title' );

		// ID should be reset to 0 for non-public posts
		$this->assertSame( $post_id, $entry->get_id() );
		$this->assertEquals( 'Fallback Title', $entry->get_title() );
	}
}
