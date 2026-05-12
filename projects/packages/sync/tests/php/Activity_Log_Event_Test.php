<?php
/**
 * Tests for Activity Log event support.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Sync\Modules\Posts;
use WorDBless\BaseTestCase;

/**
 * Unit tests for Activity Log event support.
 */
class Activity_Log_Event_Test extends BaseTestCase {

	/**
	 * Runs before every test in this class.
	 */
	public function set_up() {
		if ( ! post_type_exists( Activity_Log_Event::POST_TYPE ) ) {
			Activity_Log_Event::register_post_type();
		}
	}

	/**
	 * Runs after every test in this class.
	 */
	public function tear_down() {
		$this->remove_activity_log_event_hooks();
		$this->reset_activity_log_event_initialized();

		parent::tear_down();
	}

	/**
	 * Tests that the Activity Log event post type is exposed under the intended REST base.
	 */
	public function test_activity_log_event_registers_rest_post_type_shape() {
		$post_type = get_post_type_object( Activity_Log_Event::POST_TYPE );

		$this->assertInstanceOf( \WP_Post_Type::class, $post_type );
		$this->assertTrue( $post_type->show_in_rest );
		$this->assertSame( Activity_Log_Event::REST_BASE, $post_type->rest_base );
	}

	/**
	 * Tests that repeated Activity Log event post type registration is harmless.
	 */
	public function test_activity_log_event_register_post_type_is_idempotent() {
		Activity_Log_Event::register_post_type();

		$post_type = get_post_type_object( Activity_Log_Event::POST_TYPE );

		$this->assertInstanceOf( \WP_Post_Type::class, $post_type );
		$this->assertSame( Activity_Log_Event::REST_BASE, $post_type->rest_base );
	}

	/**
	 * Tests that Activity Log event REST capabilities are create-only.
	 */
	public function test_activity_log_event_registers_create_only_rest_capabilities() {
		$post_type = get_post_type_object( Activity_Log_Event::POST_TYPE );

		$this->assertInstanceOf( \WP_Post_Type::class, $post_type );
		$this->assertSame( 'activity_log_event', $post_type->capability_type );
		$this->assertTrue( $post_type->map_meta_cap );
		$this->assertSame( 'manage_options', $post_type->cap->read );
		$this->assertSame( 'manage_options', $post_type->cap->read_private_posts );
		$this->assertSame( 'manage_options', $post_type->cap->create_posts );
		$this->assertSame( 'manage_options', $post_type->cap->publish_posts );
		$this->assertSame( 'do_not_allow', $post_type->cap->edit_posts );
		$this->assertSame( 'do_not_allow', $post_type->cap->edit_others_posts );
		$this->assertSame( 'do_not_allow', $post_type->cap->edit_private_posts );
		$this->assertSame( 'do_not_allow', $post_type->cap->edit_published_posts );
		$this->assertSame( 'do_not_allow', $post_type->cap->delete_posts );
		$this->assertSame( 'do_not_allow', $post_type->cap->delete_others_posts );
		$this->assertSame( 'do_not_allow', $post_type->cap->delete_private_posts );
		$this->assertSame( 'do_not_allow', $post_type->cap->delete_published_posts );
		$this->assertSame( 'read_activity_log_event', $post_type->cap->read_post );
		$this->assertSame( 'edit_activity_log_event', $post_type->cap->edit_post );
		$this->assertSame( 'delete_activity_log_event', $post_type->cap->delete_post );
	}

	/**
	 * Tests that Activity Log event hooks are registered even when Sync is disabled.
	 */
	public function test_activity_log_event_init_runs_when_sync_is_not_allowed() {
		$this->remove_activity_log_event_hooks();
		$this->reset_activity_log_event_initialized();
		$previous_sync_disabled = Settings::get_setting( 'disable' );
		Settings::update_settings( array( 'disable' => 1 ) );

		try {
			$this->assertFalse( Actions::sync_allowed() );

			Main::configure();

			$this->assertSame( 10, has_action( 'init', array( Activity_Log_Event::class, 'register_post_type' ) ) );
			$this->assertSame( 10, has_filter( 'rest_pre_insert_' . Activity_Log_Event::POST_TYPE, array( Activity_Log_Event::class, 'normalize_rest_post' ) ) );
			$this->assertSame( 10, has_filter( 'wp_insert_post_empty_content', array( Activity_Log_Event::class, 'prevent_invalid_post_insert' ) ) );
			$this->assertSame( 10, has_filter( 'wp_insert_post_data', array( Activity_Log_Event::class, 'normalize_post_data' ) ) );
		} finally {
			Settings::update_settings( array( 'disable' => $previous_sync_disabled ) );
			$this->remove_activity_log_event_hooks();
			$this->reset_activity_log_event_initialized();
		}
	}

