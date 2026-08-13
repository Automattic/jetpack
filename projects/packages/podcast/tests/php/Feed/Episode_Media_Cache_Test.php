<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests\Feed;

use Automattic\Jetpack\Podcast\Feed\Episode_Media_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_Post;

/**
 * WorDBless returns no rows for the attachment lookup, so the SQL it generates
 * is left to the integration run. Everything built on top of it is covered
 * here — batch hits are staged through `posts_pre_query`, which lets these
 * assert the part that matters: a hit and a miss both resolve exactly the way
 * `attachment_url_to_postid()` would.
 *
 * @covers \Automattic\Jetpack\Podcast\Feed\Episode_Media_Cache
 */
#[CoversClass( Episode_Media_Cache::class )]
class Episode_Media_Cache_Test extends BaseTestCase {

	private const URL = 'https://example.com/wp-content/uploads/2024/03/ep-1.mp3';

	protected function tearDown(): void {
		Episode_Media_Cache::prime( array() );
		remove_all_filters( 'pre_attachment_url_to_postid' );
		remove_all_filters( 'attachment_url_to_postid' );
		remove_all_filters( 'posts_pre_query' );
		remove_all_filters( 'get_post_metadata' );
		wp_cache_flush();
		parent::tearDown();
	}

	/**
	 * A post carrying an `enclosure` row, shaped the way `do_enclose()` stores
	 * it (`url\nlength\nmime\n`).
	 */
	private function seed_episode( int $post_id, string ...$urls ): WP_Post {
		foreach ( $urls as $url ) {
			add_post_meta( $post_id, 'enclosure', $url . "\n12345\naudio/mpeg\n" );
		}

		return new WP_Post( (object) array( 'ID' => $post_id ) );
	}

	/**
	 * Resolve every URL through a filter so the fallback path is observable —
	 * WorDBless has no rows for core's own query to find.
	 */
	private function resolve_via_filter( int $attachment_id ): void {
		add_filter(
			'pre_attachment_url_to_postid',
			static function () use ( $attachment_id ) {
				return $attachment_id;
			},
			10,
			2
		);
	}

	/**
	 * Stage a batch hit. WorDBless returns no rows for the attachment lookup,
	 * so short-circuit it with `posts_pre_query` and give the attachment the
	 * `_wp_attached_file` value the mapping reads back.
	 *
	 * @return string The enclosure URL that will resolve to `$attachment_id`.
	 */
	private function seed_batch_hit( int $attachment_id, string $path ): string {
		add_filter(
			'posts_pre_query',
			static function ( $pre, $query ) use ( $attachment_id ) {
				return 'attachment' === $query->get( 'post_type' ) ? array( $attachment_id ) : $pre;
			},
			10,
			2
		);
		add_filter(
			'get_post_metadata',
			static function ( $value, $object_id, $meta_key, $single ) use ( $attachment_id, $path ) {
				if ( $object_id === $attachment_id && '_wp_attached_file' === $meta_key ) {
					return $single ? $path : array( $path );
				}
				return $value;
			},
			10,
			4
		);

		return wp_get_upload_dir()['baseurl'] . '/' . $path;
	}

	/**
	 * The point of the batch: a URL it resolved is answered from the map, not
	 * by going back to core. Core would find nothing here, so the ID can only
	 * have come from the batch.
	 */
	public function test_batch_hit_is_answered_from_the_map() {
		$url = $this->seed_batch_hit( 555, '2024/03/ep-hit.mp3' );

		Episode_Media_Cache::prime( array( $this->seed_episode( 200, $url ) ) );

		$this->assertSame( 555, Episode_Media_Cache::attachment_id( $url ) );
	}

	/**
	 * `attachment_url_to_postid()` lets a plugin short-circuit the whole lookup,
	 * and that override has to beat the batch — otherwise the feed would track
	 * plays and read durations against an attachment the site has overridden.
	 */
	public function test_pre_lookup_filter_overrides_a_batch_hit() {
		$url = $this->seed_batch_hit( 556, '2024/03/ep-pre.mp3' );
		$this->resolve_via_filter( 0 );

		Episode_Media_Cache::prime( array( $this->seed_episode( 201, $url ) ) );

		$this->assertSame( 0, Episode_Media_Cache::attachment_id( $url ) );
	}

