<?php
/**
 * Tests for Activity Log helper functions.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Sync\Modules\Posts;
use WorDBless\BaseTestCase;

/**
 * Unit tests for Activity Log helper functions.
 */
class Activity_Log_Functions_Test extends BaseTestCase {

	/**
	 * Runs before every test in this class.
	 */
	public function set_up() {
		if ( ! post_type_exists( Posts::ACTIVITY_LOG_CPT ) ) {
			do_action( 'init' );
		}
	}

	/**
	 * Tests that valid helper input is sanitized before being stored.
	 */
	public function test_activity_log_event_sanitizes_payload() {
		$post_id = \jetpack_activity_log_event(
			array(
				'title'       => ' <strong>Cache flushed</strong> ',
				'content'     => "First <em>line</em>\nSecond line",
				'source'      => ' <code>mc</code> ',
				'severity'    => ' SUCCESS ',
				'external_id' => " <b>sync-run-123</b>\x00 ",
				'link'        => 'https://example.com/logs/123',
			)
		);

		$this->assertIsInt( $post_id );

		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertSame( 'jp_act_log_event', $post->post_type );

		$payload = $this->get_activity_log_payload( $post_id );

		$this->assertSame( 'Cache flushed', $payload['title'] );
		$this->assertSame( "First line\nSecond line", $payload['content'] );
		$this->assertSame( 'mc', $payload['source'] );
		$this->assertSame( 'success', $payload['severity'] );
		$this->assertSame( 'sync-run-123', $payload['external_id'] );
		$this->assertSame( 'https://example.com/logs/123', $payload['link'] );
	}

	/**
	 * Tests that empty severity defaults to info.
	 */
	public function test_activity_log_event_defaults_empty_severity_to_info() {
		$post_id = \jetpack_activity_log_event(
			array(
				'title'    => 'Cache flushed',
				'content'  => 'Plain text note.',
				'source'   => 'mc',
				'severity' => '',
			)
		);

		$this->assertIsInt( $post_id );

		$payload = $this->get_activity_log_payload( $post_id );

		$this->assertSame( 'info', $payload['severity'] );
	}

	/**
	 * Tests that invalid severity values fail validation.
	 */
	public function test_activity_log_event_rejects_invalid_severity() {
		$post_id = \jetpack_activity_log_event(
			array(
				'title'    => 'Cache flushed',
				'content'  => 'Plain text note.',
				'source'   => 'mc',
				'severity' => 'critical',
			)
		);

		$this->assertFalse( $post_id );
	}

	/**
	 * Tests that external IDs are truncated to the documented maximum length.
	 */
	public function test_activity_log_event_truncates_external_id() {
		$post_id = \jetpack_activity_log_event(
			array(
				'title'       => 'Cache flushed',
				'content'     => 'Plain text note.',
				'source'      => 'mc',
				'external_id' => str_repeat( 'a', 101 ),
			)
		);

		$this->assertIsInt( $post_id );

		$payload = $this->get_activity_log_payload( $post_id );

		$this->assertSame( str_repeat( 'a', 100 ), $payload['external_id'] );
	}

	/**
	 * Tests that required fields must be scalar values.
	 */
	public function test_activity_log_event_rejects_non_scalar_required_values() {
		$post_id = \jetpack_activity_log_event(
			array(
				'title'   => array( 'Cache flushed' ),
				'content' => 'Plain text note.',
				'source'  => 'mc',
			)
		);

		$this->assertFalse( $post_id );
	}

	/**
	 * Tests that helper-created events pass Sync published-post enqueue validation.
	 */
	public function test_activity_log_event_passes_sync_published_post_enqueue_validation() {
		$post_id = \jetpack_activity_log_event(
			array(
				'title'   => 'Cache flushed',
				'content' => 'Plain text note.',
				'source'  => 'mc',
			)
		);

		$this->assertIsInt( $post_id );

		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertIsArray( $this->filter_activity_log_sync_published_post( $post_id, $post ) );
	}

	/**
	 * Tests that helper-created events do not enqueue through Sync save-post.
	 */
	public function test_activity_log_event_skips_sync_save_post_enqueue() {
		$post_id = \jetpack_activity_log_event(
			array(
				'title'   => 'Cache flushed',
				'content' => 'Plain text note.',
				'source'  => 'mc',
			)
		);

		$this->assertIsInt( $post_id );

		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertFalse( $this->filter_activity_log_sync_save_post( $post_id, $post ) );
	}

	/**
	 * Tests that direct CPT inserts with non-scalar required fields fail Sync published-post enqueue validation.
	 */
	public function test_activity_log_sync_published_post_validation_rejects_non_scalar_required_values() {
		$post_id = $this->insert_activity_log_post(
			array(
				'title'   => array( 'Cache flushed' ),
				'content' => 'Plain text note.',
				'source'  => 'mc',
			)
		);

		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertFalse( $this->filter_activity_log_sync_published_post( $post_id, $post ) );
	}

	/**
	 * Gets the stored activity log payload for a post.
	 *
	 * @param int $post_id Post ID.
	 * @return array
	 */
	private function get_activity_log_payload( $post_id ) {
		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );

		$payload = json_decode( wp_unslash( $post->post_content ), true );

		$this->assertIsArray( $payload );

		return $payload;
	}

	/**
	 * Filters an Activity Log post through Sync save-post enqueue validation.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 * @return array|false
	 */
	private function filter_activity_log_sync_save_post( $post_id, \WP_Post $post ) {
		$module = new Posts();

		return $module->filter_jetpack_sync_before_enqueue_jetpack_sync_save_post(
			array(
				$post_id,
				$post,
				false,
				array(
					'previous_status' => 'new',
				),
			)
		);
	}

	/**
	 * Filters an Activity Log post through Sync published-post enqueue validation.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 * @return array|false
	 */
	private function filter_activity_log_sync_published_post( $post_id, \WP_Post $post ) {
		$module = new Posts();

		return $module->filter_jetpack_sync_before_enqueue_jetpack_published_post(
			array(
				$post_id,
				array(
					'post_type' => Posts::ACTIVITY_LOG_CPT,
				),
				$post,
			)
		);
	}

	/**
	 * Inserts an Activity Log CPT post directly.
	 *
	 * @param array $payload Activity Log payload.
	 * @return int
	 */
	private function insert_activity_log_post( array $payload ) {
		$post_id = wp_insert_post(
			wp_slash(
				array(
					'post_type'    => Posts::ACTIVITY_LOG_CPT,
					'post_title'   => 'Direct insert',
					'post_content' => wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
					'post_status'  => 'publish',
				)
			),
			true
		);

		$this->assertIsInt( $post_id );

		return $post_id;
	}
}
