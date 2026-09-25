<?php
/**
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests\Feed;

use Automattic\Jetpack\Podcast\Feed\Episode_Media_Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Post;

/**
 * One thing matters here: a URL has to resolve exactly the way
 * `attachment_url_to_postid()` would, whether the batch answers it or not.
 * WorDBless returns no rows for the lookup query, so `posts_pre_query` stands
 * in for it and the SQL itself is left to the integration run.
 *
 * @covers \Automattic\Jetpack\Podcast\Feed\Episode_Media_Cache
 */
#[CoversClass( Episode_Media_Cache::class )]
class Episode_Media_Cache_Test extends BaseTestCase {

	private const PATH = '2024/03/episode.mp3';

	protected function tearDown(): void {
		Episode_Media_Cache::prime( array() );
		remove_all_filters( 'pre_attachment_url_to_postid' );
		remove_all_filters( 'attachment_url_to_postid' );
		remove_all_filters( 'posts_pre_query' );
		remove_all_filters( 'get_post_metadata' );
		remove_all_filters( 'upload_dir' );
		wp_cache_flush();
		parent::tearDown();
	}

	/**
	 * Prime a page holding one episode whose enclosure the batch resolves to
	 * `$attachment_id`: `posts_pre_query` stands in for the lookup query, and
	 * `get_post_metadata` gives that attachment the `_wp_attached_file` the
	 * mapping reads back off the result.
	 *
	 * @return string The episode's enclosure URL.
	 */
	private function prime_page_with_episode( int $attachment_id ): string {
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
			static function ( $value, $object_id, $meta_key, $single ) use ( $attachment_id ) {
				if ( $attachment_id === (int) $object_id && '_wp_attached_file' === $meta_key ) {
					return $single ? self::PATH : array( self::PATH );
				}
				return $value;
			},
			10,
			4
		);

		$url = wp_get_upload_dir()['baseurl'] . '/' . self::PATH;
		add_post_meta( 1, 'enclosure', $url . "\n12345\naudio/mpeg\n" );
		Episode_Media_Cache::prime( array( new WP_Post( (object) array( 'ID' => 1 ) ) ) );

		return $url;
	}

	/**
	 * A batch hit has to be indistinguishable from the lookup it replaces: the
	 * resolved ID comes back, and either of core's filters still overrides it.
	 * The filter's return doubles as the expected result.
	 *
	 * @param string|null $filter   Lookup filter to register, if any.
	 * @param int         $expected Resolved attachment ID.
	 * @dataProvider provide_lookup_overrides
	 */
	#[DataProvider( 'provide_lookup_overrides' )]
	public function test_batch_hit_resolves_the_way_core_would( ?string $filter, int $expected ) {
		$url = $this->prime_page_with_episode( 555 );

		if ( null !== $filter ) {
			add_filter(
				$filter,
				static function () use ( $expected ) {
					return $expected;
				}
			);
		}

		$this->assertSame( $expected, Episode_Media_Cache::attachment_id( $url ) );
	}

	public static function provide_lookup_overrides(): array {
		return array(
			'batch answers'            => array( null, 555 ),
			'pre-lookup short-circuit' => array( 'pre_attachment_url_to_postid', 0 ),
			'post-lookup remap'        => array( 'attachment_url_to_postid', 777 ),
		);
	}

	/**
	 * Imports and restores leave several records on one file — including one
	 * record holding several `_wp_attached_file` rows, where only the second is
	 * the path being asked for. The lookup matches either row, so both records
	 * are candidates, and core picks between them in `postmeta` order a joined
	 * query can't reproduce. Ambiguous paths go uncached.
	 */
	public function test_ambiguous_path_defers_to_core() {
		add_filter(
			'posts_pre_query',
			static function ( $pre, $query ) {
				return 'attachment' === $query->get( 'post_type' ) ? array( 10, 20 ) : $pre;
			},
			10,
			2
		);
		// 10 was restored onto a new path and kept its old row; 20 holds only the
		// path the feed asks for.
		add_filter(
			'get_post_metadata',
			static function ( $value, $object_id, $meta_key, $single ) {
				if ( '_wp_attached_file' !== $meta_key ) {
					return $value;
				}
				$values = 10 === (int) $object_id ? array( '2024/01/original.mp3', self::PATH ) : array( self::PATH );
				return $single ? $values[0] : $values;
			},
			10,
			4
		);

		$url = wp_get_upload_dir()['baseurl'] . '/' . self::PATH;
		add_post_meta( 1, 'enclosure', $url . "\n12345\naudio/mpeg\n" );
		Episode_Media_Cache::prime( array( new WP_Post( (object) array( 'ID' => 1 ) ) ) );

		// Both branches run this filter, so the value it receives is what separates
		// them: core's own lookup finds nothing here and passes null, a batch hit
		// passes the ID it cached.
		$resolved = 'never ran';
		add_filter(
			'attachment_url_to_postid',
			static function ( $post_id ) use ( &$resolved ) {
				$resolved = $post_id;
				return $post_id;
			}
		);

		Episode_Media_Cache::attachment_id( $url );

		$this->assertNull( $resolved, 'An ambiguous path was answered from the batch instead of left to core.' );
	}

	/**
	 * WordPress.com forces `<enclosure>` URLs to `http` on `rss_enclosure`, ahead
	 * of our own callback, so the URL reaching the lookup isn't the one the meta
	 * row holds. Both ends reduce to the path, so the batch still answers.
	 */
	public function test_scheme_rewritten_after_priming_still_hits_the_batch() {
		add_filter(
			'upload_dir',
			static function ( $dir ) {
				$dir['url']     = 'https://example.org/wp-content/uploads';
				$dir['baseurl'] = 'https://example.org/wp-content/uploads';
				return $dir;
			}
		);
		$url = $this->prime_page_with_episode( 555 );

		$http = str_replace( 'https://', 'http://', $url );

		$this->assertNotSame( $url, $http, 'The URL under test has to differ from the one the batch was primed with.' );
		$this->assertSame( 555, Episode_Media_Cache::attachment_id( $http ) );
	}

	/**
	 * The batch only matches files under this site's uploads dir, so a miss has
	 * to keep reaching core — offloaded-media plugins map their CDN URLs back
	 * to an attachment through its filters, and without that those sites lose
	 * their episode durations and play tracking.
	 */
	public function test_url_the_batch_missed_falls_back_to_core() {
		$this->prime_page_with_episode( 555 );
		add_filter(
			'pre_attachment_url_to_postid',
			static function () {
				return 9001;
			}
		);

		$this->assertSame( 9001, Episode_Media_Cache::attachment_id( 'https://cdn.example.com/episode.mp3' ) );
	}

	/**
	 * `WP_Meta_Query` drops an `IN` clause whose value is an empty array, so
	 * without a guard a page whose enclosure rows yield no usable URL would
	 * degrade to a bare `_wp_attached_file` key match and pull back every
	 * attachment on the site.
	 */
	public function test_no_lookup_runs_when_no_enclosure_url_survives_parsing() {
		$queried = false;
		add_filter(
			'posts_pre_query',
			static function ( $pre ) use ( &$queried ) {
				$queried = true;
				return $pre;
			}
		);
		add_post_meta( 2, 'enclosure', "\n12345\naudio/mpeg\n" );

		Episode_Media_Cache::prime( array( new WP_Post( (object) array( 'ID' => 2 ) ) ) );

		$this->assertFalse( $queried, 'No attachment lookup should run when no enclosure URL survived parsing.' );
	}
}
