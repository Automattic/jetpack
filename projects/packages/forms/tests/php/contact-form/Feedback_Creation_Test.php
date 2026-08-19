<?php
/**
 * Unit Tests for Feedback Creation and Retrieval.
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
 * Test class for Feedback Creation and Retrieval
 *
 * @covers Automattic\Jetpack\Forms\ContactForm\Feedback
 */
#[CoversClass( Feedback::class )]
class Feedback_Creation_Test extends BaseTestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tear_down() {
		parent::tear_down();
		remove_all_filters( 'wordbless_wpdb_query_results' );
	}

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
	 * Helper: mock wpdb query results for get_all_source_post_ids().
	 *
	 * @param array $source_ids The source IDs to return from the query.
	 */
	private function mock_source_ids_query( $source_ids ) {
		add_filter(
			'wordbless_wpdb_query_results',
			function ( $results, $query ) use ( $source_ids ) {
				if ( strpos( $query, 'SELECT DISTINCT source_id' ) !== false ) {
					return array_map(
						function ( $id ) {
							return (object) array( 'source_id' => (string) $id );
						},
						$source_ids
					);
				}
				return $results;
			},
			10,
			2
		);
	}

	/**
	 * Test that get_all_source_post_ids returns empty array when no feedback exists.
	 */
	public function test_get_all_source_post_ids_returns_empty_when_no_feedback() {
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );
		$this->mock_source_ids_query( array() );

		$source_ids = Feedback::get_all_source_post_ids();
		$this->assertIsArray( $source_ids );
		$this->assertEmpty( $source_ids );
	}

	/**
	 * Test that get_all_source_post_ids returns source IDs from the query.
	 */
	public function test_get_all_source_post_ids_returns_ids() {
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );
		$this->mock_source_ids_query( array( 42, 99 ) );

		$source_ids = Feedback::get_all_source_post_ids();
		$this->assertContains( 42, $source_ids );
		$this->assertContains( 99, $source_ids );
	}

	/**
	 * Test that get_all_source_post_ids caches the result.
	 */
	public function test_get_all_source_post_ids_uses_cache() {
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );
		$this->mock_source_ids_query( array( 42 ) );

		// First call populates cache.
		$first_result = Feedback::get_all_source_post_ids();
		$this->assertContains( 42, $first_result );

		// Replace mock with different data — cache should still return old result.
		remove_all_filters( 'wordbless_wpdb_query_results' );
		$this->mock_source_ids_query( array( 42, 99 ) );

		$second_result = Feedback::get_all_source_post_ids();
		$this->assertEquals( $first_result, $second_result, 'Second call should return cached result' );
		$this->assertNotContains( 99, $second_result, 'New source should not appear in cached result' );

		// After cache clear, new data should appear.
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );
		$fresh_result = Feedback::get_all_source_post_ids();
		$this->assertContains( 99, $fresh_result, 'After cache clear, new source should appear' );
	}

	/**
	 * Test that get_all_source_post_ids query references both meta and post_parent.
	 */
	public function test_get_all_source_post_ids_query_includes_meta_and_fallback() {
		\wp_cache_delete( 'jetpack_forms_source_post_ids', 'jetpack_forms' );

		$captured_query = null;
		add_filter(
			'wordbless_wpdb_query_results',
			function ( $results, $query ) use ( &$captured_query ) {
				if ( strpos( $query, 'SELECT DISTINCT source_id' ) !== false ) {
					$captured_query = $query;
				}
				return $results;
			},
			10,
			2
		);

		Feedback::get_all_source_post_ids();

		$this->assertNotNull( $captured_query, 'Source IDs query should have been executed' );
		$this->assertStringContainsString( '_feedback_source_post_id', $captured_query, 'Query should use the source meta key' );
		$this->assertStringContainsString( 'post_parent', $captured_query, 'Query should include post_parent fallback' );
		$this->assertStringContainsString( Contact_Form::POST_TYPE, $captured_query, 'Query should exclude jetpack_form parents' );
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