	/**
	 * Tests that Activity Log event init is safe to call more than once.
	 */
	public function test_activity_log_event_init_is_idempotent() {
		$this->remove_activity_log_event_hooks();
		$this->reset_activity_log_event_initialized();

		for ( $i = 0; $i < 2; ++$i ) {
			Activity_Log_Event::init();
		}

		$this->assertSame( 10, has_action( 'init', array( Activity_Log_Event::class, 'register_post_type' ) ) );
		$this->assertSame( 10, has_filter( 'rest_pre_insert_' . Activity_Log_Event::POST_TYPE, array( Activity_Log_Event::class, 'normalize_rest_post' ) ) );
	}

	/**
	 * Tests that the REST auth gate handles WordPress.com public API site routes.
	 */
	public function test_activity_log_event_rest_auth_gate_handles_wpcom_site_routes() {
		$request  = new \WP_REST_Request( 'GET', '/wp/v2/sites/179267513/activity-log-events' );
		$response = Activity_Log_Event::authorize_rest_request( null, array(), $request );

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 'invalid_user_permission_activity_log_event', $response->get_error_code() );
	}

	/**
	 * Tests that the REST auth gate ignores adjacent route names.
	 */
	public function test_activity_log_event_rest_auth_gate_ignores_adjacent_routes() {
		$this->assertNull(
			Activity_Log_Event::authorize_rest_request(
				null,
				array(),
				new \WP_REST_Request( 'GET', '/wp/v2/activity-log-events-archive' )
			)
		);
		$this->assertNull(
			Activity_Log_Event::authorize_rest_request(
				null,
				array(),
				new \WP_REST_Request( 'GET', '/wp/v2/sites/179267513/activity-log-events-archive' )
			)
		);
	}

	/**
	 * Tests that valid helper input is sanitized before being stored.
	 */
	public function test_activity_log_event_sanitizes_payload() {
		$post_id = Activity_Log_Event::create(
			array(
				'title'       => ' <strong>Cache flushed</strong> ',
				'content'     => "First <script>alert( 'x' );</script><em>line</em>\nSecond line",
				'source'      => ' <code>mc</code> ',
				'severity'    => ' SUCCESS ',
				'external_id' => " <b>sync-run-123</b>\x00 ",
				'link'        => 'https://example.com/logs/123',
			)
		);

		$this->assertIsInt( $post_id );

		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertSame( Activity_Log_Event::POST_TYPE, $post->post_type );

		$payload = $this->get_activity_log_payload( $post_id );

		$this->assertSame( 'Cache flushed', $payload['title'] );
		$this->assertSame( 'First line Second line', $payload['content'] );
		$this->assertSame( 'mc', $payload['source'] );
		$this->assertSame( 'success', $payload['severity'] );
		$this->assertArrayNotHasKey( 'external_id', $payload );
		$this->assertArrayNotHasKey( 'link', $payload );
	}

	/**
	 * Tests that create registers the Activity Log post type if it is missing.
	 */
	public function test_activity_log_event_registers_post_type_before_insert() {
		unregister_post_type( Activity_Log_Event::POST_TYPE );

		$this->assertFalse( post_type_exists( Activity_Log_Event::POST_TYPE ) );

		$post_id = Activity_Log_Event::create(
			array(
				'title'   => 'Cache flushed',
				'content' => 'Plain text note.',
			)
		);

		$this->assertIsInt( $post_id );
		$this->assertTrue( post_type_exists( Activity_Log_Event::POST_TYPE ) );
	}

	/**
	 * Tests that source is optional.
	 */
	public function test_activity_log_event_allows_missing_source() {
		$post_id = Activity_Log_Event::create(
			array(
				'title'   => 'Cache flushed',
				'content' => "Plain text\nnote.",
			)
		);

		$this->assertIsInt( $post_id );

		$payload = $this->get_activity_log_payload( $post_id );

		$this->assertSame( 'Cache flushed', $payload['title'] );
		$this->assertSame( 'Plain text note.', $payload['content'] );
		$this->assertArrayNotHasKey( 'source', $payload );
	}

	/**
	 * Tests that empty severity defaults to info.
	 */
	public function test_activity_log_event_defaults_empty_severity_to_info() {
		$post_id = Activity_Log_Event::create(
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
		$post_id = Activity_Log_Event::create(
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
	 * Tests that required fields must be scalar values.
	 */
	public function test_activity_log_event_rejects_non_scalar_required_values() {
		$post_id = Activity_Log_Event::create(
			array(
				'title'   => array( 'Cache flushed' ),
				'content' => 'Plain text note.',
				'source'  => 'mc',
			)
		);

		$this->assertFalse( $post_id );
	}

	/**
	 * Tests that Activity Log event post data is normalized before insertion.
	 */
	public function test_activity_log_event_normalizes_post_data() {
		$data = wp_slash(
			array(
				'post_type'    => Activity_Log_Event::POST_TYPE,
				'post_title'   => 'Direct insert title',
				'post_content' => wp_json_encode(
					array(
						'title'    => ' <strong>Cache flushed</strong> ',
						'content'  => "Plain <em>text</em>\nnote.",
						'source'   => ' <code>mc</code> ',
						'severity' => ' WARNING ',
						'link'     => 'https://example.com/logs/123',
					),
					JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
				),
				'post_status'  => 'publish',
			)
		);

		$normalized = Activity_Log_Event::normalize_post_data( $data, $data );

		$this->assertSame( 'Cache flushed', wp_unslash( $normalized['post_title'] ) );

		$payload = json_decode( wp_unslash( $normalized['post_content'] ), true );

		$this->assertIsArray( $payload );

		$this->assertSame( 'Cache flushed', $payload['title'] );
		$this->assertSame( 'Plain text note.', $payload['content'] );
		$this->assertSame( 'mc', $payload['source'] );
		$this->assertSame( 'warning', $payload['severity'] );
		$this->assertArrayNotHasKey( 'link', $payload );
	}

	/**
	 * Tests that the core insert hook rejects invalid Activity Log event payloads.
	 */
	public function test_activity_log_event_insert_validation_rejects_invalid_payload() {
		$this->add_activity_log_post_insert_filters();

		try {
			$post_id = wp_insert_post(
				wp_slash(
					array(
						'post_type'    => Activity_Log_Event::POST_TYPE,
						'post_title'   => 'Direct insert',
						'post_content' => wp_json_encode(
							array(
								'title'    => 'Cache flushed',
								'content'  => 'Plain text note.',
								'severity' => 'critical',
							),
							JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
						),
						'post_status'  => 'publish',
					)
				),
				true
			);
		} finally {
			$this->remove_activity_log_post_insert_filters();
		}

		$this->assertInstanceOf( \WP_Error::class, $post_id );
	}

	/**
	 * Tests that helper-created events pass Sync published-post enqueue validation.
	 */
	public function test_activity_log_event_passes_sync_published_post_enqueue_validation() {
		$post_id = Activity_Log_Event::create(
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
	 * Tests that helper-created events enqueue through Sync save-post.
	 */
	public function test_activity_log_event_passes_sync_save_post_enqueue() {
		$post_id = Activity_Log_Event::create(
			array(
				'title'   => 'Cache flushed',
				'content' => 'Plain text note.',
				'source'  => 'mc',
			)
		);

		$this->assertIsInt( $post_id );

		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertIsArray( $this->filter_activity_log_sync_save_post( $post_id, $post ) );
	}

	/**
	 * Tests that direct CPT inserts with invalid payloads fail Sync save-post enqueue validation.
	 */
	public function test_activity_log_sync_save_post_validation_rejects_invalid_payload() {
		$post_id = $this->insert_activity_log_post(
			array(
				'title'    => 'Cache flushed',
				'content'  => 'Plain text note.',
				'severity' => 'critical',
			)
		);

		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertFalse( $this->filter_activity_log_sync_save_post( $post_id, $post ) );
	}

	/**
	 * Tests that Activity Log events cannot be publicized.
	 */
	public function test_activity_log_event_prevents_publicize() {
		$post_id = Activity_Log_Event::create(
			array(
				'title'   => 'Cache flushed',
				'content' => 'Plain text note.',
			)
		);

		$this->assertIsInt( $post_id );

		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertFalse( Activity_Log_Event::prevent_publicize( true, $post ) );
	}

	/**
	 * Tests that Activity Log events are removed from Jetpack sitemap post types.
	 */
	public function test_activity_log_event_filters_sitemap_post_types() {
		$post_types = Activity_Log_Event::filter_sitemap_post_types(
			array(
				'post',
				Activity_Log_Event::POST_TYPE,
				'page',
			)
		);

		$this->assertSame( array( 'post', 'page' ), $post_types );
	}

	/**
	 * Tests that direct CPT inserts without a source pass Sync published-post enqueue validation.
	 */
	public function test_activity_log_sync_published_post_validation_allows_missing_source() {
		$post_id = $this->insert_activity_log_post(
			array(
				'title'   => 'Cache flushed',
				'content' => 'Plain text note.',
			)
		);

		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertIsArray( $this->filter_activity_log_sync_published_post( $post_id, $post ) );
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
	 * Tests that direct CPT inserts with invalid severity fail Sync published-post enqueue validation.
	 */
	public function test_activity_log_sync_published_post_validation_rejects_invalid_severity() {
		$post_id = $this->insert_activity_log_post(
			array(
				'title'    => 'Cache flushed',
				'content'  => 'Plain text note.',
				'severity' => 'critical',
			)
		);

		$post = get_post( $post_id );

		$this->assertInstanceOf( \WP_Post::class, $post );
		$this->assertFalse( $this->filter_activity_log_sync_published_post( $post_id, $post ) );
	}

	/**
	 * Tests that direct CPT inserts with content that sanitizes to empty fail Sync published-post enqueue validation.
	 */
	public function test_activity_log_sync_published_post_validation_rejects_content_that_sanitizes_to_empty() {
		$post_id = $this->insert_activity_log_post(
			array(
				'title'   => 'Cache flushed',
				'content' => "<strong> </strong>\n\t",
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

		$payload = json_decode( $post->post_content, true );
		if ( ! is_array( $payload ) ) {
			$payload = json_decode( wp_unslash( $post->post_content ), true );
		}

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
					'post_type' => Activity_Log_Event::POST_TYPE,
				),
				$post,
			)
		);
	}

	/**
	 * Adds Activity Log event insert filters for tests.
	 */
	private function add_activity_log_post_insert_filters() {
		add_filter( 'wp_insert_post_empty_content', array( Activity_Log_Event::class, 'prevent_invalid_post_insert' ), 10, 2 );
		add_filter( 'wp_insert_post_data', array( Activity_Log_Event::class, 'normalize_post_data' ), 10, 2 );
	}

	/**
	 * Removes Activity Log event insert filters for tests.
	 */
	private function remove_activity_log_post_insert_filters() {
		remove_filter( 'wp_insert_post_empty_content', array( Activity_Log_Event::class, 'prevent_invalid_post_insert' ), 10 );
		remove_filter( 'wp_insert_post_data', array( Activity_Log_Event::class, 'normalize_post_data' ), 10 );
	}

	/**
	 * Removes Activity Log event hooks for tests.
	 */
	private function remove_activity_log_event_hooks() {
		remove_action( 'init', array( Activity_Log_Event::class, 'register_post_type' ), 10 );
		remove_filter( 'rest_request_before_callbacks', array( Activity_Log_Event::class, 'authorize_rest_request' ), 10 );
		remove_filter( 'rest_pre_insert_' . Activity_Log_Event::POST_TYPE, array( Activity_Log_Event::class, 'normalize_rest_post' ), 10 );
		remove_filter( 'wp_insert_post_empty_content', array( Activity_Log_Event::class, 'prevent_invalid_post_insert' ), 10 );
		remove_filter( 'wp_insert_post_data', array( Activity_Log_Event::class, 'normalize_post_data' ), 10 );
		remove_filter( 'publicize_should_publicize_published_post', array( Activity_Log_Event::class, 'prevent_publicize' ), 10 );
		remove_filter( 'jetpack_sitemap_post_types', array( Activity_Log_Event::class, 'filter_sitemap_post_types' ), 10 );
	}

	/**
	 * Resets Activity Log event initialization state for tests.
	 */
	private function reset_activity_log_event_initialized() {
		$reflection = new \ReflectionProperty( Activity_Log_Event::class, 'initialized' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( null, false );
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
					'post_type'    => Activity_Log_Event::POST_TYPE,
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
