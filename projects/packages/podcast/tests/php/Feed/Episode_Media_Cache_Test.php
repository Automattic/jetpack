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
 * The batch query itself needs a real database, so it is covered by the
 * integration run rather than here; WorDBless returns no rows for it. What
 * these cover is the contract around it — that anything the batch didn't
 * resolve still reaches `attachment_url_to_postid()` and its filters.
 *
 * @covers \Automattic\Jetpack\Podcast\Feed\Episode_Media_Cache
 */
#[CoversClass( Episode_Media_Cache::class )]
class Episode_Media_Cache_Test extends BaseTestCase {

	private const URL = 'https://example.com/wp-content/uploads/2024/03/ep-1.mp3';

	protected function tearDown(): void {
		Episode_Media_Cache::reset();
		remove_all_filters( 'pre_attachment_url_to_postid' );
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
	 * A blank or malformed row must not put an empty key in the batch.
	 */
	public function test_enclosure_rows_without_a_url_are_ignored() {
		$this->resolve_via_filter( 9005 );
		$post = $this->seed_episode( 104, '' );

		Episode_Media_Cache::prime( array( $post ) );

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
