<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Podcast\Tracks;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_Term;

/**
 * Recorder methods are invoked directly so creating a fixture post via
 * `wp_insert_post()` doesn't double-fire `wp_after_insert_post`. Captured
 * events are read out of the bootstrap shim's global buffer.
 *
 * @covers \Automattic\Jetpack\Podcast\Tracks
 */
#[CoversClass( Tracks::class )]
class Tracks_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();

		// WorDBless skips `create_initial_taxonomies`.
		if ( ! taxonomy_exists( 'category' ) ) {
			register_taxonomy( 'category', 'post', array( 'hierarchical' => true ) );
		}

		$GLOBALS['jetpack_podcast_test_captured_events'] = array();
	}

	protected function tearDown(): void {
		delete_option( 'podcasting_category_id' );
		delete_option( 'podcasting_archive' );
		delete_option( 'podcasting_show_urls' );
		delete_option( 'podcasting_show_states' );
		delete_option( 'podcasting_title' );
		delete_option( 'podcasting_email' );
		delete_option( 'podcasting_talent_name' );
		delete_option( 'podcast_show_launched_tracked' );
		wp_cache_flush();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
		unset( $GLOBALS['jetpack_podcast_test_captured_events'] );
		parent::tearDown();
	}

	private function events_named( string $event_name ): array {
		return array_values(
			array_filter(
				$GLOBALS['jetpack_podcast_test_captured_events'],
				static function ( array $event ) use ( $event_name ) {
					return $event['event_name'] === $event_name;
				}
			)
		);
	}

	/**
	 * WorDBless lacks term-taxonomy plumbing, so seed the `terms` object cache
	 * with a fully-formed `WP_Term` directly — `get_term()` short-circuits
	 * to that before falling through to its DB query.
	 */
	private function configure_podcast_category( int $id = 42 ): int {
		$term = new WP_Term(
			(object) array(
				'term_id'          => $id,
				'name'             => 'Podcast',
				'slug'             => 'podcast',
				'taxonomy'         => 'category',
				'term_taxonomy_id' => $id,
			)
		);
		wp_cache_set( $id, $term, 'terms' );
		update_option( 'podcasting_category_id', $id );
		return $id;
	}

	/**
	 * `wp_set_post_categories` is a no-op under WorDBless (no term-relationships
	 * table), so prime the `category_relationships` cache directly. Default
	 * content includes a site-hosted `.mp3` URL so `has_podcast_media()` accepts.
	 */
	private function insert_post_in_category(
		int $category_id,
		string $status = 'publish',
		string $content = '<!-- wp:audio --><figure class="wp-block-audio"><audio controls src="https://example.org/episode.mp3"></audio></figure><!-- /wp:audio -->'
	): \WP_Post {
		$post_id = wp_insert_post(
			array(
				'post_title'   => 'Episode ' . wp_generate_uuid4(),
				'post_content' => $content,
				'post_status'  => $status,
				'post_type'    => 'post',
			)
		);
		wp_cache_set( (int) $post_id, array( $category_id ), 'category_relationships' );
		return get_post( (int) $post_id );
	}

	public function test_episode_published_emits_for_first_published_post_in_category() {
		$cat_id = $this->configure_podcast_category();
		$post   = $this->insert_post_in_category( $cat_id );

		Tracks::record_episode_published( $post->ID, $post, false, null );

		$events = $this->events_named( 'wpcom_podcast_episode_published' );
		$this->assertCount( 1, $events );
		$this->assertSame( $post->ID, $events[0]['properties']['post_id'] );
		$this->assertTrue( $events[0]['properties']['is_first_episode_for_site'] );
	}

	public function test_episode_published_fires_show_launched_only_once_per_site() {
		$cat_id = $this->configure_podcast_category();

		$first = $this->insert_post_in_category( $cat_id );
		Tracks::record_episode_published( $first->ID, $first, false, null );

		$second = $this->insert_post_in_category( $cat_id );
		Tracks::record_episode_published( $second->ID, $second, false, null );

		$this->assertCount( 1, $this->events_named( 'wpcom_podcast_show_launched' ) );
		$this->assertCount( 2, $this->events_named( 'wpcom_podcast_episode_published' ) );
	}

	public function test_episode_published_skips_when_post_was_already_published() {
		$cat_id = $this->configure_podcast_category();
		$post   = $this->insert_post_in_category( $cat_id );

		$before              = clone $post;
		$before->post_status = 'publish';
		Tracks::record_episode_published( $post->ID, $post, true, $before );

		$this->assertEmpty( $this->events_named( 'wpcom_podcast_episode_published' ) );
	}

	public function test_episode_published_skips_when_post_not_in_podcast_category() {
		$this->configure_podcast_category();
		$other_term = new WP_Term(
			(object) array(
				'term_id'          => 99,
				'name'             => 'Other',
				'slug'             => 'other',
				'taxonomy'         => 'category',
				'term_taxonomy_id' => 99,
			)
		);
		wp_cache_set( 99, $other_term, 'terms' );

		$post = $this->insert_post_in_category( 99 );
		Tracks::record_episode_published( $post->ID, $post, false, null );

		$this->assertEmpty( $this->events_named( 'wpcom_podcast_episode_published' ) );
	}

	public function test_episode_published_skips_when_no_category_configured() {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Untagged',
				'post_status' => 'publish',
				'post_type'   => 'post',
			)
		);
		$post    = get_post( (int) $post_id );

		Tracks::record_episode_published( $post->ID, $post, false, null );

		$this->assertEmpty( $this->events_named( 'wpcom_podcast_episode_published' ) );
	}

	public function test_episode_published_skips_post_without_podcast_media() {
		$cat_id = $this->configure_podcast_category();
		$post   = $this->insert_post_in_category( $cat_id, 'publish', 'No audio in this post.' );

		Tracks::record_episode_published( $post->ID, $post, false, null );

		$this->assertEmpty( $this->events_named( 'wpcom_podcast_episode_published' ) );
	}

	public function test_media_uploaded_emits_for_audio_when_podcasting_enabled() {
		$this->configure_podcast_category();

		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'audio/mpeg',
				'post_title'     => 'episode.mp3',
			)
		);

		Tracks::record_media_uploaded( (int) $attachment_id );

		$events = $this->events_named( 'wpcom_podcast_media_uploaded' );
		$this->assertCount( 1, $events );
		$this->assertSame( 'audio/mpeg', $events[0]['properties']['mime_type'] );
		$this->assertSame( (int) $attachment_id, $events[0]['properties']['attachment_id'] );
	}

	public function test_media_uploaded_skips_non_audio_video() {
		$this->configure_podcast_category();

		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'image/jpeg',
				'post_title'     => 'cover.jpg',
			)
		);

		Tracks::record_media_uploaded( (int) $attachment_id );

		$this->assertEmpty( $this->events_named( 'wpcom_podcast_media_uploaded' ) );
	}

	public function test_media_uploaded_skips_when_podcasting_disabled() {
		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'audio/mpeg',
				'post_title'     => 'orphan.mp3',
			)
		);

		Tracks::record_media_uploaded( (int) $attachment_id );

		$this->assertEmpty( $this->events_named( 'wpcom_podcast_media_uploaded' ) );
	}

	public function test_status_changed_emits_enabled_when_category_first_set() {
		Tracks::record_category_added( 'podcasting_category_id', 42 );

		$events = $this->events_named( 'wpcom_podcasting_status_changed' );
		$this->assertCount( 1, $events );
		$this->assertSame( 'enabled', $events[0]['properties']['status'] );
		$this->assertSame( 0, $events[0]['properties']['previous_category_id'] );
		$this->assertSame( 42, $events[0]['properties']['new_category_id'] );
	}

	public function test_status_changed_emits_disabled_when_category_cleared() {
		Tracks::record_category_updated( 42, 0, 'podcasting_category_id' );

		$events = $this->events_named( 'wpcom_podcasting_status_changed' );
		$this->assertCount( 1, $events );
		$this->assertSame( 'disabled', $events[0]['properties']['status'] );
	}

	public function test_status_changed_emits_changed_when_category_swapped() {
		Tracks::record_category_updated( 42, 99, 'podcasting_category_id' );

		$events = $this->events_named( 'wpcom_podcasting_status_changed' );
		$this->assertCount( 1, $events );
		$this->assertSame( 'changed', $events[0]['properties']['status'] );
	}

	public function test_show_url_added_emits_on_first_entry_per_directory() {
		Tracks::record_show_url_added(
			'podcasting_show_urls',
			array( 'apple' => 'https://podcasts.apple.com/show/123' )
		);

		$events = $this->events_named( 'wpcom_podcasting_show_url_saved' );
		$this->assertCount( 1, $events );
		$this->assertSame( 'apple', $events[0]['properties']['app'] );
	}

	public function test_show_url_updated_skips_when_directory_already_had_url() {
		Tracks::record_show_url_updated(
			array( 'apple' => 'https://podcasts.apple.com/show/old' ),
			array( 'apple' => 'https://podcasts.apple.com/show/new' ),
			'podcasting_show_urls'
		);

		$this->assertEmpty( $this->events_named( 'wpcom_podcasting_show_url_saved' ) );
	}

	public function test_show_url_added_emits_only_once_for_first_new_directory() {
		Tracks::record_show_url_added(
			'podcasting_show_urls',
			array(
				'apple'   => 'https://podcasts.apple.com/show/123',
				'spotify' => 'https://open.spotify.com/show/456',
			)
		);

		$this->assertCount( 1, $this->events_named( 'wpcom_podcasting_show_url_saved' ) );
	}

	public function test_settings_saved_emits_snapshot_with_pii_redacted() {
		update_option( 'podcasting_title', 'New Title' );
		update_option( 'podcasting_email', 'host@example.com' );
		update_option( 'podcasting_talent_name', 'Jane Host' );

		Tracks::record_settings_saved();

		$events = $this->events_named( 'wpcom_podcasting_settings_saved' );
		$this->assertCount( 1, $events );
		$this->assertSame( 'New Title', $events[0]['properties']['podcasting_title'] );
		// PII is redacted from the payload.
		$this->assertArrayNotHasKey( 'podcasting_email', $events[0]['properties'] );
		$this->assertArrayNotHasKey( 'podcasting_talent_name', $events[0]['properties'] );
	}

	public function test_init_wires_settings_saved_recorder() {
		Tracks::init();

		$this->assertNotFalse(
			has_action( 'jetpack_podcast_settings_saved', array( Tracks::class, 'record_settings_saved' ) )
		);
	}
}