	/**
	 * The other end of core's lookup: plugins remapping a found ID have to see
	 * batch hits too.
	 */
	public function test_post_lookup_filter_applies_to_a_batch_hit() {
		$url = $this->seed_batch_hit( 557, '2024/03/ep-post.mp3' );
		add_filter( 'attachment_url_to_postid', static fn () => 777 );

		Episode_Media_Cache::prime( array( $this->seed_episode( 202, $url ) ) );

		$this->assertSame( 777, Episode_Media_Cache::attachment_id( $url ) );
	}

	/**
	 * The batch only matches files under this site's uploads dir. Anything it
	 * misses has to keep reaching core, or offloaded-media sites lose the
	 * attachment — and with it the duration and play tracking.
	 */
	public function test_unresolved_url_still_falls_back_to_core() {
		$this->resolve_via_filter( 9001 );
		$post = $this->seed_episode( 100, self::URL );

		Episode_Media_Cache::prime( array( $post ) );

		$this->assertSame( 9001, Episode_Media_Cache::attachment_id( self::URL ) );
	}

	public function test_url_outside_the_primed_page_falls_back_to_core() {
		$this->resolve_via_filter( 9002 );

		Episode_Media_Cache::prime( array( $this->seed_episode( 101, self::URL ) ) );

		$this->assertSame( 9002, Episode_Media_Cache::attachment_id( 'https://example.com/elsewhere.mp3' ) );
	}

	public function test_attachment_id_is_zero_when_nothing_resolves_the_url() {
		$this->assertSame( 0, Episode_Media_Cache::attachment_id( 'https://example.com/missing.mp3' ) );
	}

	public function test_prime_is_a_no_op_for_an_empty_post_list() {
		Episode_Media_Cache::prime( array() );

		$this->assertSame( 0, Episode_Media_Cache::attachment_id( self::URL ) );
	}

	/**
	 * `the_posts` is a filter, so the list can carry whatever another callback
	 * put there.
	 */
	public function test_non_post_entries_are_skipped() {
		$this->resolve_via_filter( 9003 );
		$post = $this->seed_episode( 102, self::URL );

		Episode_Media_Cache::prime( array( 'not a post', null, $post ) );

		$this->assertSame( 9003, Episode_Media_Cache::attachment_id( self::URL ) );
	}

	/**
	 * Posts routinely accumulate several `enclosure` rows (URL drift across
	 * re-uploads), and any of them can be the one core renders.
	 */
	public function test_posts_with_several_enclosure_rows_prime_cleanly() {
		$this->resolve_via_filter( 9004 );
		$second = 'https://example.com/wp-content/uploads/2024/03/ep-1-remaster.mp3';
		$post   = $this->seed_episode( 103, self::URL, $second );

		Episode_Media_Cache::prime( array( $post ) );

		$this->assertSame( 9004, Episode_Media_Cache::attachment_id( self::URL ) );
		$this->assertSame( 9004, Episode_Media_Cache::attachment_id( $second ) );
	}

	/**
	 * A blank or malformed row must not put an empty key in the batch — and,
	 * more importantly, must not leave the lookup with nothing to match on.
	 * `WP_Meta_Query` drops an `IN` clause whose value is an empty array, so an
	 * unguarded lookup would degrade to a bare `_wp_attached_file` key match
	 * and pull back every attachment on the site.
	 */
	public function test_enclosure_rows_without_a_url_are_ignored() {
		$this->resolve_via_filter( 9005 );
		$queried = array();
		add_filter(
			'posts_pre_query',
			static function ( $pre, $query ) use ( &$queried ) {
				$queried[] = $query->get( 'meta_query' );
				return $pre;
			},
			10,
			2
		);

		Episode_Media_Cache::prime( array( $this->seed_episode( 104, '' ) ) );

		$this->assertSame( array(), $queried, 'No attachment lookup should run when no enclosure URL survived parsing.' );
		$this->assertSame( 9005, Episode_Media_Cache::attachment_id( '' ) );
	}

	/**
	 * A long-lived process (WP-CLI, a warm worker) renders more than one feed,
	 * so one page's results must not answer the next page's lookups.
	 */
	public function test_prime_replaces_the_previous_page() {
		Episode_Media_Cache::prime( array( $this->seed_episode( 105, self::URL ) ) );
		Episode_Media_Cache::prime( array() );

		$this->assertSame( 0, Episode_Media_Cache::attachment_id( self::URL ) );
	}
}
