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

	public function test_save_stores_source_meta() {
		$_SERVER['REMOTE_ADDR']     = '127.0.0.1';
		$_SERVER['HTTP_USER_AGENT'] = 'unit-test';
		$_SERVER['HTTP_REFERER']    = 'test';

		// Create a source post to serve as the page context.
		$source_post_id = \wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Contact Page',
			)
		);
		$source_post    = \get_post( $source_post_id );

		$form       = new Contact_Form( array() );
		$_post_data = array(
			'name'  => 'Jane Doe',
			'email' => 'jane@example.com',
		);
		$feedback   = Feedback::from_submission( $_post_data, $form, $source_post );
		$result     = $feedback->save();

		$this->assertNotEquals( 0, $result );

		$saved_post = is_object( $result ) ? $result : \get_post( $result );
		$this->assertNotNull( $saved_post );

		$source_meta = \get_post_meta( $saved_post->ID, Feedback::SOURCE_META_KEY, true );
		$this->assertEquals( $source_post_id, (int) $source_meta, 'Source meta should be set to the source page ID' );
	}

	/**
	 * Test that get_all_source_post_ids returns empty array when no feedback exists.
	 */
	public function test_get_all_source_post_ids_returns_empty_when_no_feedback() {
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );

		$source_ids = Feedback::get_all_source_post_ids();
		$this->assertIsArray( $source_ids );
		$this->assertEmpty( $source_ids );
	}

	/**
	 * Test that get_all_source_post_ids returns source IDs from meta.
	 */
	public function test_get_all_source_post_ids_returns_ids_from_meta() {
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );

		$page_id = \wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Source Page',
			)
		);

		$fb_id = \wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'publish',
				'post_title'  => 'Feedback',
			)
		);
		\update_post_meta( $fb_id, Feedback::SOURCE_META_KEY, $page_id );

		$source_ids = Feedback::get_all_source_post_ids();
		$this->assertContains( $page_id, $source_ids );
	}

	/**
	 * Test that get_all_source_post_ids falls back to post_parent for old feedback without meta.
	 */
	public function test_get_all_source_post_ids_falls_back_to_post_parent() {
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );

		$page_id = \wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Old Source Page',
			)
		);

		// Old feedback: no source meta, post_parent points to the page.
		\wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'publish',
				'post_title'  => 'Old Feedback',
				'post_parent' => $page_id,
			)
		);

		$source_ids = Feedback::get_all_source_post_ids();
		$this->assertContains( $page_id, $source_ids );
	}

	/**
	 * Test that get_all_source_post_ids excludes jetpack_form parents from the fallback.
	 */
	public function test_get_all_source_post_ids_excludes_jetpack_form_parents() {
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );

		$form_id = \wp_insert_post(
			array(
				'post_type'   => Contact_Form::POST_TYPE,
				'post_status' => 'publish',
				'post_title'  => 'My Form',
			)
		);

		// Feedback parented to a jetpack_form — should not appear as a source.
		\wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'publish',
				'post_title'  => 'Form Feedback',
				'post_parent' => $form_id,
			)
		);

		$source_ids = Feedback::get_all_source_post_ids();
		$this->assertNotContains( $form_id, $source_ids );
	}

	/**
	 * Test that get_all_source_post_ids deduplicates IDs from meta and post_parent.
	 */
	public function test_get_all_source_post_ids_deduplicates() {
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );

		$page_id = \wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Shared Source',
			)
		);

		// Old feedback via post_parent (no meta).
		\wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'publish',
				'post_title'  => 'Old Feedback',
				'post_parent' => $page_id,
			)
		);

		// New feedback via meta.
		$fb_new = \wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'publish',
				'post_title'  => 'New Feedback',
			)
		);
		\update_post_meta( $fb_new, Feedback::SOURCE_META_KEY, $page_id );

		$source_ids = Feedback::get_all_source_post_ids();
		$this->assertCount( 1, array_keys( $source_ids, $page_id, true ), 'Source ID should appear only once' );
	}

	/**
	 * Test that get_all_source_post_ids uses cache on second call.
	 */
	public function test_get_all_source_post_ids_uses_cache() {
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );

		$page_id = \wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Cached Page',
			)
		);

		$fb_id = \wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'publish',
				'post_title'  => 'Feedback',
			)
		);
		\update_post_meta( $fb_id, Feedback::SOURCE_META_KEY, $page_id );

		// First call populates cache.
		$first_result = Feedback::get_all_source_post_ids();

		// Add new feedback with a different source — cache should still return old result.
		$page_id_2 = \wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'New Page',
			)
		);
		$fb_id_2   = \wp_insert_post(
			array(
				'post_type'   => 'feedback',
				'post_status' => 'publish',
				'post_title'  => 'Feedback 2',
			)
		);
		\update_post_meta( $fb_id_2, Feedback::SOURCE_META_KEY, $page_id_2 );

		$second_result = Feedback::get_all_source_post_ids();
		$this->assertEquals( $first_result, $second_result, 'Second call should return cached result' );
		$this->assertNotContains( $page_id_2, $second_result, 'New source should not appear in cached result' );

		// After cache clear, new source should appear.
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );
		$fresh_result = Feedback::get_all_source_post_ids();
		$this->assertContains( $page_id_2, $fresh_result, 'After cache clear, new source should appear' );
	}

	/**
	 * Test that save() always invalidates the source IDs cache.
	 */
	public function test_save_invalidates_source_ids_cache() {
		$_SERVER['REMOTE_ADDR']     = '127.0.0.1';
		$_SERVER['HTTP_USER_AGENT'] = 'unit-test';
		$_SERVER['HTTP_REFERER']    = 'test';

		$page_id     = \wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Source Page',
			)
		);
		$source_post = \get_post( $page_id );

		// Seed the cache.
		\wp_cache_set( 'jetpack_forms_source_post_ids', array( $page_id ), 'jetpack_forms' );

		$form     = new Contact_Form( array() );
		$feedback = Feedback::from_submission( array( 'name' => 'Test' ), $form, $source_post );
		$feedback->save();

		$cached = \wp_cache_get( 'jetpack_forms_source_post_ids', 'jetpack_forms' );
		$this->assertFalse( $cached, 'Cache should be invalidated after save' );
	}
}
